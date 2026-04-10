import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useTheme } from "../hooks/useTheme";

import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder.jsx";

import { MessageSquareIcon, UsersIcon, SettingsIcon, ArchiveIcon, LifeBuoyIcon, LogOutIcon, BellIcon, BellOffIcon, CommandIcon, SunIcon, MoonIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const S = {
  base:             "var(--surface)",
  low:              "var(--surface-low)",
  lowest:           "var(--surface-lowest)",
  high:             "var(--surface-high)",
  primary:          "var(--primary)",
  primaryFixed:     "var(--primary-fixed)",
  onSurface:         "var(--on-surface)",
  onSurfaceVariant: "var(--on-surface-variant)",
};

function ChatPage() {
  const { selectedUser } = useChatStore();
  const { authUser, logout, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState("chats");
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  // Define the path to your public default avatar
  const defaultAvatarPath = "/avatar.png"; 

  // ISSUE 3 FIX: Clear preview if user logs out
  useEffect(() => {
    if (!authUser) setSelectedImg(null);
  }, [authUser]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Performance: Avoid reading massive files (Issue 1)
    if (file.size > 1024 * 1024) return; 

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64 = reader.result;
      setSelectedImg(base64);
      await updateProfile({ profilePic: base64 });
    };
  };

  const navItems = [
    { id: "chats",    icon: MessageSquareIcon, label: "Chats" },
    { id: "contacts", icon: UsersIcon,         label: "Contacts" },
    { id: "settings", icon: SettingsIcon,      label: "Settings" },
  ];

  const displayImg = selectedImg || authUser?.profilePic;

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ background: S.base }}>

      {/* ── NARROW ICON NAV ── */}
      <div
        className="w-[72px] flex flex-col items-center py-5 gap-1 shrink-0"
        style={{ background: S.low }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 shadow-ambient"
          style={{ background: "linear-gradient(135deg, #00628b 0%, #007caf 100%)" }}
        >
          <CommandIcon className="w-5 h-5 text-white" />
        </div>

        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setCurrentTab(id)}
            title={label}
            className="spring w-10 h-10 flex items-center justify-center rounded-xl"
            style={{
              background: currentTab === id ? S.primaryFixed : "transparent",
              color:       currentTab === id ? S.primary      : S.onSurfaceVariant,
            }}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}

        <div className="flex-1" />

        <button onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"}
          className="spring w-10 h-10 flex items-center justify-center rounded-xl"
          style={{ color: S.onSurfaceVariant }}
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        {/* PROFILE ACTION */}
        <div className="mt-3 flex flex-col items-center gap-2">
          <button
            className="w-10 h-10 rounded-full overflow-hidden relative group shrink-0 spring"
            style={{ boxShadow: "0 0 0 2px rgba(0,98,139,0.18)" }}
            onClick={() => fileInputRef.current.click()}
            title="Update photo"
          >
            {/* ISSUE 1 FIX: Logic check for profile pic + onError handler */}
            <img 
              src={displayImg || defaultAvatarPath} 
              alt="Me" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                if (e.target.src !== window.location.origin + defaultAvatarPath) {
                  e.target.src = defaultAvatarPath;
                }
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-[9px] font-bold">Edit</span>
            </div>
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

          <button onClick={() => { setSelectedImg(null); logout(); }} title="Logout"
            className="spring w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            style={{ color: S.onSurfaceVariant }}
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── CHATS PANEL ── */}
      <div className="w-72 flex flex-col shrink-0" style={{ background: S.base }}>
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <h2 style={{ color: S.onSurface, fontWeight: 700, fontSize: "1.0625rem" }} className="capitalize">
            {currentTab}
          </h2>
          <button onClick={toggleSound} className="spring w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: S.onSurfaceVariant }}
          >
            {isSoundEnabled ? <BellIcon className="w-4 h-4" /> : <BellOffIcon className="w-4 h-4" />}
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: S.onSurfaceVariant }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder={`Search ${currentTab}...`}
              autoComplete="off" // ISSUE 3 FIX: Prevent weird browser suggestions
              className="w-full text-sm outline-none spring"
              style={{
                background: S.low,
                borderRadius: "9999px",
                padding: "0.5rem 1rem 0.5rem 2.25rem",
                color: S.onSurface,
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
          {currentTab === "chats" ? <ChatsList /> : <ContactList />}
        </div>

        <div className="px-4 pb-5">
          <button className="spring w-full flex items-center justify-center gap-2 text-white rounded-2xl py-3 text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #00628b 0%, #007caf 100%)", boxShadow: "0 12px 32px rgba(0,98,139,0.08)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Message
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: S.lowest }}>
        {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
      </div>
    </div>
  );
}
export default ChatPage;