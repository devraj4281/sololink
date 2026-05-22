import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";
import CallSession from "../models/CallSession.js";
import conversationRepository from "../repositories/conversation.repository.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow any localhost port in development (Vite shifts 5173→5174→5175)
      if (ENV.NODE_ENV === "development" && (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin))) {
        return callback(null, true);
      }
      if (origin === ENV.CLIENT_URL || !origin) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
  // Buffers events for up to 2 minutes during disconnects and replays them
  // on reconnect — this ensures callEnded fires even if the peer refreshed.
  // skipMiddlewares: false (default) ensures auth middleware always re-runs
  // so socket.userId is always available.
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false,
  },
});

// Apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// userId → Set of socketIds map (single-server; migrate to Redis adapter for multi-instance)
const userSocketMap = {};

export function getReceiverSocketId(userId) {
  const sockets = userSocketMap[userId?.toString()];
  if (sockets && sockets.size > 0) {
    return Array.from(sockets)[0];
  }
  return undefined;
}

io.on("connection", async (socket) => {
  console.log("A user connected", socket.user.fullName, socket.recovered ? "(recovered)" : "(new)");

  const userId = socket.userId;
  if (!userSocketMap[userId]) {
    userSocketMap[userId] = new Set();
  }
  userSocketMap[userId].add(socket.id);

  // Broadcast updated online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // --- Reconnection Availability Check ---
  // Only run on fresh connections (not Socket.io session recovery).
  // If the client already has call data in sessionStorage, they will call
  // GET /api/calls/active directly. This socket event is a fallback for
  // cases where sessionStorage was cleared (e.g. new tab, private browsing).
  if (!socket.recovered) {
    try {
      const activeSession = await CallSession.findOne({
        $or: [{ callerId: userId }, { receiverId: userId }],
        status: "active",
      }).populate("callerId receiverId", "fullName profilePic _id");

      if (activeSession) {
        socket.emit("call:reconnection-available", activeSession);
      }
    } catch (err) {
      console.error("Error checking call session on connect:", err);
    }
  }

  // ─── Disconnect ───────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user?.fullName);
    if (userSocketMap[userId]) {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) {
        delete userSocketMap[userId];
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // ─── WebRTC Signaling ─────────────────────────────────────────────────────
  socket.on("callUser", ({ userToCall, signalData, from, name, type }) => {
    const receiverSocketId = getReceiverSocketId(userToCall);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", { signal: signalData, from, name, type });
    }
  });

  socket.on("answerCall", async ({ to, signal, type }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callAccepted", signal);
    }
    try {
      await CallSession.create({
        callerId: to,
        receiverId: socket.userId,
        status: "active",
        type: type || "call_voice",
      });
    } catch (err) {
      console.error("Error creating call session:", err);
    }
  });

  socket.on("rejectCall", async ({ to, type }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callRejected");
    }

    try {
      await CallSession.updateMany(
        {
          $or: [
            { callerId: socket.userId, receiverId: to },
            { callerId: to, receiverId: socket.userId },
          ],
          status: "active",
        },
        { $set: { status: "ended", endedAt: new Date() } }
      );

      const newMessage = new Message({
        senderId: to,
        receiverId: socket.userId,
        type: type || "call_voice",
        callDuration: 0,
        callStatus: "declined",
      });
      await newMessage.save();

      // Pre-compute conversation cached preview
      await conversationRepository.updateLastMessage(to, socket.userId, {
        text: "[Declined Call]",
        type: type || "call_voice",
        senderId: to,
        createdAt: newMessage.createdAt,
      });

      socket.emit("newMessage", newMessage);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    } catch (error) {
      console.error("Error saving call log:", error);
    }
  });

  socket.on("cancelCall", async ({ to, type }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callCancelled");
    }

    try {
      await CallSession.updateMany(
        {
          $or: [
            { callerId: socket.userId, receiverId: to },
            { callerId: to, receiverId: socket.userId },
          ],
          status: "active",
        },
        { $set: { status: "ended", endedAt: new Date() } }
      );

      const newMessage = new Message({
        senderId: socket.userId,
        receiverId: to,
        type: type || "call_voice",
        callDuration: 0,
        callStatus: "missed",
      });
      await newMessage.save();

      // Pre-compute conversation cached preview
      await conversationRepository.updateLastMessage(socket.userId, to, {
        text: "[Missed Call]",
        type: type || "call_voice",
        senderId: socket.userId,
        createdAt: newMessage.createdAt,
      });

      socket.emit("newMessage", newMessage);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    } catch (error) {
      console.error("Error saving call log:", error);
    }
  });

  socket.on("endCall", async ({ to, type, duration }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callEnded");
    }

    try {
      await CallSession.updateMany(
        {
          $or: [
            { callerId: socket.userId, receiverId: to },
            { callerId: to, receiverId: socket.userId },
          ],
          status: "active",
        },
        { $set: { status: "ended", endedAt: new Date() } }
      );

      const newMessage = new Message({
        senderId: socket.userId,
        receiverId: to,
        type: type || "call_voice",
        callDuration: duration || 0,
        callStatus: "completed",
      });
      await newMessage.save();

      // Pre-compute conversation cached preview
      await conversationRepository.updateLastMessage(socket.userId, to, {
        text: `[Call Ended - ${duration || 0}s]`,
        type: type || "call_voice",
        senderId: socket.userId,
        createdAt: newMessage.createdAt,
      });

      socket.emit("newMessage", newMessage);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    } catch (error) {
      console.error("Error saving call log:", error);
    }
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("iceCandidate", candidate);
    }
  });

  // ─── Explicit Reconnection Flow ───────────────────────────────────────────
  socket.on("call:rejoin", async ({ callSessionId }) => {
    try {
      const session = await CallSession.findById(callSessionId)
        .populate("callerId receiverId", "fullName profilePic _id");

      if (!session || session.status !== "active") {
        socket.emit("call:rejoin-failed", { reason: "ended" });
        return;
      }

      const callerIdStr = session.callerId._id.toString();
      const receiverIdStr = session.receiverId._id.toString();
      const userIdStr = userId.toString();

      // Validate the user is actually part of this call
      if (callerIdStr !== userIdStr && receiverIdStr !== userIdStr) {
        socket.emit("call:rejoin-failed", { reason: "unauthorized" });
        return;
      }

      // The original caller always sends the new WebRTC offer on reconnect.
      // This is deterministic and prevents the race condition where both peers
      // try to send offers simultaneously.
      const isOriginalCaller = callerIdStr === userIdStr;
      const peerId = isOriginalCaller ? receiverIdStr : callerIdStr;
      const peerSocketId = getReceiverSocketId(peerId);

      // Update reconnecting tracking on the session
      await CallSession.findByIdAndUpdate(callSessionId, {
        $set: {
          reconnectingUserId: userId,
          reconnectAttemptAt: new Date(),
        },
      });

      // Acknowledge the rejoining user and tell them their role
      socket.emit("call:rejoin-acknowledged", {
        shouldSendOffer: isOriginalCaller,
        sessionId: callSessionId,
        session,
      });

      if (peerSocketId) {
        // Peer is online — tell them about the reconnect and their role
        const peerIsOriginalCaller = callerIdStr === peerId;
        io.to(peerSocketId).emit("call:peer-reconnecting", {
          from: userId,
          shouldSendOffer: peerIsOriginalCaller,
        });
      }
      // If peer is offline, they will see call:reconnection-available when
      // they connect and can then rejoin on their own.
    } catch (err) {
      console.error("Error handling call:rejoin:", err);
      socket.emit("call:rejoin-failed", { reason: "server_error" });
    }
  });

  // Called by client after 30 seconds with no connection established
  socket.on("call:rejoin-timeout", async ({ callSessionId }) => {
    try {
      const session = await CallSession.findByIdAndUpdate(
        callSessionId,
        { $set: { status: "ended", endedAt: new Date() } },
        { new: true }
      );

      if (session) {
        // Save a missed call log so it appears in call history
        const callerId = session.callerId.toString();
        const receiverId = session.receiverId.toString();

        const newMessage = new Message({
          senderId: callerId,
          receiverId: receiverId,
          type: session.type,
          callDuration: 0,
          callStatus: "missed",
        });
        await newMessage.save();

        // Pre-compute conversation cached preview
        await conversationRepository.updateLastMessage(callerId, receiverId, {
          text: "[Missed Call]",
          type: session.type,
          senderId: callerId,
          createdAt: newMessage.createdAt,
        });

        // Notify both participants
        [callerId, receiverId].forEach((uid) => {
          const sid = getReceiverSocketId(uid);
          if (sid) io.to(sid).emit("newMessage", newMessage);
        });
      }
    } catch (err) {
      console.error("Error handling call:rejoin-timeout:", err);
    }
  });

  // ─── WebRTC Renegotiation (relay for reconnect offer/answer) ─────────────
  socket.on("renegotiateOffer", ({ to, signal }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("renegotiateOffer", { signal, from: socket.userId });
    }
  });

  socket.on("renegotiateAnswer", ({ to, signal }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("renegotiateAnswer", signal);
    }
  });

  // ─── Typing Indicators ────────────────────────────────────────────────────
  socket.on("typing", ({ to }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId: socket.userId });
    }
  });

  socket.on("stopTyping", ({ to }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { userId: socket.userId });
    }
  });
});

export { io, app, server };
