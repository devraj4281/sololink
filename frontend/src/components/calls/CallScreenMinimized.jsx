import { useEffect, useRef } from "react";
import { useCallStore } from "../../store/useCallStore";
import { Mic, MicOff, PhoneOff, Maximize2, User } from "lucide-react";
import Draggable from "react-draggable";

function CallScreenMinimized() {
  const {
    callStatus,
    activeCall,
    remoteStream,
    endCall,
    toggleAudio,
    isAudioMuted,
    callUIMode,
    setCallUIMode,
  } = useCallStore();

  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if ((callStatus !== "calling" && callStatus !== "active") || callUIMode !== "minimized") return null;

  return (
    <Draggable bounds="parent" defaultPosition={{ x: 0, y: 0 }}>
      <div 
        className="fixed bottom-6 right-6 z-[9999] w-64 rounded-2xl overflow-hidden shadow-2xl cursor-move border border-white/10"
        style={{ background: "var(--surface-high)", backdropFilter: "blur(12px)" }}
      >
        {/* Video or Avatar Area */}
        <div className="relative h-36 bg-black flex items-center justify-center">
          {callStatus === "active" && remoteStream && activeCall?.type === "call_video" ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="flex flex-col items-center opacity-70">
              {activeCall?.user?.profilePic ? (
                <img src={activeCall.user.profilePic} className="w-16 h-16 rounded-full object-cover mb-2" alt="avatar" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2 bg-slate-800">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
              )}
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onMouseDown={(e) => e.stopPropagation()} 
              onClick={() => setCallUIMode("fullscreen")}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Name & Status */}
          <div className="absolute bottom-2 left-3 right-3 text-white text-shadow-sm pointer-events-none">
             <p className="text-sm font-medium truncate">{activeCall?.user?.fullName || "Unknown User"}</p>
             <p className="text-xs opacity-80">{callStatus === "calling" ? "Calling..." : "Ongoing Call"}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 flex justify-center gap-4 bg-slate-900/50">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={toggleAudio}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isAudioMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={endCall}
            className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Draggable>
  );
}

export default CallScreenMinimized;
