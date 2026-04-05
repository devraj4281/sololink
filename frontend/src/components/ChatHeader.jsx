import { PhoneIcon, VideoIcon, MoreVerticalIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import DefaultAvatar from "./DefaultAvatar";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div
      className="px-6 py-4 shrink-0"
      style={{
        background: "var(--surface-lowest)",
        boxShadow: "0 1px 0 var(--surface-high)",
      }}
    >
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            {selectedUser.profilePic ? (
              <img
                src={selectedUser.profilePic}
                alt={selectedUser.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <DefaultAvatar size="w-10 h-10" iconSize="w-6 h-6" />
            )}
            {isOnline && (
              <span
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                style={{ background: "#34d399", borderColor: "var(--surface-lowest)" }}
              />
            )}
          </div>
          <div>
            <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--on-surface)" }}>
              {selectedUser.fullName}
            </h3>
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: isOnline ? "#34d399" : "var(--on-surface-variant)" }}>
              {isOnline ? "online" : "offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[
            { Icon: PhoneIcon,        label: "Voice call" },
            { Icon: VideoIcon,        label: "Video call" },
            { Icon: MoreVerticalIcon, label: "More" },
          ].map(({ Icon, label }, i) => (
            <button
              key={i}
              title={label}
              className="spring w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ color: "var(--primary)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--primary-fixed)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export default ChatHeader;
