/**
 * Renders the "replied to" context inside a message bubble.
 * replyTo: the original message object (populated from DB)
 * isMe: whether the current message bubble belongs to the logged-in user
 * onJump: callback to scroll to the original message
 */
function RepliedMessage({ replyTo, isMe, onJump }) {
  if (!replyTo) return null;

  const getPreviewText = () => {
    if (replyTo.isDeleted) return "🚫 This message was deleted";
    if (replyTo.type === "audio") return "🎤 Voice message";
    if (replyTo.image) return "📷 Image";
    return replyTo.text || "";
  };

  return (
    <div
      onClick={onJump}
      className="mb-2 px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
      style={{
        background: isMe ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)",
        borderLeft: "3px solid rgba(255,255,255,0.4)",
        maxWidth: "100%",
      }}
    >
      <p
        className="text-xs font-semibold truncate"
        style={{ color: isMe ? "rgba(255,255,255,0.75)" : "var(--primary)", marginBottom: "2px" }}
      >
        Original message
      </p>
      <p
        className="text-xs truncate"
        style={{ color: isMe ? "rgba(255,255,255,0.6)" : "var(--on-surface-variant)" }}
      >
        {getPreviewText()}
      </p>
    </div>
  );
}

export default RepliedMessage;
