import { Mic, Image as ImageIcon } from "lucide-react";

/**
 * Telegram-style quoted message block rendered inside a message bubble.
 *
 * Props:
 *   replyTo      — the original message object (populated from DB)
 *   senderName   — display name of the original sender ("You" | partner name)
 *   isMe         — whether the *current* (outer) bubble belongs to the logged-in user
 *   onJump       — scroll to the original message on click
 */
function RepliedMessage({ replyTo, senderName, isMe, onJump }) {
  if (!replyTo) return null;

  const isOnMyBubble = isMe; // colour scheme adapts to bubble background

  const getPreview = () => {
    if (replyTo.isDeleted) return { icon: null, text: "Message deleted" };
    if (replyTo.type === "audio" || replyTo.audioUrl)
      return { icon: <Mic className="w-3 h-3 shrink-0" />, text: "Voice message" };
    if (replyTo.image)
      return { icon: <ImageIcon className="w-3 h-3 shrink-0" />, text: "Photo" };
    return { icon: null, text: replyTo.text || "" };
  };

  const { icon, text } = getPreview();

  // Colours that look good on both dark (my bubble) and surface (their bubble)
  const borderColor   = isOnMyBubble ? "rgba(255,255,255,0.4)" : "var(--primary)";
  const nameColor     = isOnMyBubble ? "rgba(255,255,255,0.9)" : "var(--primary)";
  const previewColor  = isOnMyBubble ? "rgba(255,255,255,0.65)" : "var(--on-surface-variant)";
  const bgColor       = isOnMyBubble ? "rgba(0,0,0,0.18)" : "rgba(var(--primary-rgb, 0,98,139), 0.07)";

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onJump?.(); }}
      className="flex gap-2 mb-2 rounded-xl cursor-pointer transition-opacity hover:opacity-80 overflow-hidden"
      style={{
        background: bgColor,
        borderLeft: `3px solid ${borderColor}`,
        padding: "6px 10px",
        maxWidth: "100%",
      }}
    >
      {/* Image thumbnail if the original was a photo */}
      {replyTo.image && !replyTo.isDeleted && (
        <img
          src={replyTo.image}
          alt=""
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
      )}

      {/* Text info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold truncate"
          style={{ color: nameColor, marginBottom: "2px" }}
        >
          {replyTo.isDeleted ? "Deleted message" : senderName || "Message"}
        </p>
        <p
          className="text-xs truncate flex items-center gap-1"
          style={{ color: previewColor }}
        >
          {icon}
          <span className="truncate">{text}</span>
        </p>
      </div>
    </div>
  );
}

export default RepliedMessage;
