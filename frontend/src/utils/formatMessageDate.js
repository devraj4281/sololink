import { isToday, isYesterday, isSameWeek, format } from "date-fns";

/**
 * Returns a human-readable date label for a message timestamp.
 * Matches WhatsApp / Telegram style:
 *   - Today     → "TODAY"
 *   - Yesterday → "YESTERDAY"
 *   - Same week → "Monday", "Tuesday", …
 *   - Older     → "March 12, 2026"
 */
export function formatMessageDate(dateString) {
  const date = new Date(dateString);
  if (isToday(date)) return "TODAY";
  if (isYesterday(date)) return "YESTERDAY";
  if (isSameWeek(date, new Date())) return format(date, "EEEE");
  return format(date, "MMMM d, yyyy");
}

/**
 * Returns true if two date strings fall on the same calendar day.
 * Used to decide whether to insert a date separator between messages.
 */
export function isSameDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
