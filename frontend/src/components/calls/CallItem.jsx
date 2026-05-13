import { PhoneIcon, VideoIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from "lucide-react";
import DefaultAvatar from "../DefaultAvatar";

function CallItem({ call, authUser, onClick }) {
  // Safe extraction — senderId may be a populated object or a raw ObjectId string
  const senderId = call.senderId?._id || call.senderId;
  const isOutgoing = senderId?.toString() === authUser._id?.toString();
  const otherUser = isOutgoing ? call.receiverId : call.senderId;
  const isVideo = call.type === "call_video";

  const isMissed = call.callStatus === "missed" || call.callStatus === "declined";
  const iconColor = isMissed ? "text-red-500" : "text-green-500";

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const duration = formatDuration(call.callDuration);

  return (
    <div
      onClick={() => onClick(otherUser)}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-[var(--surface-low)] transition-colors group"
    >
      <div className="relative shrink-0">
        {otherUser?.profilePic ? (
          <img
            src={otherUser.profilePic}
            alt={otherUser?.fullName}
            className="w-12 h-12 rounded-full object-cover shadow-sm"
          />
        ) : (
          <DefaultAvatar size="w-12 h-12" iconSize="w-6 h-6" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-semibold truncate ${isMissed && !isOutgoing ? "text-red-500" : "text-[var(--on-surface)]"}`}>
          {otherUser?.fullName || "Unknown User"}
        </h3>

        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--on-surface-variant)] font-medium flex-wrap">
          {isOutgoing ? (
            <ArrowUpRightIcon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
          ) : (
            <ArrowDownLeftIcon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
          )}
          <span className="truncate">
            {new Date(call.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {duration && (
            <span className="text-[var(--on-surface-variant)] opacity-70">• {duration}</span>
          )}
        </div>
      </div>

      {/* Call-back icon — always visible on mobile, hover on desktop */}
      <div className="shrink-0 p-2 text-[var(--primary)] bg-[var(--surface-high)] rounded-xl opacity-60 group-hover:opacity-100 transition-opacity">
        {isVideo ? <VideoIcon className="w-4 h-4" /> : <PhoneIcon className="w-4 h-4" />}
      </div>
    </div>
  );
}

export default CallItem;
