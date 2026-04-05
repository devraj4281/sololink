import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import DefaultAvatar from "./DefaultAvatar";

function ChatsList() {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser, selectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

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
              {chat.profilePic ? (
                <img
                  src={chat.profilePic}
                  alt={chat.fullName}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <DefaultAvatar size="w-11 h-11" iconSize="w-7 h-7" />
              )}
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
                <span style={{ fontSize: "0.625rem", color: "var(--on-surface-variant)" }} className="shrink-0 ml-2">
                  12:45 PM
                </span>
              </div>
              <p
                className="text-xs truncate mt-0.5"
                style={{ color: isActive ? "var(--primary)" : "var(--on-surface-variant)" }}
              >
                {isOnline ? "Typing..." : "Tap to chat"}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}
export default ChatsList;