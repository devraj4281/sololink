import { useEffect, useRef } from "react";
import { useCallStore } from "../../store/useCallStore";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Minimize2 } from "lucide-react";

function CallScreen() {
  const {
    callStatus,
    activeCall,
    localStream,
    remoteStream,
    endCall,
    toggleAudio,
    toggleVideo,
    isAudioMuted,
    isVideoMuted,
    callUIMode,
    setCallUIMode,
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoMuted]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callStatus !== "calling" && callStatus !== "active") return null;
  if (callUIMode === "minimized") return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md sm:p-6 transition-all duration-300">
      <div
        className="relative w-full h-full sm:h-auto sm:aspect-video sm:max-h-[85vh] sm:max-w-5xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "var(--surface-lowest)" }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 bg-gradient-to-b from-black/60 to-transparent text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            {activeCall?.user?.profilePic ? (
              <img src={activeCall.user.profilePic} className="w-10 h-10 rounded-full object-cover border border-white/20" alt="avatar" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--surface-high)" }}>
                <User className="w-6 h-6" style={{ color: "var(--on-surface-variant)" }} />
              </div>
            )}
            <div>
              <h3 className="font-semibold">{activeCall?.user?.fullName || "Unknown User"}</h3>
              <p className="text-xs opacity-75 capitalize">
                {callStatus === "calling" ? "Calling..." : `${activeCall?.type?.replace("call_", "") || "voice"} call`}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setCallUIMode("minimized")}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-md"
            title="Minimize"
          >
            <Minimize2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {/* Remote Video (Main) */}
          {callStatus === "active" && remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-white/50 animate-pulse">
              {activeCall?.user?.profilePic ? (
                <img src={activeCall.user.profilePic} className="w-32 h-32 rounded-full object-cover mb-4 opacity-50" alt="avatar" />
              ) : (
                <div className="w-32 h-32 rounded-full flex items-center justify-center mb-4 opacity-50" style={{ background: "var(--surface-high)" }}>
                  <User className="w-16 h-16" style={{ color: "var(--on-surface-variant)" }} />
                </div>
              )}
              <p className="text-lg">{callStatus === "calling" ? "Calling..." : "Connecting..."}</p>
            </div>
          )}

          {/* Local Video (PIP) */}
          {localStream && activeCall?.type === "call_video" && (
            <div
              className={`absolute bottom-24 right-4 sm:bottom-6 sm:right-6 w-28 h-40 sm:w-48 sm:h-64 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 z-20 transition-all ${
                isVideoMuted ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
              }`}
              style={{ background: "var(--surface-high)" }}
            >
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-6 z-30">
          {/* Mute Button */}
          <button
            onClick={toggleAudio}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: isAudioMuted ? "#ef4444" : "rgba(255,255,255,0.2)",
              color: "white",
              backdropFilter: "blur(8px)",
            }}
            title={isAudioMuted ? "Unmute" : "Mute"}
          >
            {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-lg"
            style={{ background: "#ef4444", color: "white" }}
            title="End call"
          >
            <PhoneOff className="w-8 h-8" />
          </button>

          {/* Toggle Video (only for video calls) */}
          {activeCall?.type === "call_video" && (
            <button
              onClick={toggleVideo}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                background: isVideoMuted ? "#ef4444" : "rgba(255,255,255,0.2)",
                color: "white",
                backdropFilter: "blur(8px)",
              }}
              title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CallScreen;
