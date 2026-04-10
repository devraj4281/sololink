import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: {}, // Changed to object: { [userId]: [] }
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => {
    set({ selectedUser: user });
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    const { messages } = get();
    // Only show loading if we don't have messages for this user yet
    if (!messages[userId]) {
      set({ isMessagesLoading: true });
    }

    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ 
        messages: { ...get().messages, [userId]: res.data },
        isMessagesLoading: false
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
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
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ 
      messages: { ...messages, [userId]: [...userMessages, optimisticMessage] } 
    });

    try {
      const res = await axiosInstance.post(`/messages/send/${userId}`, messageData);
      const updatedMessages = get().messages[userId].filter(m => m._id !== tempId);
      set({ 
        messages: { ...get().messages, [userId]: [...updatedMessages, res.data] } 
      });
    } catch (error) {
      set({ 
        messages: { ...get().messages, [userId]: userMessages } 
      });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();
      
      // Determine which conversation this belongs to
      const authUser = useAuthStore.getState().authUser;
      const otherUserId = newMessage.senderId === authUser._id ? newMessage.receiverId : newMessage.senderId;
      
      const userMessages = messages[otherUserId] || [];
      
      set({ 
        messages: { ...messages, [otherUserId]: [...userMessages, newMessage] } 
      });

      if (isSoundEnabled && otherUserId === selectedUser?._id) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
}));