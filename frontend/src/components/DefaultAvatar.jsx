/**
 * DefaultAvatar — an exact SVG match of the requested grey/blue placeholder avatar,
 * avoiding the need for an external image file.
 */
function DefaultAvatar({ size = "w-11 h-11" }) {
  return (
    <svg
      className={`${size} shrink-0 overflow-hidden rounded-full border border-black/5 dark:border-white/5`}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="100" height="100" fill="#a1acb8" />
      {/* Head */}
      <circle cx="50" cy="36" r="19" fill="#ffffff" />
      {/* Body */}
      <path d="M18 100 C 18 70, 32 60, 50 60 C 68 60, 82 70, 82 100 Z" fill="#ffffff" />
    </svg>
  );
}
export default DefaultAvatar;
