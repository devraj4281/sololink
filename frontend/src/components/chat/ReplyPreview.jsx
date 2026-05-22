import { X, Mic, Image as ImageIcon } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";

/**
 * Telegram-style reply preview bar shown above the message input.
 * Displays: colored bar | "Reply to [Name]" | content snippet | thumbnail | X
 */
function ReplyPreview() {
  const replyingTo = useChatStore((state) => state.replyingTo);
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);

  if (!replyingTo) return null;

  const { senderName, text, image, audioUrl, isDeleted, type } = replyingTo;

  const getPreviewContent = () => {
    if (isDeleted) return { icon: null, label: "🚫 Message deleted" };
    if (type === "audio" || audioUrl) return { icon: <Mic className="w-3 h-3 shrink-0" />, label: "Voice message" };
    if (image) return { icon: <ImageIcon className="w-3 h-3 shrink-0" />, label: "Photo" };
    return { icon: null, label: text || "" };
  };

  const { icon, label } = getPreviewContent();

  return (
    <div className="px-3 pb-1 animate-in fade-in slide-in-from-bottom-1 duration-150">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-2xl"
        style={{
          background: "var(--surface-high)",
          borderLeft: "3px solid var(--primary)",
        }}
      >
        {/* Image thumbnail */}
        {image && !isDeleted && (
          <img
            src={image}
            alt=""
            className="w-9 h-9 rounded-lg object-cover shrink-0"
          />
        )}

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--primary)" }}>
            {senderName || "Reply"}
          </p>
          <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {icon}
            <span className="truncate">{label}</span>
          </p>
        </div>

        {/* Cancel */}
        <button
          onClick={() => setReplyingTo(null)}
          className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 transition-colors hover:bg-red-500/10"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ReplyPreview;
