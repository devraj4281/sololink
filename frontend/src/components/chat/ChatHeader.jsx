import { PhoneIcon, VideoIcon, MoreVerticalIcon, ChevronLeft } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useCallStore } from "../../store/useCallStore";
import { useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import DefaultAvatar from "../ui/DefaultAvatar";

function ChatHeader() {
  const selectedUser = useChatStore((state) => state.selectedUser);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const typingUsers = useChatStore((state) => state.typingUsers);

  const initiateCall = useCallStore((state) => state.initiateCall);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const userLastSeen = useAuthStore((state) => state.userLastSeen);
  
  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;
  const isTyping = selectedUser ? typingUsers.includes(selectedUser._id) : false;

  const getStatusText = () => {
    if (isTyping) return "typing...";
    if (isOnline) return "online";
    const ls = userLastSeen[selectedUser?._id] || selectedUser?.lastSeen;
    if (!ls) return "offline";
    const diff = Date.now() - new Date(ls).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "last seen just now";
    if (mins < 60) return `last seen ${mins}m ago`;
    if (hours < 24) {
      return `last seen today at ${new Date(ls).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (days === 1) {
      return `last seen yesterday at ${new Date(ls).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `last seen on ${new Date(ls).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  if (!selectedUser) return null;

  return (
    <div
      className="px-6 py-4 shrink-0"
      style={{
        background: "var(--surface-lowest)",
        boxShadow: "0 1px 0 var(--surface-high)",
      }}
    >
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-1 md:gap-3">
          <button 
            onClick={() => setSelectedUser(null)} 
            className="md:hidden spring w-9 h-9 flex items-center justify-center rounded-xl text-[var(--on-surface-variant)] mr-1 active:bg-[var(--surface-high)] transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
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
            <p style={{ fontSize: "0.75rem", fontWeight: 500, color: isTyping || isOnline ? "#34d399" : "var(--on-surface-variant)" }}>
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            title="Voice call"
            onClick={() => initiateCall(selectedUser, "voice")}
            className="spring w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ color: "var(--primary)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--primary-fixed)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <PhoneIcon className="w-5 h-5" />
          </button>
          
          <button
            title="Video call"
            onClick={() => initiateCall(selectedUser, "video")}
            className="spring w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ color: "var(--primary)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--primary-fixed)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <VideoIcon className="w-5 h-5" />
          </button>

          <button
            title="More"
            className="spring w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ color: "var(--primary)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--primary-fixed)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <MoreVerticalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default ChatHeader;
