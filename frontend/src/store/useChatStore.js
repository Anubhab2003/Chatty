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
  notifications: {},

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

      // Clear notification when opening chat
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

      // Reorder on successful send
      get().reorderUsers(selectedUser._id);

    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message.");
      console.error("Send Message Error:", error);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().user;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();

      const isCurrentChat =
        selectedUser &&
        (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id);

      if (isCurrentChat) {
        // Add to current messages
        set({ messages: [...messages, newMessage] });
      } else {
        // Only show notification if NOT current user sending
        if (newMessage.senderId !== authUser?._id) {
          set((state) => ({
            notifications: { ...state.notifications, [newMessage.senderId]: true }
          }));
        }
      }

      // Always reorder based on sender
      get().reorderUsers(newMessage.senderId);
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  reorderUsers: (userId) => {
    set((state) => {
      const foundUser = state.users.find((u) => u._id === userId);
      if (!foundUser) return {}; // user not found, no change

      const otherUsers = state.users.filter((u) => u._id !== userId);
      return { users: [foundUser, ...otherUsers] };
    });
  },

  setSelectedUser: (selectedUser) => {
    set((state) => ({
      selectedUser,
      notifications: { ...state.notifications, [selectedUser._id]: false },
    }));
  },
}));
