import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import DefaultAvatar from "./DefaultAvatar";



function ChatContainer() {
  const {
    selectedUser, getMessagesByUserId, messages,
    isMessagesLoading, subscribeToMessages, unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--surface)" }}>
      <ChatHeader />

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6" style={{ background: "var(--surface)" }}>
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length === 0 ? (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {/* Date divider */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px flex-1" style={{ background: "var(--surface-high)" }} />
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Today
              </span>
              <div className="h-px flex-1" style={{ background: "var(--surface-high)" }} />
            </div>

            {messages.map((msg, idx) => {
              const isMe = msg.senderId === authUser._id;
              const prevMsg = messages[idx - 1];
              const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;

              return (
                <div
                  key={msg._id}
                  className={`flex w-full gap-4 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                  style={{ marginBottom: isSameSender ? "4px" : "24px" }}
                >
                  {/* Fixed-size Avatar Anchor */}
                  <div className="shrink-0 w-10 mt-1">
                    {!isSameSender ? (
                      <div className="w-10 h-10 rounded-full flex-shrink-0 shadow-sm overflow-hidden" style={{ background: "var(--surface-high)" }}>
                        {isMe && authUser.profilePic ? (
                          <img src={authUser.profilePic} alt="Me" className="w-full h-full object-cover" />
                        ) : !isMe && selectedUser.profilePic ? (
                          <img src={selectedUser.profilePic} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <DefaultAvatar size="w-10 h-10" iconSize="w-5 h-5" />
                        )}
                      </div>
                    ) : (
                      <div className="w-10 h-10" />
                    )}
                  </div>

                  {/* Message Content Column */}
                  <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                    {/* Header: Name and Time */}
                    {!isSameSender && (
                      <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--on-surface-variant)" }}>
                          {isMe ? authUser.fullName : selectedUser.fullName}
                        </span>
                        <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--outline)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}

                    {/* The Bubble */}
                    <div
                      className="p-4 shadow-sm transition-all"
                      style={{
                        background: isMe ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)" : "var(--surface-high)",
                        color: isMe ? "var(--on-primary)" : "var(--on-surface)",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        border: !isMe ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}
                    >
                      {msg.image && <img src={msg.image} alt="Shared" className="rounded-lg max-h-48 object-cover mb-2" />}
                      {msg.text && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
}

export default ChatContainer;