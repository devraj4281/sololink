import { useEffect, useRef } from "react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/**
 * Floating emoji picker that appears on hover/long-press near a message.
 * position: { top, left } CSS coordinates
 */
function ReactionPicker({ onReact, onClose, position }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 flex items-center gap-1 p-1.5 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-2"
      style={{
        background: "var(--surface-lowest)",
        border: "1px solid var(--surface-high)",
        top: position?.top,
        left: position?.left,
        transform: "translateY(-100%)",
      }}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onReact(emoji);
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full text-lg hover:scale-125 transition-transform active:scale-90"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default ReactionPicker;
