import { MessageSquareIcon } from "lucide-react";

/* Spec §3: Display text for empty states — bold, commanding, on_surface */
const NoConversationPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10" style={{ background: "var(--surface-lowest)" }}>
      {/* Icon circle – primary_fixed bg per spec §5 Chips */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "var(--primary-fixed)", boxShadow: "0 12px 32px rgba(0,98,139,0.08)" }}
      >
        <MessageSquareIcon className="w-10 h-10" style={{ color: "var(--primary)" }} />
      </div>

      {/* Display-sm – editorial voice per spec §3 */}
      <h3 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--on-surface)", marginBottom: "0.5rem", lineHeight: 1.3 }}>
        Select a conversation
      </h3>
      {/* body-md – secondary metadata */}
      <p style={{ fontSize: "0.9375rem", color: "var(--on-surface-variant)", maxWidth: "22rem", lineHeight: 1.6 }}>
        Choose a contact from the sidebar to start chatting or continue a previous conversation.
      </p>
    </div>
  );
};

export default NoConversationPlaceholder;