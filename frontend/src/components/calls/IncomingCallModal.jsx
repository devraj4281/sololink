import { useEffect, useRef } from "react";
import { useCallStore } from "../../store/useCallStore";
import { Phone, PhoneOff } from "lucide-react";
import DefaultAvatar from "../ui/DefaultAvatar";

function IncomingCallModal() {
  const { callStatus, incomingCall, answerCall, rejectCall } = useCallStore();
  const audioRef = useRef(null);

  useEffect(() => {
    if (callStatus === "ringing" && incomingCall) {
      if (audioRef.current) {
        audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [callStatus, incomingCall]);

  if (callStatus !== "ringing" || !incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <audio ref={audioRef} src="/sounds/ringing.mp3" loop />
      <div className="bg-base-100 border border-base-300 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
          {incomingCall.user?.profilePic ? (
            <img
              src={incomingCall.user.profilePic}
              alt={incomingCall.user.fullName}
              className="w-24 h-24 rounded-full object-cover border-4 border-base-100 shadow-lg relative z-10"
            />
          ) : (
            <div className="relative z-10 rounded-full border-4 border-base-100 shadow-lg overflow-hidden">
              <DefaultAvatar size="w-24 h-24" iconSize="w-12 h-12" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-base-content mb-2 text-center">
          {incomingCall.user?.fullName || "Incoming Call"}
        </h2>
        <p className="text-base-content/70 mb-8 capitalize">
          Incoming {incomingCall.type} call...
        </p>

        <div className="flex gap-6 w-full justify-center">
          <button
            onClick={rejectCall}
            className="btn btn-error btn-circle btn-lg text-white shadow-lg shadow-error/30 hover:scale-110 transition-transform"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button
            onClick={answerCall}
            className="btn btn-success btn-circle btn-lg text-white shadow-lg shadow-success/30 hover:scale-110 transition-transform animate-bounce"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallModal;
