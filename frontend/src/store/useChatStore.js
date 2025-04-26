import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users.");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages.");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
  
    if (!selectedUser || !selectedUser._id) {
      toast.error("No user selected to send message.");
      return;
    }
  
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set((state) => ({
        messages: [...state.messages, res.data],
      }));
  
      // 👉 Reorder user after sending message
      get().reorderUsers(selectedUser);
  
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message.");
      console.error("Send Message Error:", error);
    }
  },
  

  // If you plan to re-enable these, be sure to uncomment both
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
  
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, users } = get();
  
      // ✅ Only update messages if the new message is for the selected chat
      const isCurrentChat =
        selectedUser &&
        (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);
  
      if (isCurrentChat) {
        set({ messages: [...messages, newMessage] });
      }
  
      // ✅ Reorder sender to top, only if the sender exists in the user list
      const sender = users.find((u) => u._id === newMessage.senderId);
      if (sender) {
        get().reorderUsers(sender);
      }
    });
  },
  
  

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
  reorderUsers: (user) => set((state) => {
    const updated = state.users.filter(u => u._id !== user._id);
    return { users: [user, ...updated] };
  }),
  

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
