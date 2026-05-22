/**
 * Renders reaction bubbles under a message bubble.
 * reactions: Object { emoji: [userId, ...] }
 * myId: current user's ID to highlight own reactions
 * onToggle: callback(emoji) to add/remove reaction
 */
function ReactionBubbles({ reactions, myId, onToggle }) {
  if (!reactions || Object.keys(reactions).length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(reactions).map(([emoji, userIds]) => {
        if (!userIds || userIds.length === 0) return null;
        const isMine = userIds.map((id) => id?.toString()).includes(myId?.toString());
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              background: isMine ? "var(--primary-fixed)" : "var(--surface-high)",
              border: isMine ? "1.5px solid var(--primary)" : "1.5px solid transparent",
              color: "var(--on-surface)",
              fontSize: "0.8125rem",
            }}
            title={`${userIds.length} reaction${userIds.length > 1 ? "s" : ""}`}
          >
            <span>{emoji}</span>
            {userIds.length > 1 && (
              <span style={{ color: "var(--on-surface-variant)", fontSize: "0.6875rem" }}>
                {userIds.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ReactionBubbles;
