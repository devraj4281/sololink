import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // WebRTC Signaling Events
  socket.on("callUser", ({ userToCall, signalData, from, name, type }) => {
    const receiverSocketId = getReceiverSocketId(userToCall);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", { signal: signalData, from, name, type });
    }
  });

  socket.on("answerCall", ({ to, signal }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callAccepted", signal);
    }
  });

  socket.on("rejectCall", async ({ to, type }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callRejected");
    }

    // Save missed/declined call log
    try {
      // If rejecting, the person rejecting is the receiver.
      // Wait, if I am rejecting, I am socket.userId. The caller is `to`.
      // The caller initiated, so senderId = to, receiverId = socket.userId
      const newMessage = new Message({
        senderId: to,
        receiverId: socket.userId,
        type: type || "call_voice",
        callDuration: 0,
        callStatus: "declined",
      });
      await newMessage.save();

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
      // Caller cancelled before pickup. Sender is socket.userId
      const newMessage = new Message({
        senderId: socket.userId,
        receiverId: to,
        type: type || "call_voice",
        callDuration: 0,
        callStatus: "missed",
      });
      await newMessage.save();

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
      const newMessage = new Message({
        senderId: socket.userId,
        receiverId: to,
        type: type || "call_voice",
        callDuration: duration || 0,
        callStatus: "completed",
      });
      await newMessage.save();

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
});

export { io, app, server };
