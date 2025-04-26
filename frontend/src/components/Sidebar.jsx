import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeletons";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading,isMessaging,reorderUsers} = useChatStore();
  const { onlineUsers = [], user } = useAuthStore(); // default to [] to prevent undefined errors
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, []); // run once on mount
  

  

  

  const filteredUsers = showOnlineOnly
    ? (users || []).filter((u) => onlineUsers.includes(u._id) && u._id !== user?._id)
    : (users || []);

  const onlineCount = (onlineUsers || []).filter((id) => id !== user?._id).length;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>

        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineCount} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((u) => (
          <button
            key={u._id}
            onClick={() => setSelectedUser(u)}
            title={`Chat with ${u.fullName}`}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === u._id ? "bg-base-200 ring-2 ring-primary" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={u.profilePic || "/avatar.png"}
                alt={u.fullName}
                title={u.fullName}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(u._id) && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
              )}
            </div>

            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{u.fullName}</div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(u._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            {showOnlineOnly ? "No online users" : "No users found"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
