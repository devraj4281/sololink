import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export const useCallStore = create((set, get) => ({
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  callStatus: "idle", // 'idle', 'ringing', 'calling', 'active'
  incomingCall: null,
  activeCall: null,
  callStartTime: null,
  isAudioMuted: false,
  isVideoMuted: false,

  initMedia: async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
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
        track.enabled = isAudioMuted; // Toggle logic (if muted, enable it)
      });
      set({ isAudioMuted: !isAudioMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoMuted } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoMuted; // Toggle
      });
      set({ isVideoMuted: !isVideoMuted });
    }
  },

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

    set({ peerConnection: pc });
    return pc;
  },

  initiateCall: async (userToCall, type) => {
    const { initMedia, setupPeerConnection, endCall } = get();
    const { authUser, socket } = useAuthStore.getState();

    const stream = await initMedia(type);
    if (!stream) return;

    set({ callStatus: "calling", activeCall: { user: userToCall, type } });

    const pc = setupPeerConnection(userToCall._id);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("callUser", {
        userToCall: userToCall._id,
        signalData: offer,
        from: authUser._id,
        name: authUser.fullName,
        type,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error initiating call");
      endCall();
    }
  },

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
      });
    } catch (error) {
      console.error(error);
      toast.error("Error answering call");
      endCall();
    }
  },

  rejectCall: () => {
    const { incomingCall } = get();
    const { socket } = useAuthStore.getState();

    if (incomingCall) {
      socket.emit("rejectCall", { to: incomingCall.from, type: incomingCall.type });
    }
    set({ incomingCall: null, callStatus: "idle" });
  },

  endCall: () => {
    const { activeCall, incomingCall, peerConnection, localStream, callStatus, callStartTime } = get();
    const { socket } = useAuthStore.getState();

    let duration = 0;
    if (callStartTime) {
      duration = Math.floor((Date.now() - callStartTime) / 1000);
    }

    if (activeCall) {
      const to = activeCall.user._id || activeCall.user;
      if (callStatus === "calling") {
        socket.emit("cancelCall", { to, type: activeCall.type });
      } else {
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
      activeCall: null,
      incomingCall: null,
      callStartTime: null,
      isAudioMuted: false,
      isVideoMuted: false,
    });
  },

  subscribeToCallEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

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
      toast("Call ended", { icon: "👋" });
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
  },

  unsubscribeFromCallEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("incomingCall");
    socket.off("callAccepted");
    socket.off("callRejected");
    socket.off("callEnded");
    socket.off("iceCandidate");
  },
}));
