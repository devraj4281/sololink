
import { format, isToday, isYesterday } from "date-fns";

export const formatMessageTime = (date) => {
  if (!date) return "";
  const messageDate = new Date(date);

  if (isToday(messageDate)) {
    return format(messageDate, "hh:mm aa");
  }
  if (isYesterday(messageDate)) {
    return "Yesterday";
  }
  return format(messageDate, "dd/MM/yy"); 
};