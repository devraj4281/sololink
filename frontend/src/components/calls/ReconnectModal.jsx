import { useEffect, useState } from "react";
import { PhoneCall, PhoneOff, Video, Phone, Wifi, WifiOff, Loader2 } from "lucide-react";
import { useCallStore } from "../../store/useCallStore";
import { useAuthStore } from "../../store/useAuthStore";

function ReconnectModal() {
  const { reconnectAvailable, callStatus, rejoinCall, clearStaleCall } = useCallStore();
  const { authUser } = useAuthStore();
  const [secondsLeft, setSecondsLeft] = useState(30);

  // Count down from 30 once we're in the reconnecting state
  useEffect(() => {
    if (callStatus !== "reconnecting") {
      setSecondsLeft(30);
      return;
    }
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [callStatus, secondsLeft]);

  if (!reconnectAvailable && callStatus !== "reconnecting") return null;

  // Resolve the other user from the session object
  const session = reconnectAvailable;
  const isCallerMe = session?.callerId?._id === authUser?._id;
  const otherUser = session
    ? isCallerMe
      ? session.receiverId
      : session.callerId
    : null;

  const isVideoCall = session?.type === "call_video";
  const isReconnecting = callStatus === "reconnecting";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isReconnecting ? clearStaleCall : undefined}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: "var(--surface-high, #1e2530)" }}
      >
        {/* Top accent bar */}
        <div
          className={`h-1 w-full ${isReconnecting ? "bg-yellow-500 animate-pulse" : "bg-blue-500"}`}
        />

        <div className="p-6 flex flex-col items-center text-center gap-4">
          {/* Status Icon */}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isReconnecting ? "bg-yellow-500/20" : "bg-blue-500/20"
            }`}
          >
            {isReconnecting ? (
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            ) : (
              <Wifi className="w-8 h-8 text-blue-400" />
            )}
          </div>

          {/* User Avatar */}
          {otherUser && (
            <div className="flex flex-col items-center gap-2">
              {otherUser.profilePic ? (
                <img
                  src={otherUser.profilePic}
                  alt={otherUser.fullName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center border-2 border-white/20">
                  <span className="text-xl font-semibold text-white">
                    {otherUser.fullName?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Title & Message */}
          <div className="space-y-1">
            {isReconnecting ? (
              <>
                <h2 className="text-lg font-semibold text-white">Reconnecting…</h2>
                <p className="text-sm text-slate-400">
                  Re-establishing connection with{" "}
                  <span className="text-white font-medium">{otherUser?.fullName ?? "your call"}</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Timing out in{" "}
                  <span className={`font-mono font-bold ${secondsLeft <= 10 ? "text-red-400" : "text-slate-400"}`}>
                    {secondsLeft}s
                  </span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-white">Rejoin your call?</h2>
                <p className="text-sm text-slate-400">
                  You were in a{" "}
                  <span className="text-white font-medium">
                    {isVideoCall ? "video" : "voice"}
                  </span>{" "}
                  call with{" "}
                  <span className="text-white font-medium">
                    {otherUser?.fullName ?? "someone"}
                  </span>
                  .
                </p>
              </>
            )}
          </div>

          {/* Call Type Badge */}
          {!isReconnecting && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {isVideoCall ? (
                <Video className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Phone className="w-3.5 h-3.5 text-green-400" />
              )}
              <span className="text-xs text-slate-400">
                {isVideoCall ? "Video call" : "Voice call"}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          {!isReconnecting && (
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={clearStaleCall}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                Dismiss
              </button>
              <button
                onClick={rejoinCall}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
              >
                <PhoneCall className="w-4 h-4" />
                Reconnect
              </button>
            </div>
          )}

          {/* Reconnecting cancel */}
          {isReconnecting && (
            <button
              onClick={clearStaleCall}
              className="flex items-center gap-2 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-sm transition-all"
            >
              <WifiOff className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReconnectModal;
