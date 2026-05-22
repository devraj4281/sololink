import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "../feedback/NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "../feedback/MessagesLoadingSkeleton";
import DefaultAvatar from "../ui/DefaultAvatar";
import CallSystemMessage from "../calls/CallSystemMessage";
import DateSeparator from "./DateSeparator";
import { formatMessageDate, isSameDay } from "../../lib/formatMessageDate";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import VirtualizedMessageItem from "./VirtualizedMessageItem";
import MessageStatusIcon from "./MessageStatusIcon";
import ReactionPicker from "./ReactionPicker";
import ReactionBubbles from "./ReactionBubbles";
import RepliedMessage from "./RepliedMessage";
import MessageContextMenu from "./MessageContextMenu";
import AudioPlayer from "./AudioPlayer";

function ChatContainer() {
  const selectedUser = useChatStore((state) => state.selectedUser);
  const getMessagesByUserId = useChatStore((state) => state.getMessagesByUserId);
  const loadMoreMessages = useChatStore((state) => state.loadMoreMessages);
  const allMessages = useChatStore((state) => state.messages);
  const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);
  const addReaction = useChatStore((state) => state.addReaction);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const markChatAsRead = useChatStore((state) => state.markChatAsRead);

  const hasMoreMap = useChatStore((state) => state.hasMore);
  const isLoadMoreLoadingMap = useChatStore((state) => state.isLoadMoreLoading);
  const hasMore = selectedUser ? hasMoreMap[selectedUser._id] : false;
  const isLoadMoreLoading = selectedUser ? isLoadMoreLoadingMap[selectedUser._id] : false;

  const authUser = useAuthStore((state) => state.authUser);
  const socket = useAuthStore((state) => state.socket);

  const messageEndRef = useRef(null);
  const containerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const prevSelectedUserRef = useRef(null);
  const messageRefs = useRef({}); // messageId → DOM element

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null); // { x, y, msg }
  // Reaction picker state
  const [reactionPicker, setReactionPicker] = useState(null); // { msg, position }
  // Track which messages have been emitted as read
  const readSentRef = useRef(new Set());

  const messages = useMemo(
    () => (selectedUser ? allMessages[selectedUser._id] || [] : []),
    [selectedUser, allMessages]
  );

  // Setup intersection observer for scrolling to top (pagination)
  const loaderRef = useIntersectionObserver(
    () => {
      if (hasMore && !isLoadMoreLoading && selectedUser) {
        if (containerRef.current) {
          prevScrollHeightRef.current = containerRef.current.scrollHeight;
        }
        loadMoreMessages(selectedUser._id);
      }
    },
    { threshold: 0.1 }
  );

  // Intersection Observer for read receipts
  useEffect(() => {
    if (!socket || !selectedUser || !authUser) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const unreadIds = [];
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const msgId = entry.target.dataset.msgid;
          const senderId = entry.target.dataset.senderid;
          if (!msgId || senderId === authUser._id) return; // Only mark others' messages
          if (readSentRef.current.has(msgId)) return;
          readSentRef.current.add(msgId);
          unreadIds.push(msgId);
        });

        if (unreadIds.length > 0) {
          socket.emit("message:read", {
            messageIds: unreadIds,
            senderId: selectedUser._id,
          });
        }
      },
      { threshold: 0.6 }
    );

    // Observe all message elements
    Object.values(messageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [messages, socket, selectedUser, authUser]);

  // Initial and subsequent fetch subscriptions
  useEffect(() => {
    if (!selectedUser) return;
    readSentRef.current = new Set(); // Reset read tracking on user change
    getMessagesByUserId(selectedUser._id);
    markChatAsRead(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages, markChatAsRead]);

  // Adjust scroll position to prevent jumps during pagination prepends
  useEffect(() => {
    if (prevScrollHeightRef.current > 0 && containerRef.current) {
      const addedHeight = containerRef.current.scrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop = addedHeight;
      prevScrollHeightRef.current = 0;
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (!selectedUser) return;
    if (prevSelectedUserRef.current !== selectedUser._id) {
      prevSelectedUserRef.current = selectedUser._id;
      messageEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedUser]);

  const handleContextMenu = useCallback((e, msg) => {
    e.preventDefault();
    setReactionPicker(null);
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  }, []);

  const handleReactionToggle = useCallback((messageId, emoji) => {
    addReaction(messageId, emoji, authUser._id);
  }, [addReaction, authUser]);

  const scrollToMessage = useCallback((messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background 0.3s ease";
      el.style.background = "var(--primary-fixed)";
      setTimeout(() => { el.style.background = ""; }, 1200);
    }
  }, []);

  if (!selectedUser) {
    return <div className="flex-1" style={{ background: "var(--surface)" }} />;
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--surface)" }}>
      <ChatHeader />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6"
        style={{ background: "var(--surface)" }}
        onClick={() => { setContextMenu(null); setReactionPicker(null); }}
      >
        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length === 0 ? (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {hasMore && (
              <div ref={loaderRef} className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary) transparent var(--primary) transparent" }} />
              </div>
            )}

            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const isMe = msg.senderId === authUser._id || msg.senderId?._id === authUser._id;
              const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;
              const isCallMsg = msg.type?.startsWith("call_");
              const showDateSep = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
              const reactions = msg.reactions
                ? typeof msg.reactions.entries === "function"
                  ? Object.fromEntries(msg.reactions)
                  : msg.reactions
                : {};

              return (
                <div key={msg._id}>
                  {showDateSep && <DateSeparator label={formatMessageDate(msg.createdAt)} />}

                  {isCallMsg ? (
                    <CallSystemMessage msg={msg} authUser={authUser} />
                  ) : (
                    <VirtualizedMessageItem estimatedHeight={msg.image ? 240 : msg.audioUrl ? 100 : 80}>
                      <div
                        ref={(el) => { if (el) messageRefs.current[msg._id] = el; }}
                        data-msgid={msg._id}
                        data-senderid={typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId}
                        className={`flex w-full gap-4 ${isMe ? "flex-row-reverse" : "flex-row"} group`}
                        style={{ marginBottom: isSameSender ? "4px" : "24px" }}
                        onContextMenu={(e) => handleContextMenu(e, msg)}
                      >
                        {/* Avatar */}
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
                          {/* Header: Name + Time */}
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
                            className="p-4 shadow-sm transition-all relative"
                            style={{
                              background: msg.isDeleted
                                ? "var(--surface-high)"
                                : isMe
                                  ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)"
                                  : "var(--surface-high)",
                              color: isMe && !msg.isDeleted ? "var(--on-primary)" : "var(--on-surface)",
                              borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                              border: !isMe ? "1px solid rgba(255,255,255,0.05)" : "none",
                              opacity: msg.isDeleted ? 0.65 : 1,
                            }}
                          >
                            {/* Replied-to context */}
                            {msg.replyTo && !msg.isDeleted && (
                              <RepliedMessage
                                replyTo={msg.replyTo}
                                isMe={isMe}
                                onJump={() => scrollToMessage(msg.replyTo._id || msg.replyTo)}
                              />
                            )}

                            {msg.isDeleted ? (
                              <p className="text-sm italic" style={{ color: "var(--on-surface-variant)" }}>
                                🚫 This message was deleted
                              </p>
                            ) : (
                              <>
                                {msg.image && <img src={msg.image} alt="Shared" className="rounded-lg max-h-48 object-cover mb-2" />}
                                {msg.audioUrl && (
                                  <AudioPlayer audioUrl={msg.audioUrl} duration={msg.audioDuration} />
                                )}
                                {msg.text && (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                                )}
                              </>
                            )}

                            {/* Time + Status row (for sender) */}
                            {isMe && !msg.isDeleted && (
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span style={{ fontSize: "0.6rem", opacity: 0.6 }}>
                                  {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <MessageStatusIcon status={msg.status} />
                              </div>
                            )}
                          </div>

                          {/* Reactions */}
                          {!msg.isDeleted && (
                            <ReactionBubbles
                              reactions={reactions}
                              myId={authUser._id}
                              onToggle={(emoji) => handleReactionToggle(msg._id, emoji)}
                            />
                          )}
                        </div>
                      </div>

                      {/* Reaction Picker (positioned near message) */}
                      {reactionPicker?.msg._id === msg._id && (
                        <div className="relative">
                          <ReactionPicker
                            position={reactionPicker.position}
                            onReact={(emoji) => handleReactionToggle(msg._id, emoji)}
                            onClose={() => setReactionPicker(null)}
                          />
                        </div>
                      )}
                    </VirtualizedMessageItem>
                  )}
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <MessageContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          isMe={contextMenu.msg.senderId === authUser._id || contextMenu.msg.senderId?._id === authUser._id}
          isDeleted={contextMenu.msg.isDeleted}
          onReply={() => setReplyingTo(contextMenu.msg)}
          onDelete={() => deleteMessage(contextMenu.msg._id)}
          onCopy={contextMenu.msg.text ? () => navigator.clipboard.writeText(contextMenu.msg.text) : null}
          onClose={() => setContextMenu(null)}
        />
      )}

      <MessageInput />
    </div>
  );
}

export default ChatContainer;