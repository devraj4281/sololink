import { PhoneIcon, VideoIcon, PhoneMissedIcon } from "lucide-react";

function CallSystemMessage({ msg, authUser }) {
  const isMe = msg.senderId === authUser._id;
  const isVideo = msg.type === "call_video";
  const isMissed = msg.callStatus === "missed" || msg.callStatus === "declined";
  
  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  let icon = isVideo ? <VideoIcon className="w-4 h-4" /> : <PhoneIcon className="w-4 h-4" />;
  if (isMissed) {
    icon = <PhoneMissedIcon className="w-4 h-4 text-red-500" />;
  }

  let text = "";
  if (isMissed) {
    text = isMe ? `Outgoing ${isVideo ? "Video" : "Voice"} Call • Missed` : `Missed ${isVideo ? "Video" : "Voice"} Call`;
  } else if (msg.callStatus === "cancelled") {
    text = `Cancelled ${isVideo ? "Video" : "Voice"} Call`;
  } else {
    text = `${isMe ? "Outgoing" : "Incoming"} ${isVideo ? "Video" : "Voice"} Call • ${formatDuration(msg.callDuration)}`;
  }

  return (
    <div className="flex justify-center my-4 w-full">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all bg-[var(--surface-high)] text-[var(--on-surface-variant)] border border-[rgba(255,255,255,0.02)]">
        {icon}
        <span>{text}</span>
      </div>
    </div>
  );
}

export default CallSystemMessage;
