import { MessageSquareIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      {/* Spec §4 ambient shadow, primary_fixed circle */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--primary-fixed)", boxShadow: "0 12px 32px rgba(0,98,139,0.08)" }}
      >
        <MessageSquareIcon className="w-8 h-8" style={{ color: "var(--primary)" }} />
      </div>
      {/* Spec §3 headline-sm for navigation headers */}
      <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--on-surface)", marginBottom: "0.375rem" }}>
        No conversations yet
      </h4>
      {/* body-md secondary metadata */}
      <p style={{ fontSize: "0.875rem", color: "var(--on-surface-variant)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
        Start a new chat by selecting a contact
      </p>
      {/* Spec §5 Secondary button: secondary_container bg, no border */}
      <button
        onClick={() => setActiveTab("contacts")}
        className="spring px-5 py-2 text-sm font-semibold rounded-xl"
        style={{ background: "var(--primary-fixed)", color: "var(--primary)" }}
        onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.95)"}
        onMouseLeave={e => e.currentTarget.style.filter = "none"}
      >
        Find contacts
      </button>
    </div>
  );
}
export default NoChatsFound;

