import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useTheme } from "../hooks/useTheme";

import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder.jsx";
import DefaultAvatar from "../components/DefaultAvatar";
import { MessageSquareIcon, UsersIcon, SettingsIcon, ArchiveIcon, LifeBuoyIcon, LogOutIcon, BellIcon, BellOffIcon, CommandIcon, SunIcon, MoonIcon } from "lucide-react";
import { useState, useRef } from "react";

/* Surface tokens — read from CSS vars so dark theme works automatically */
const S = {
  base:             "var(--surface)",
  low:              "var(--surface-low)",
  lowest:           "var(--surface-lowest)",
  high:             "var(--surface-high)",
  primary:          "var(--primary)",
  primaryFixed:     "var(--primary-fixed)",
  onSurface:        "var(--on-surface)",
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      setSelectedImg(reader.result);
      await updateProfile({ profilePic: reader.result });
    };
  };

  const navItems = [
    { id: "chats",    icon: MessageSquareIcon, label: "Chats" },
    { id: "contacts", icon: UsersIcon,         label: "Contacts" },
    { id: "settings", icon: SettingsIcon,      label: "Settings" },
  ];

  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ background: S.base }}>

      {/* ── NARROW ICON NAV (surface_container_low background shift) ── */}
      <div
        className="w-[72px] flex flex-col items-center py-5 gap-1 shrink-0"
        style={{ background: S.low }}
      >
        {/* Logo */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 shadow-ambient"
          style={{ background: "linear-gradient(135deg, #00628b 0%, #007caf 100%)" }}
        >
          <CommandIcon className="w-5 h-5 text-white" />
        </div>

        {/* Main nav */}
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setCurrentTab(id)}
            title={label}
            className="spring w-10 h-10 flex items-center justify-center rounded-xl"
            style={{
              background: currentTab === id ? S.primaryFixed : "transparent",
              color:      currentTab === id ? S.primary      : S.onSurfaceVariant,
            }}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}

        <div className="flex-1" />

        {/* Bottom nav */}
        {[
          { id: "archive", icon: ArchiveIcon,  label: "Archive" },
          { id: "support", icon: LifeBuoyIcon, label: "Support" },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} title={label}
            className="spring w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ color: S.onSurfaceVariant }}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}

        {/* Dark / Light theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light" : "Switch to Dark"}
          className="spring w-10 h-10 flex items-center justify-center rounded-xl"
          style={{ color: S.onSurfaceVariant }}
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
        <div className="mt-3 flex flex-col items-center gap-2">
          <button
            className="w-10 h-10 rounded-full overflow-hidden relative group shrink-0 spring"
            style={{ boxShadow: "0 0 0 2px rgba(0,98,139,0.18)" }}
            onClick={() => fileInputRef.current.click()}
            title="Change profile photo"
          >
            {(selectedImg || authUser.profilePic) ? (
              <img src={selectedImg || authUser.profilePic} alt="me" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--surface-high)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--on-surface-variant)" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-[9px] font-bold">Edit</span>
            </div>
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

          <button onClick={logout} title="Log out"
            className="spring w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: S.onSurfaceVariant }}
            onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "#fef2f2"; }}
            onMouseLeave={e => { e.currentTarget.style.color = S.onSurfaceVariant; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── CHATS PANEL (base surface, next to surface_container_low — the BG shift IS the divider) ── */}
      <div
        className="w-72 flex flex-col shrink-0"
        style={{ background: S.base }}
      >
        {/* Panel header */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <h2 style={{ color: S.onSurface, fontWeight: 700, fontSize: "1.0625rem" }} className="capitalize">
            {currentTab}
          </h2>
          <button
            onClick={toggleSound}
            title={isSoundEnabled ? "Mute" : "Enable sounds"}
            className="spring w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: S.onSurfaceVariant }}
          >
            {isSoundEnabled ? <BellIcon className="w-4 h-4" /> : <BellOffIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* Search — pill shape per spec §5 Input Fields */}
        <div className="px-4 pb-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: S.onSurfaceVariant }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full text-sm outline-none spring"
              style={{
                background: S.low,
                borderRadius: "9999px", /* full pill per spec */
                padding: "0.5rem 1rem 0.5rem 2.25rem",
                color: S.onSurface,
              }}
              onFocus={e => { e.target.style.boxShadow = "0 0 0 2px rgba(0,98,139,0.20)"; e.target.style.background = S.lowest; }}
              onBlur={e => { e.target.style.boxShadow = "none"; e.target.style.background = S.low; }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {currentTab === "chats" ? <ChatsList /> : <ContactList />}
        </div>

        {/* New Message FAB — ambient shadow per spec §4 */}
        <div className="px-4 pb-5">
          <button
            className="spring w-full flex items-center justify-center gap-2 text-white rounded-2xl py-3 text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #00628b 0%, #007caf 100%)", boxShadow: "0 12px 32px rgba(0,98,139,0.08)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Message
          </button>
        </div>
      </div>

      {/* ── CHAT AREA (surface_container_lowest = white — natural surface shift) ── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: S.lowest }}>
        {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
      </div>
    </div>
  );
}
export default ChatPage;

