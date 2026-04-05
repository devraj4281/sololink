import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import DefaultAvatar from "./DefaultAvatar";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, selectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => { getAllContacts(); }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      {allContacts.map((contact) => {
        const isOnline = onlineUsers.includes(contact._id);
        const isActive = selectedUser?._id === contact._id;

        return (
          <div
            key={contact._id}
            className="spring flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer"
            style={{ background: isActive ? "#c8e6ff" : "transparent" }}
            onClick={() => setSelectedUser(contact)}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#e8e8e9"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
          >
            <div className="relative shrink-0">
              {contact.profilePic ? (
                <img
                  src={contact.profilePic}
                  alt={contact.fullName}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <DefaultAvatar size="w-11 h-11" iconSize="w-7 h-7" />
              )}
              {/* Spec §5 Chips: primary_fixed bg for Online status */}
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: "#34d399" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate" style={{ color: isActive ? "#00628b" : "#1a1c1d" }}>
                {contact.fullName}
              </h4>
              <p className="text-xs truncate mt-0.5" style={{ color: "#3f4850" }}>
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}
export default ContactList;