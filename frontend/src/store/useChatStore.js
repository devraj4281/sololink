import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  calls: [],
  messages: {}, // { [userId]: [] }
  cursors: {},
  hasMore: {},
  isLoadMoreLoading: {},
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isCallsLoading: false,
  typingUsers: [],
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  replyingTo: null, // Message being replied to
  contactNicknames: JSON.parse(localStorage.getItem("contactNicknames") || "{}"),

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setContactNickname: (userId, nickname) => {
    const updated = { ...get().contactNicknames };
    if (!nickname || nickname.trim() === "") {
      delete updated[userId];
    } else {
      updated[userId] = nickname.trim();
    }
    localStorage.setItem("contactNicknames", JSON.stringify(updated));
    set({ contactNicknames: updated });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => {
    set({ selectedUser: user });
    // Immediately zero the badge without waiting for ChatContainer's useEffect
    if (user) {
      const { chats } = get();
      const updated = chats.map((c) =>
        c._id?.toString() === user._id?.toString() ? { ...c, unreadCount: 0 } : c
      );
      set({ chats: updated });
    }
  },
  setReplyingTo: (message) => set({ replyingTo: message }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    const { messages } = get();
    if (!messages[userId]) {
      set({ isMessagesLoading: true });
    }

    try {
      const res = await axiosInstance.get(`/messages/${userId}?limit=20`);
      const { messages: fetchedMessages, nextCursor, hasMore } = res.data;

      set({
        messages: { ...get().messages, [userId]: fetchedMessages },
        cursors: { ...get().cursors, [userId]: nextCursor },
        hasMore: { ...get().hasMore, [userId]: hasMore },
        isMessagesLoading: false,
      });

      // Mark conversation as read when we open it
      axiosInstance.post(`/messages/read/${userId}`).catch(() => {});
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      set({ isMessagesLoading: false });
    }
  },

  loadMoreMessages: async (userId) => {
    const { cursors, hasMore, isLoadMoreLoading, messages } = get();
    const cursor = cursors[userId];
    if (!hasMore[userId] || isLoadMoreLoading[userId] || !cursor) return;

    set({ isLoadMoreLoading: { ...get().isLoadMoreLoading, [userId]: true } });

    try {
      const res = await axiosInstance.get(`/messages/${userId}?limit=20&cursor=${cursor}`);
      const { messages: fetchedMessages, nextCursor, hasMore: newHasMore } = res.data;
      const currentMessages = messages[userId] || [];

      set({
        messages: {
          ...get().messages,
          [userId]: [...fetchedMessages, ...currentMessages],
        },
        cursors: { ...get().cursors, [userId]: nextCursor },
        hasMore: { ...get().hasMore, [userId]: newHasMore },
        isLoadMoreLoading: { ...get().isLoadMoreLoading, [userId]: false },
      });
    } catch (error) {
      console.error("Error loading more messages:", error);
      set({ isLoadMoreLoading: { ...get().isLoadMoreLoading, [userId]: false } });
    }
  },

  fetchCallHistory: async () => {
    set({ isCallsLoading: true });
    try {
      const res = await axiosInstance.get("/messages/call-history");
      set({ calls: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch call history");
    } finally {
      set({ isCallsLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyingTo } = get();
    const { authUser } = useAuthStore.getState();
    const userId = selectedUser._id;
    const userMessages = messages[userId] || [];

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: userId,
      text: messageData.text,
      image: messageData.image,
      audioUrl: messageData.audioUrl,
      audioDuration: messageData.audioDuration,
      type: messageData.audioUrl ? "audio" : messageData.image ? "image" : "text",
      createdAt: new Date().toISOString(),
      status: "sent",
      replyTo: replyingTo || null,
      isOptimistic: true,
    };

    set({
      messages: { ...messages, [userId]: [...userMessages, optimisticMessage] },
      replyingTo: null,
    });

    try {
      const payload = {};
      if (messageData.text) payload.text = messageData.text;
      if (messageData.image) payload.image = messageData.image;
      if (messageData.audio) payload.audio = messageData.audio;
      if (messageData.audioDuration) payload.audioDuration = messageData.audioDuration;
      if (replyingTo) payload.replyToMessageId = replyingTo._id;

      const res = await axiosInstance.post(`/messages/send/${userId}`, payload);
      const updatedMessages = get().messages[userId].filter((m) => m._id !== tempId);
      set({ messages: { ...get().messages, [userId]: [...updatedMessages, res.data] } });
    } catch (error) {
      set({ messages: { ...get().messages, [userId]: userMessages } });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  addReaction: async (messageId, emoji, userId) => {
    // Optimistic update
    const updateMessageReactions = (msgs, msgId, emojiKey, myId, remove) => {
      return msgs.map((m) => {
        if (m._id !== msgId) return m;
        const reactions = { ...(m.reactions || {}) };
        const current = reactions[emojiKey] ? [...reactions[emojiKey]] : [];
        if (remove) {
          reactions[emojiKey] = current.filter((id) => id?.toString() !== myId?.toString());
          if (reactions[emojiKey].length === 0) delete reactions[emojiKey];
        } else {
          reactions[emojiKey] = [...current, myId];
        }
        return { ...m, reactions };
      });
    };

    // Determine if it's a remove (already reacted)
    const { messages, selectedUser } = get();
    const uid = selectedUser?._id;
    const currentMsgs = messages[uid] || [];
    const msg = currentMsgs.find((m) => m._id === messageId);
    const alreadyReacted =
      msg?.reactions?.[emoji]?.map((id) => id?.toString()).includes(userId?.toString());

    set({
      messages: {
        ...messages,
        [uid]: updateMessageReactions(currentMsgs, messageId, emoji, userId, alreadyReacted),
      },
    });

    try {
      await axiosInstance.post(`/messages/${messageId}/reactions`, { emoji });
    } catch (error) {
      // Rollback
      set({ messages: { ...get().messages, [uid]: currentMsgs } });
      toast.error("Failed to react to message");
    }
  },

  deleteMessage: async (messageId) => {
    const { messages, selectedUser } = get();
    const uid = selectedUser?._id;
    const currentMsgs = messages[uid] || [];

    // Optimistic: mark as deleted
    const optimistic = currentMsgs.map((m) =>
      m._id === messageId ? { ...m, isDeleted: true, text: null, image: null, audioUrl: null } : m
    );
    set({ messages: { ...messages, [uid]: optimistic } });

    try {
      await axiosInstance.post(`/messages/${messageId}/delete`);
    } catch (error) {
      set({ messages: { ...get().messages, [uid]: currentMsgs } });
      toast.error("Failed to delete message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, calls } = get();
      const authUser = useAuthStore.getState().authUser;
      // Helper: normalize any ID shape to string
      const toStr = (id) => (id?._id || id)?.toString?.() ?? "";

      const authId = toStr(authUser._id);
      const senderIdStr = toStr(newMessage.senderId);
      const receiverIdStr = toStr(newMessage.receiverId);
      const otherUserId = senderIdStr === authId ? receiverIdStr : senderIdStr;

      const userMessages = messages[otherUserId] || [];

      // Emit delivered acknowledgment if we received it (not our own)
      if (senderIdStr !== authId) {
        socket.emit("message:delivered", {
          messageId: newMessage._id,
          senderId: senderIdStr,
        });
      }

      set({ messages: { ...messages, [otherUserId]: [...userMessages, newMessage] } });

      if (newMessage.type?.startsWith("call_") && calls.length > 0) {
        set({ calls: [newMessage, ...calls] });
      }

      // Update chat list unread count — only increment if it's NOT the currently open chat
      const { chats } = get();
      if (senderIdStr !== authId) {
        const currentSelectedId = toStr(selectedUser?._id);
        const isCurrentChat = currentSelectedId === senderIdStr;

        const updatedChats = chats.map((c) => {
          if (toStr(c._id) !== senderIdStr) return c;
          return {
            ...c,
            lastMessage: {
              text: newMessage.text || (newMessage.audioUrl ? "[Voice Message]" : "[Image]"),
              type: newMessage.type,
              senderId: senderIdStr,
            },
            lastMessageAt: newMessage.createdAt,
            unreadCount: isCurrentChat ? 0 : (c.unreadCount || 0) + 1,
          };
        });
        set({ chats: updatedChats });
      }

      if (isSoundEnabled && otherUserId === selectedUser?._id) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {});
      }
    });

    // Message delivery/read status updates
    socket.on("message:status-updated", ({ messageId, status, deliveredAt, readAt }) => {
      const { messages } = get();
      const uid = selectedUser?._id;
      if (!uid || !messages[uid]) return;
      const updated = messages[uid].map((m) =>
        m._id === messageId ? { ...m, status, deliveredAt, readAt } : m
      );
      set({ messages: { ...messages, [uid]: updated } });
    });

    socket.on("message:status-updated-bulk", ({ messageIds, status, readAt }) => {
      const { messages } = get();
      const uid = selectedUser?._id;
      if (!uid || !messages[uid]) return;
      const idSet = new Set(messageIds);
      const updated = messages[uid].map((m) =>
        idSet.has(m._id) ? { ...m, status, readAt } : m
      );
      set({ messages: { ...messages, [uid]: updated } });
    });

    // Reaction events
    socket.on("message:reaction-added", ({ messageId, emoji, userId, reactions }) => {
      const { messages } = get();
      const uid = selectedUser?._id;
      if (!uid || !messages[uid]) return;
      const updated = messages[uid].map((m) =>
        m._id === messageId ? { ...m, reactions } : m
      );
      set({ messages: { ...messages, [uid]: updated } });
    });

    socket.on("message:reaction-removed", ({ messageId, emoji, userId, reactions }) => {
      const { messages } = get();
      const uid = selectedUser?._id;
      if (!uid || !messages[uid]) return;
      const updated = messages[uid].map((m) =>
        m._id === messageId ? { ...m, reactions } : m
      );
      set({ messages: { ...messages, [uid]: updated } });
    });

    // Message deleted by sender
    socket.on("message:deleted", ({ messageId }) => {
      const { messages } = get();
      Object.keys(messages).forEach((uid) => {
        const updated = messages[uid].map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, text: null, image: null, audioUrl: null }
            : m
        );
        messages[uid] = updated;
      });
      set({ messages: { ...messages } });
    });

    // Typing
    socket.on("userTyping", ({ userId }) => {
      set((state) => {
        if (!state.typingUsers.includes(userId)) {
          return { typingUsers: [...state.typingUsers, userId] };
        }
        return state;
      });
    });

    socket.on("userStoppedTyping", ({ userId }) => {
      set((state) => ({
        typingUsers: state.typingUsers.filter((id) => id !== userId),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("message:status-updated");
    socket.off("message:status-updated-bulk");
    socket.off("message:reaction-added");
    socket.off("message:reaction-removed");
    socket.off("message:deleted");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
  },

  // Mark a specific conversation as read locally (called when user opens chat)
  markChatAsRead: (userId) => {
    const { chats } = get();
    const updated = chats.map((c) =>
      c._id.toString() === userId.toString() ? { ...c, unreadCount: 0 } : c
    );
    set({ chats: updated });
  },
}));