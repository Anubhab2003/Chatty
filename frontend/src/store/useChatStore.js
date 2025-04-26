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
  notifications: {},  // add this for blue dot tracking

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
      
      // ✅ Clear notification after reading messages
      set((state) => ({
        notifications: { ...state.notifications, [userId]: false }
      }));

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages.");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
  
    if (!selectedUser || !selectedUser._id) {
      toast.error("No user selected to send message.");
      return;
    }
  
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set((state) => ({
        messages: [...state.messages, res.data],
      }));

      // 👉 After sending message, no need to set notification for self.
      get().reorderUsers(selectedUser);

    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message.");
      console.error("Send Message Error:", error);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, users } = get();

      const isCurrentChat =
        selectedUser &&
        (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);

      if (isCurrentChat) {
        set({ messages: [...messages, newMessage] });
      } else {
        // ✅ If the message is NOT for the currently opened chat, show blue dot
        set((state) => ({
          notifications: { ...state.notifications, [newMessage.senderId]: true }
        }));
      }

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

  // ✅ CORRECT version
  setSelectedUser: (selectedUser) => {
    set((state) => ({
      selectedUser,
      notifications: { ...state.notifications, [selectedUser._id]: false }, // clear blue dot when user clicks
    }));
  },
}));
