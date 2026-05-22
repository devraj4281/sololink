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
import { SmilePlus, Reply, Trash2 } from "lucide-react";

// ─── Quick-action hover bar that appears beside each message ─────────────────
function MessageActions({ isMe, isDeleted, onEmojiClick, onReply, onDelete }) {
  return (
    <div
      className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 self-center"
      style={{ order: isMe ? -1 : 1 }} // left of bubble for me, right for them
    >
      {!isDeleted && (
        <>
          {/* Emoji react button */}
          <button
            onClick={onEmojiClick}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
            style={{
              background: "var(--surface-high)",
              color: "var(--on-surface-variant)",
            }}
            title="React"
          >
            <SmilePlus className="w-3.5 h-3.5" />
          </button>
          {/* Reply button */}
          <button
            onClick={onReply}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
            style={{
              background: "var(--surface-high)",
              color: "var(--on-surface-variant)",
            }}
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          {/* Delete button — only for your own messages */}
          {isMe && (
            <button
              onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
              style={{
                background: "var(--surface-high)",
                color: "#ef4444",
              }}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

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
  const messageRefs = useRef({});
  const readSentRef = useRef(new Set());

  // Context menu on right-click
  const [contextMenu, setContextMenu] = useState(null); // { x, y, msg }
  // Reaction picker (opened via emoji button in hover bar)
  const [reactionPicker, setReactionPicker] = useState(null); // { msgId, anchorEl }

  const messages = useMemo(
    () => (selectedUser ? allMessages[selectedUser._id] || [] : []),
    [selectedUser, allMessages]
  );

  // ── Pagination loader ref ─────────────────────────────────────────────────
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

  // ── Read receipts via IntersectionObserver ────────────────────────────────
  useEffect(() => {
    if (!socket || !selectedUser || !authUser) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const unreadIds = [];
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const msgId = entry.target.dataset.msgid;
          const senderId = entry.target.dataset.senderid;
          if (!msgId || senderId === authUser._id) return;
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

    Object.values(messageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [messages, socket, selectedUser, authUser]);

  // ── Fetch + subscribe ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUser) return;
    readSentRef.current = new Set();
    getMessagesByUserId(selectedUser._id);
    markChatAsRead(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages, markChatAsRead]);

  // ── Scroll restore after pagination prepend ───────────────────────────────
  useEffect(() => {
    if (prevScrollHeightRef.current > 0 && containerRef.current) {
      const addedHeight = containerRef.current.scrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop = addedHeight;
      prevScrollHeightRef.current = 0;
    }
  }, [messages]);

  // ── Auto scroll to bottom on new messages ────────────────────────────────
  useEffect(() => {
    if (!selectedUser) return;
    if (prevSelectedUserRef.current !== selectedUser._id) {
      prevSelectedUserRef.current = selectedUser._id;
      messageEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedUser]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleContextMenu = useCallback((e, msg) => {
    e.preventDefault();
    setReactionPicker(null);
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  }, []);

  const handleReactionToggle = useCallback(
    (messageId, emoji) => {
      addReaction(messageId, emoji, authUser._id);
    },
    [addReaction, authUser]
  );

  const handleEmojiButtonClick = useCallback((e, msg) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu(null);
    // Toggle: close if same message is already open
    setReactionPicker((prev) =>
      prev?.msgId === msg._id
        ? null
        : { msgId: msg._id, anchorRect: rect }
    );
  }, []);

  const scrollToMessage = useCallback((messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background 0.4s ease";
      el.style.background = "var(--primary-fixed)";
      setTimeout(() => { el.style.background = ""; }, 1200);
    }
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isMe = useCallback(
    (msg) =>
      (msg.senderId?._id || msg.senderId)?.toString() === authUser._id?.toString(),
    [authUser]
  );

  const normalizeReactions = (reactions) => {
    if (!reactions) return {};
    if (typeof reactions.entries === "function") return Object.fromEntries(reactions);
    return reactions;
  };

  // Build a senderName string for a given message
  const getSenderName = useCallback(
    (msg) => {
      const msgSenderId = (msg.senderId?._id || msg.senderId)?.toString();
      return msgSenderId === authUser._id?.toString()
        ? "You"
        : selectedUser?.fullName || "";
    },
    [authUser, selectedUser]
  );

  // Enrich message with senderName before storing as replyingTo
  const handleReply = useCallback(
    (msg) => {
      setReplyingTo({ ...msg, senderName: getSenderName(msg) });
    },
    [setReplyingTo, getSenderName]
  );

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
                <div
                  className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--primary) transparent var(--primary) transparent" }}
                />
              </div>
            )}

            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const msgIsMe = isMe(msg);
              const msgSenderId = (msg.senderId?._id || msg.senderId)?.toString();
              const prevSenderId = prevMsg
                ? (prevMsg.senderId?._id || prevMsg.senderId)?.toString()
                : null;
              const isSameSender = prevSenderId === msgSenderId;
              const isCallMsg = msg.type?.startsWith("call_");
              const showDateSep = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
              const reactions = normalizeReactions(msg.reactions);
              const hasReactions = Object.values(reactions).some((arr) => arr?.length > 0);

              return (
                <div key={msg._id}>
                  {showDateSep && <DateSeparator label={formatMessageDate(msg.createdAt)} />}

                  {isCallMsg ? (
                    <CallSystemMessage msg={msg} authUser={authUser} />
                  ) : (
                    <VirtualizedMessageItem estimatedHeight={msg.image ? 240 : msg.audioUrl ? 100 : 80}>
                      {/* Outer row: avatar + [actions] + bubble */}
                      <div
                        ref={(el) => { if (el) messageRefs.current[msg._id] = el; }}
                        data-msgid={msg._id}
                        data-senderid={msgSenderId}
                        className={`flex w-full gap-2 ${msgIsMe ? "flex-row-reverse" : "flex-row"} group`}
                        style={{ marginBottom: isSameSender ? "4px" : "20px", alignItems: "flex-end" }}
                        onContextMenu={(e) => handleContextMenu(e, msg)}
                      >
                        {/* Avatar */}
                        <div className="shrink-0 w-9">
                          {!isSameSender ? (
                            <div
                              className="w-9 h-9 rounded-full overflow-hidden shadow-sm"
                              style={{ background: "var(--surface-high)" }}
                            >
                              {msgIsMe && authUser.profilePic ? (
                                <img src={authUser.profilePic} alt="Me" className="w-full h-full object-cover" />
                              ) : !msgIsMe && selectedUser.profilePic ? (
                                <img src={selectedUser.profilePic} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <DefaultAvatar size="w-9 h-9" iconSize="w-4 h-4" />
                              )}
                            </div>
                          ) : (
                            <div className="w-9 h-9" />
                          )}
                        </div>

                        {/* ── Hover action bar ── */}
                        <MessageActions
                          isMe={msgIsMe}
                          isDeleted={!!msg.isDeleted}
                          onEmojiClick={(e) => handleEmojiButtonClick(e, msg)}
                          onReply={() => handleReply(msg)}
                          onDelete={() => deleteMessage(msg._id)}
                        />

                        {/* ── Bubble column ── */}
                        <div
                          className={`flex flex-col max-w-[68%] ${msgIsMe ? "items-end" : "items-start"}`}
                        >
                          {/* Sender name + time header */}
                          {!isSameSender && (
                            <div className={`flex items-center gap-2 mb-1 px-1 ${msgIsMe ? "flex-row-reverse" : "flex-row"}`}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--on-surface-variant)" }}>
                                {msgIsMe ? authUser.fullName : selectedUser.fullName}
                              </span>
                              <span style={{ fontSize: "0.625rem", color: "var(--outline)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div
                            className="px-4 py-3 shadow-sm relative"
                            style={{
                              background: msg.isDeleted
                                ? "var(--surface-high)"
                                : msgIsMe
                                  ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)"
                                  : "var(--surface-high)",
                              color: msgIsMe && !msg.isDeleted ? "var(--on-primary)" : "var(--on-surface)",
                              borderRadius: msgIsMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              opacity: msg.isDeleted ? 0.6 : 1,
                            }}
                          >
                            {/* Replied-to context inside bubble */}
                            {msg.replyTo && !msg.isDeleted && (
                              <RepliedMessage
                                replyTo={msg.replyTo}
                                senderName={
                                  // replyTo.senderId might be string or populated obj
                                  (() => {
                                    const rSenderId = (msg.replyTo.senderId?._id || msg.replyTo.senderId)?.toString();
                                    return rSenderId === authUser._id?.toString()
                                      ? "You"
                                      : selectedUser?.fullName || "";
                                  })()
                                }
                                isMe={msgIsMe}
                                onJump={() => scrollToMessage(msg.replyTo._id || msg.replyTo)}
                              />
                            )}

                            {msg.isDeleted ? (
                              <p className="text-sm italic" style={{ color: "var(--on-surface-variant)" }}>
                                🚫 This message was deleted
                              </p>
                            ) : (
                              <>
                                {msg.image && (
                                  <img
                                    src={msg.image}
                                    alt="Shared"
                                    className="rounded-xl max-h-52 object-cover mb-2 w-full"
                                  />
                                )}
                                {msg.audioUrl && (
                                  <AudioPlayer audioUrl={msg.audioUrl} duration={msg.audioDuration} />
                                )}
                                {msg.text && (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.text}
                                  </p>
                                )}
                              </>
                            )}

                            {/* Time + status (sender only, non-deleted) */}
                            {msgIsMe && !msg.isDeleted && (
                              <div className="flex items-center justify-end gap-1 mt-1.5">
                                <span style={{ fontSize: "0.6rem", opacity: 0.65 }}>
                                  {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <MessageStatusIcon status={msg.status} />
                              </div>
                            )}
                          </div>

                          {/* Reaction bubbles below bubble */}
                          {hasReactions && (
                            <ReactionBubbles
                              reactions={reactions}
                              myId={authUser._id}
                              onToggle={(emoji) => handleReactionToggle(msg._id, emoji)}
                            />
                          )}
                        </div>
                      </div>

                      {/* ── Inline Reaction Picker (portaled near emoji button) ── */}
                      {reactionPicker?.msgId === msg._id && (
                        <div
                          className="flex justify-center mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ReactionPicker
                            position={null}  // inline mode — no absolute positioning
                            onReact={(emoji) => {
                              handleReactionToggle(msg._id, emoji);
                              setReactionPicker(null);
                            }}
                            onClose={() => setReactionPicker(null)}
                            inline
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

      {/* Right-click context menu */}
      {contextMenu && (
        <MessageContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          isMe={isMe(contextMenu.msg)}
          isDeleted={contextMenu.msg.isDeleted}
          onReply={() => { handleReply(contextMenu.msg); setContextMenu(null); }}
          onDelete={() => { deleteMessage(contextMenu.msg._id); setContextMenu(null); }}
          onCopy={
            contextMenu.msg.text
              ? () => { navigator.clipboard.writeText(contextMenu.msg.text); setContextMenu(null); }
              : null
          }
          onClose={() => setContextMenu(null)}
        />
      )}

      <MessageInput />
    </div>
  );
}

export default ChatContainer;