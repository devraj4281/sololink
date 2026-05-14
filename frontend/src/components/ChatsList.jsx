import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser, selectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  // Helper for real-time accuracy (Issue 1 & 3)
  const formatTime = (dateString) => {
    if (!dateString) return "Tap to chat";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const defaultAvatarPath = "/avatar.png";

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat) => {
        const isOnline = onlineUsers.includes(chat._id);
        const isActive = selectedUser?._id === chat._id;

        return (
          <div
            key={chat._id}
            className="spring flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer"
            style={{ background: isActive ? "var(--primary-fixed)" : "transparent" }}
            onClick={() => setSelectedUser(chat)}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--surface-high)"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            <div className="relative shrink-0">
              {/* ISSUE 1 FIX: Combined Logic to prevent 404 lag */}
              <img
                src={chat.profilePic || defaultAvatarPath}
                alt={chat.fullName}
                className="w-11 h-11 rounded-full object-cover"
                onError={(e) => {
                  if (e.target.src !== window.location.origin + defaultAvatarPath) {
                    e.target.src = defaultAvatarPath;
                  }
                }}
              />
              
              {isOnline && (
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                  style={{ background: "#34d399", borderColor: "var(--surface)" }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4
                  className="text-sm font-semibold truncate"
                  style={{ color: isActive ? "var(--primary)" : "var(--on-surface)" }}
                >
                  {chat.fullName}
                </h4>

                {/* REAL-TIME TIMESTAMP FIX */}
                <span style={{ fontSize: "0.625rem", color: "var(--on-surface-variant)" }} className="shrink-0 ml-2 font-bold">
                  {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ""}
                </span>
              </div>

              <p
                className="text-xs truncate mt-0.5"
                style={{ color: isActive ? "var(--primary)" : "var(--on-surface-variant)" }}
              >
                
                {isOnline ? "Online" : chat.lastMessage?.text || "Tap to chat"}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default ChatsList;