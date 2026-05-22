import { X } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";

/**
 * Shows a preview bar above the message input when the user is replying
 * to a specific message. Clicking X cancels the reply.
 */
function ReplyPreview() {
  const replyingTo = useChatStore((state) => state.replyingTo);
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);

  if (!replyingTo) return null;

  const getPreviewText = () => {
    if (replyingTo.isDeleted) return "🚫 This message was deleted";
    if (replyingTo.type === "audio") return "🎤 Voice message";
    if (replyingTo.image) return "📷 Image";
    return replyingTo.text || "";
  };

  return (
    <div
      className="flex items-center gap-2 px-4 pt-2 animate-in fade-in slide-in-from-bottom-2"
    >
      <div
        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl min-w-0"
        style={{ background: "var(--surface-high)", borderLeft: "3px solid var(--primary)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--primary)" }}>
            Reply
          </p>
          <p className="text-xs truncate" style={{ color: "var(--on-surface-variant)" }}>
            {getPreviewText()}
          </p>
        </div>
      </div>
      <button
        onClick={() => setReplyingTo(null)}
        className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 hover:bg-red-500/10 transition-colors"
        style={{ color: "var(--on-surface-variant)" }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ReplyPreview;
