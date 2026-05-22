import { useEffect, useRef } from "react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/**
 * Floating emoji picker.
 * - When `inline` is true: renders as a regular flex row (no absolute positioning),
 *   used inline below the message bubble.
 * - When `inline` is false/undefined: renders absolutely at `position`.
 */
function ReactionPicker({ onReact, onClose, position, inline }) {
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

  const containerStyle = inline
    ? {}
    : {
        position: "absolute",
        top: position?.top,
        left: position?.left,
        transform: "translateY(-100%)",
        zIndex: 50,
      };

  return (
    <div
      ref={ref}
      className="flex items-center gap-1 p-1.5 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-2"
      style={{
        ...containerStyle,
        background: "var(--surface-lowest)",
        border: "1px solid var(--surface-high)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onReact(emoji);
          }}
          className="w-9 h-9 flex items-center justify-center rounded-full text-lg hover:scale-125 transition-transform active:scale-90"
          style={{ fontSize: "1.25rem" }}
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default ReactionPicker;
