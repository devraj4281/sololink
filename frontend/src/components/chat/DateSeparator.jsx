/**
 * Centered date pill separator shown between messages of different days.
 * Styled to match the app design system tokens.
 */
function DateSeparator({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 my-4 w-full select-none">
      <div className="h-px flex-1" style={{ background: "var(--surface-high)" }} />
      <span
        className="px-3 py-1 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wider shrink-0"
        style={{
          background: "var(--surface-high)",
          color: "var(--on-surface-variant)",
        }}
      >
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: "var(--surface-high)" }} />
    </div>
  );
}

export default DateSeparator;
