import { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore";
import UsersLoadingSkeleton from "../feedback/UsersLoadingSkeleton";
import NoChatsFound from "../feedback/NoChatsFound";
import { useAuthStore } from "../../store/useAuthStore";

function ChatsList() {
  const getMyChatPartners = useChatStore((state) => state.getMyChatPartners);
  const chats = useChatStore((state) => state.chats);
  const isUsersLoading = useChatStore((state) => state.isUsersLoading);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const selectedUser = useChatStore((state) => state.selectedUser);

  const onlineUsers = useAuthStore((state) => state.onlineUsers);

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
                  className="text-sm truncate"
                  style={{ color: isActive ? "var(--primary)" : "var(--on-surface)", fontWeight: chat.unreadCount > 0 ? 700 : 600 }}
                >
                  {chat.fullName}
                </h4>

                {/* REAL-TIME TIMESTAMP FIX */}
                <span style={{ fontSize: "0.625rem", color: "var(--on-surface-variant)" }} className="shrink-0 ml-2 font-bold">
                  {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ""}
                </span>
              </div>

              <div className="flex items-center justify-between mt-0.5">
                <p
                  className="text-xs truncate"
                  style={{ color: isActive ? "var(--primary)" : "var(--on-surface-variant)", fontWeight: chat.unreadCount > 0 ? 600 : 400 }}
                >
                  {chat.lastMessage?.text || "Tap to chat"}
                </p>
                {/* Unread badge */}
                {chat.unreadCount > 0 && (
                  <span
                    className="shrink-0 ml-2 flex items-center justify-center rounded-full text-white font-bold animate-in fade-in"
                    style={{
                      minWidth: "18px",
                      height: "18px",
                      fontSize: "0.625rem",
                      background: "#ef4444",
                      padding: "0 4px",
                    }}
                  >
                    {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default ChatsList;