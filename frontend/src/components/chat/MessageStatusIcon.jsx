import { Check, CheckCheck } from "lucide-react";

/**
 * Shows WhatsApp-style tick icons based on message delivery status.
 * - Single gray tick: sent
 * - Double gray ticks: delivered
 * - Double blue ticks: read
 */
function MessageStatusIcon({ status, className = "" }) {
  if (!status || status === "sent") {
    return <Check className={`w-3.5 h-3.5 ${className}`} style={{ color: "rgba(255,255,255,0.55)" }} />;
  }
  if (status === "delivered") {
    return <CheckCheck className={`w-3.5 h-3.5 ${className}`} style={{ color: "rgba(255,255,255,0.55)" }} />;
  }
  if (status === "read") {
    return <CheckCheck className={`w-3.5 h-3.5 ${className}`} style={{ color: "#60d0ff" }} />;
  }
  return null;
}

export default MessageStatusIcon;
