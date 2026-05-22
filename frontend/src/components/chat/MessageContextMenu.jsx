import { useEffect, useRef } from "react";
import { Reply, Trash2, Copy } from "lucide-react";

/**
 * Right-click context menu for messages.
 * position: { x, y } screen coordinates
 * isMe: whether this message belongs to the current user
 * isDeleted: whether the message is already deleted
 * onReply, onDelete, onCopy, onClose: callbacks
 */
function MessageContextMenu({ position, isMe, isDeleted, onReply, onDelete, onCopy, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("contextmenu", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("contextmenu", handler);
    };
  }, [onClose]);

  // Clamp to viewport
  const style = {
    position: "fixed",
    top: Math.min(position.y, window.innerHeight - 160),
    left: Math.min(position.x, window.innerWidth - 170),
    zIndex: 9999,
  };

  return (
    <div
      ref={ref}
      className="animate-in fade-in zoom-in-95 rounded-xl shadow-2xl overflow-hidden"
      style={{
        ...style,
        background: "var(--surface-lowest)",
        border: "1px solid var(--surface-high)",
        minWidth: "160px",
      }}
    >
      {!isDeleted && (
        <>
          <MenuItem icon={Reply} label="Reply" onClick={() => { onReply(); onClose(); }} />
          {onCopy && <MenuItem icon={Copy} label="Copy text" onClick={() => { onCopy(); onClose(); }} />}
        </>
      )}
      {isMe && !isDeleted && (
        <MenuItem
          icon={Trash2}
          label="Delete for everyone"
          onClick={() => { onDelete(); onClose(); }}
          danger
        />
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-opacity-10"
      style={{
        color: danger ? "#ef4444" : "var(--on-surface)",
        background: "transparent",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? "rgba(239,68,68,0.08)" : "var(--surface-high)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

export default MessageContextMenu;
