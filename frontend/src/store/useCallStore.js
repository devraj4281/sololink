import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export const useCallStore = create(
  persist(
    (set, get) => ({
      // ── Media & WebRTC ───────────────────────────────────────────────────
      localStream: null,
      remoteStream: null,
      peerConnection: null,

      // ── Call Status ──────────────────────────────────────────────────────
      // 'idle' | 'ringing' | 'calling' | 'active' | 'reconnecting'
      callStatus: "idle",
      callUIMode: "fullscreen", // 'fullscreen' | 'minimized'
      incomingCall: null,
      activeCall: null,       // { user, type }
      callStartTime: null,

      // ── Reconnection ─────────────────────────────────────────────────────
      reconnectAvailable: null,  // CallSession object from server when a stale call is found
      reconnectTimer: null,      // Timeout ref for 30s deadline
      reconnectSessionId: null,  // ID of the session being rejoined

      // ── Audio/Video controls ─────────────────────────────────────────────
      isAudioMuted: false,
      isVideoMuted: false,

      setCallUIMode: (mode) => set({ callUIMode: mode }),

      // ── Media Initialization ──────────────────────────────────────────────
      initMedia: async (type) => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: type === "call_video",
            audio: true,
          });
          set({ localStream: stream, isAudioMuted: false, isVideoMuted: false });
          return stream;
        } catch (error) {
          toast.error(`Could not access camera/microphone: ${error.message}`);
          return null;
        }
      },

      toggleAudio: () => {
        const { localStream, isAudioMuted } = get();
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            track.enabled = isAudioMuted;
          });
          set({ isAudioMuted: !isAudioMuted });
        }
      },

      toggleVideo: () => {
        const { localStream, isVideoMuted } = get();
        if (localStream) {
          localStream.getVideoTracks().forEach((track) => {
            track.enabled = isVideoMuted;
          });
          set({ isVideoMuted: !isVideoMuted });
        }
      },

      // ── PeerConnection Setup ──────────────────────────────────────────────
      setupPeerConnection: (otherUserId) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        const { localStream } = get();
        const socket = useAuthStore.getState().socket;

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });
        }

        pc.ontrack = (event) => {
          set({ remoteStream: event.streams[0] });
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("iceCandidate", {
              to: otherUserId,
              candidate: event.candidate,
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (
            pc.iceConnectionState === "disconnected" ||
            pc.iceConnectionState === "failed"
          ) {
            toast("Connection lost. Waiting for peer…", {
              icon: "⏳",
              id: "conn-lost",
            });
          } else if (pc.iceConnectionState === "connected") {
            toast.dismiss("conn-lost");
          }
        };

        set({ peerConnection: pc });
        return pc;
      },

      // ── Initiate Call ─────────────────────────────────────────────────────
      initiateCall: async (userToCall, type) => {
        const { initMedia, setupPeerConnection, endCall } = get();
        const { authUser, socket } = useAuthStore.getState();

        const stream = await initMedia(type);
        if (!stream) return;

        const callType = type === "video" ? "call_video" : "call_voice";
        set({ callStatus: "calling", activeCall: { user: userToCall, type: callType } });

        const pc = setupPeerConnection(userToCall._id);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit("callUser", {
            userToCall: userToCall._id,
            signalData: offer,
            from: authUser._id,
            name: authUser.fullName,
            type: callType,
          });
        } catch (error) {
          console.error(error);
          toast.error("Error initiating call");
          endCall();
        }
      },

      // ── Answer Call ───────────────────────────────────────────────────────
      answerCall: async () => {
        const { incomingCall, initMedia, setupPeerConnection, endCall } = get();
        const { socket } = useAuthStore.getState();

        if (!incomingCall) return;

        const stream = await initMedia(incomingCall.type);
        if (!stream) {
          socket.emit("rejectCall", { to: incomingCall.from });
          set({ incomingCall: null, callStatus: "idle" });
          return;
        }

        set({
          callStatus: "active",
          activeCall: { user: incomingCall.user, type: incomingCall.type },
          callStartTime: Date.now(),
        });

        const pc = setupPeerConnection(incomingCall.from);

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("answerCall", {
            to: incomingCall.from,
            signal: answer,
            type: incomingCall.type,
          });
        } catch (error) {
          console.error(error);
          toast.error("Error answering call");
          endCall();
        }
      },

      // ── Reject / Cancel / End ─────────────────────────────────────────────
      rejectCall: () => {
        const { incomingCall } = get();
        const { socket } = useAuthStore.getState();

        if (incomingCall) {
          socket.emit("rejectCall", { to: incomingCall.from, type: incomingCall.type });
        }
        set({ incomingCall: null, callStatus: "idle" });
      },

      endCall: () => {
        const {
          activeCall,
          incomingCall,
          peerConnection,
          localStream,
          callStatus,
          callStartTime,
          reconnectTimer,
        } = get();
        const { socket } = useAuthStore.getState();

        // Clear any pending reconnect timeout
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
        }

        let duration = 0;
        if (callStartTime) {
          duration = Math.floor((Date.now() - callStartTime) / 1000);
        }

        if (activeCall) {
          const to = activeCall.user._id || activeCall.user;
          if (callStatus === "calling") {
            socket.emit("cancelCall", { to, type: activeCall.type });
          } else if (callStatus === "active" || callStatus === "reconnecting") {
            socket.emit("endCall", { to, type: activeCall.type, duration });
          }
        } else if (incomingCall && callStatus === "ringing") {
          socket.emit("rejectCall", { to: incomingCall.from, type: incomingCall.type });
        }

        if (peerConnection) {
          peerConnection.close();
        }

        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }

        set({
          peerConnection: null,
          localStream: null,
          remoteStream: null,
          callStatus: "idle",
          callUIMode: "fullscreen",
          activeCall: null,
          incomingCall: null,
          callStartTime: null,
          isAudioMuted: false,
          isVideoMuted: false,
          reconnectAvailable: null,
          reconnectTimer: null,
          reconnectSessionId: null,
        });
      },

      // ── Reconnection Flow ─────────────────────────────────────────────────

      /**
       * Called on mount if sessionStorage has stale call data.
       * Hits the REST API to confirm whether the call is still ongoing server-side.
       */
      checkActiveCall: async () => {
        const { callStatus, activeCall } = get();
        const { authUser } = useAuthStore.getState();

        // Only run if sessionStorage says we were in a call
        if (callStatus !== "active" || !activeCall || !authUser) return;

        // Reset to idle immediately — we'll set proper state from server response
        set({ callStatus: "idle" });

        try {
          const response = await axiosInstance.get("/calls/active");
          const session = response.data;

          // Server confirms call is still active → show the modal
          set({ reconnectAvailable: session });
        } catch (error) {
          if (error.response?.status === 404) {
            // Call ended while we were away
            toast("The call ended while you were away.", { icon: "📵", duration: 4000 });
          } else {
            console.error("Error checking active call:", error);
          }
          // Clear stale sessionStorage data in all failure cases
          get().clearStaleCall();
        }
      },

      /**
       * Triggered when user clicks "Reconnect" in the modal.
       * Requests media, creates RTCPeerConnection, emits call:rejoin,
       * and starts the 30-second timeout.
       */
      rejoinCall: async () => {
        const { reconnectAvailable, initMedia, setupPeerConnection, clearStaleCall, handleReconnectTimeout } = get();
        const { socket, authUser } = useAuthStore.getState();

        if (!reconnectAvailable) return;

        const session = reconnectAvailable;
        const isCallerMe = session.callerId._id === authUser._id;
        const otherUser = isCallerMe ? session.receiverId : session.callerId;

        // Request camera/mic
        const stream = await initMedia(session.type);
        if (!stream) {
          toast.error("Could not access camera/microphone. Cannot reconnect.");
          return;
        }

        set({
          callStatus: "reconnecting",
          activeCall: { user: otherUser, type: session.type },
          callStartTime: session.startedAt ? new Date(session.startedAt).getTime() : null,
          reconnectAvailable: null,
          reconnectSessionId: session._id,
        });

        // Create peer connection (roles assigned by server after call:rejoin)
        setupPeerConnection(otherUser._id);

        // Tell server we're rejoining
        socket.emit("call:rejoin", { callSessionId: session._id });

        // Start 30s timeout
        const timer = setTimeout(() => {
          handleReconnectTimeout();
        }, 30000);

        set({ reconnectTimer: timer });
      },

      /**
       * Fires after 30 seconds if reconnection never establishes.
       */
      handleReconnectTimeout: () => {
        const { reconnectSessionId, endCall } = get();
        const { socket } = useAuthStore.getState();

        toast.error("Reconnection timed out. The call has ended.", { duration: 5000 });

        if (reconnectSessionId) {
          socket.emit("call:rejoin-timeout", { callSessionId: reconnectSessionId });
        }

        endCall();
      },

      /**
       * User clicked Dismiss, or call was confirmed ended.
       * Clears all call-related state including sessionStorage entry.
       */
      clearStaleCall: () => {
        const { reconnectTimer, peerConnection, localStream } = get();

        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (peerConnection) peerConnection.close();
        if (localStream) localStream.getTracks().forEach((t) => t.stop());

        set({
          peerConnection: null,
          localStream: null,
          remoteStream: null,
          callStatus: "idle",
          callUIMode: "fullscreen",
          activeCall: null,
          incomingCall: null,
          callStartTime: null,
          isAudioMuted: false,
          isVideoMuted: false,
          reconnectAvailable: null,
          reconnectTimer: null,
          reconnectSessionId: null,
        });
      },

      // ── Socket Event Subscriptions ────────────────────────────────────────
      subscribeToCallEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // ── Incoming new call ──
        socket.on("incomingCall", ({ signal, from, name, type }) => {
          const { callStatus } = get();
          if (callStatus !== "idle") {
            socket.emit("rejectCall", { to: from });
            return;
          }
          set({
            callStatus: "ringing",
            incomingCall: { signal, from, user: { _id: from, fullName: name }, type },
          });
        });

        // ── Call accepted by remote peer ──
        socket.on("callAccepted", async (signal) => {
          const { peerConnection } = get();
          if (peerConnection) {
            try {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
              set({ callStatus: "active", callStartTime: Date.now() });
            } catch (error) {
              console.error("Error setting remote desc on accept", error);
            }
          }
        });

        socket.on("callRejected", () => {
          toast("Call declined", { icon: "🚫" });
          get().endCall();
        });

        socket.on("callEnded", () => {
          // This also fires via connectionStateRecovery if peer ended while we were disconnected
          toast("Call ended", { icon: "👋" });
          get().endCall();
        });

        socket.on("callCancelled", () => {
          toast("Call cancelled", { icon: "↩️" });
          get().endCall();
        });

        socket.on("iceCandidate", async (candidate) => {
          const { peerConnection } = get();
          if (peerConnection) {
            try {
              await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
              console.error("Error adding ice candidate", error);
            }
          }
        });

        // ─────────────────────────────────────────────────────────────────
        // Reconnection socket events
        // ─────────────────────────────────────────────────────────────────

        // Fallback: server detected an active session when socket connected
        // (fires only when sessionStorage is absent, e.g. new tab / private mode)
        socket.on("call:reconnection-available", (session) => {
          const { callStatus, reconnectAvailable } = get();
          // Don't override if we already discovered it via REST API
          if (callStatus === "idle" && !reconnectAvailable) {
            set({ reconnectAvailable: session });
          }
        });

        // Server confirmed our rejoin request and assigned our role
        socket.on("call:rejoin-acknowledged", async ({ shouldSendOffer, session }) => {
          const { peerConnection, clearStaleCall } = get();
          const { socket: sock } = useAuthStore.getState();
          const { authUser } = useAuthStore.getState();

          if (!peerConnection) return;

          const isCallerMe = session.callerId._id === authUser._id;
          const otherUserId = isCallerMe ? session.receiverId._id : session.callerId._id;

          if (shouldSendOffer) {
            // We're the original caller — create and send a new offer
            try {
              const offer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(offer);
              sock.emit("renegotiateOffer", { to: otherUserId, signal: offer });
            } catch (err) {
              console.error("Error creating rejoin offer:", err);
              clearStaleCall();
            }
          }
          // If shouldSendOffer === false: we wait for the offer from the peer
        });

        // Peer is reconnecting — we need to send them a new offer (if we're the caller)
        socket.on("call:peer-reconnecting", async ({ from, shouldSendOffer }) => {
          const { peerConnection, callStatus } = get();
          const { socket: sock } = useAuthStore.getState();

          toast(`Peer is reconnecting…`, { icon: "⏳", id: "peer-reconnect", duration: 15000 });

          if (!shouldSendOffer || !peerConnection) return;

          // Small delay to let the peer's new PC stabilise
          await new Promise((r) => setTimeout(r, 500));

          try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            sock.emit("renegotiateOffer", { to: from, signal: offer });
          } catch (err) {
            console.error("Error creating offer for reconnecting peer:", err);
          }
        });

        // Rejoin failed (call already ended or unauthorized)
        socket.on("call:rejoin-failed", ({ reason }) => {
          if (reason === "ended") {
            toast("This call has already ended.", { icon: "📵", duration: 4000 });
          } else {
            toast.error("Could not rejoin the call.");
          }
          get().clearStaleCall();
        });

        // ─────────────────────────────────────────────────────────────────
        // WebRTC renegotiation relay
        // ─────────────────────────────────────────────────────────────────
        socket.on("renegotiateOffer", async ({ signal, from }) => {
          const { peerConnection, setupPeerConnection, activeCall, initMedia } = get();
          const { socket: sock } = useAuthStore.getState();

          let pc = peerConnection;
          if (!pc) {
            await initMedia(activeCall?.type || "call_voice");
            pc = setupPeerConnection(from);
          }

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sock.emit("renegotiateAnswer", { to: from, signal: answer });

            // We received an answer from the reconnecting peer — call is active again
            toast.dismiss("peer-reconnect");
            set({ callStatus: "active" });
          } catch (error) {
            console.error("Error handling renegotiate offer:", error);
          }
        });

        socket.on("renegotiateAnswer", async (signal) => {
          const { peerConnection } = get();
          if (peerConnection) {
            try {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
              toast.dismiss("peer-reconnect");
              set({ callStatus: "active" });
            } catch (error) {
              console.error("Error setting renegotiated remote description:", error);
            }
          }
        });
      },

      unsubscribeFromCallEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("incomingCall");
        socket.off("callAccepted");
        socket.off("callRejected");
        socket.off("callEnded");
        socket.off("callCancelled");
        socket.off("iceCandidate");
        socket.off("call:reconnection-available");
        socket.off("call:rejoin-acknowledged");
        socket.off("call:peer-reconnecting");
        socket.off("call:rejoin-failed");
        socket.off("renegotiateOffer");
        socket.off("renegotiateAnswer");
      },
    }),
    {
      name: "call-session-storage",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the minimal data needed to detect a stale call on reload.
      // Non-serializable objects (stream, peerConnection, timers) are excluded.
      partialize: (state) => ({
        activeCall: state.activeCall,
        callStatus: state.callStatus,
        callStartTime: state.callStartTime,
      }),
    }
  )
);
