import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import ChatContainer from "../components/chat/ChatContainer";
import ChatsList from "../components/chat/ChatsList";
import ContactList from "../components/contacts/ContactList";
import CallsList from "../components/calls/CallsList";
import { MessageSquareIcon, UsersIcon, PhoneIcon, SettingsIcon, SunIcon, MoonIcon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import SettingsPanel from "../components/settings/SettingsPanel";

function MobileChatLayout() {
  const selectedUser = useChatStore((state) => state.selectedUser);
  const { isDark, toggle: toggleTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState("chats");

  const navItems = [
    { id: "chats",    icon: MessageSquareIcon, label: "Chats" },
    { id: "calls",    icon: PhoneIcon,         label: "Calls" },
    { id: "contacts", icon: UsersIcon,         label: "Contacts" },
    { id: "settings", icon: SettingsIcon,      label: "Settings" },
  ];

  const isChat = Boolean(selectedUser);

  return (
    <div className="h-screen w-full relative overflow-hidden" style={{ background: "var(--surface)" }}>

      {/* ── LIST PANEL — slides out left when chat is open ── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          transform: isChat ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
          background: "var(--surface)",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between shrink-0">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--on-surface)" }} className="capitalize">
            {currentTab}
          </h2>
          <button onClick={toggleTheme} title={isDark ? "Light Mode" : "Dark Mode"}
            className="spring w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--surface-low)]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 shrink-0">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--on-surface-variant)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder={`Search ${currentTab}...`}
              autoComplete="off"
              className="w-full text-sm outline-none spring bg-[var(--surface-low)] text-[var(--on-surface)] rounded-full py-2 pl-9 pr-4"
            />
          </div>
        </div>

        {/* Content area */}
        <div className={`flex-1 ${currentTab === "settings" ? "overflow-hidden" : "overflow-y-auto px-2 pb-2"}`}>
          {currentTab === "chats"    && <div className="space-y-1"><ChatsList /></div>}
          {currentTab === "contacts" && <div className="space-y-1"><ContactList /></div>}
          {currentTab === "calls"    && <div className="space-y-1"><CallsList /></div>}
          {currentTab === "settings" && <SettingsPanel />}
        </div>

        {/* Bottom Nav */}
        <div
          className="flex justify-around items-center px-4 py-3 border-t shrink-0"
          style={{ background: "var(--surface-low)", borderColor: "var(--surface-high)" }}
        >
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-[var(--primary)]" : "text-[var(--on-surface-variant)]"}`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? "fill-[var(--primary)] text-[var(--primary)]" : "fill-none"}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CHAT PANEL — slides in from right when chat is open ── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          transform: isChat ? "translateX(0)" : "translateX(100%)",
          transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
          background: "var(--surface-lowest)",
        }}
      >
        <ChatContainer />
      </div>
    </div>
  );
}

export default MobileChatLayout;
