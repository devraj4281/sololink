import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useTheme } from "../../hooks/useTheme";
import { User, Mail, Palette, Tag, Camera, Save, Moon, Sun, Loader2, Search, Edit3, Check } from "lucide-react";
import toast from "react-hot-toast";

function SettingsPanel() {
  const { authUser, updateProfile } = useAuthStore();
  const { allContacts, getAllContacts, contactNicknames, setContactNickname } = useChatStore();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile Form state
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [selectedImg, setSelectedImg] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef(null);

  // Nicknames state
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNicknames, setEditingNicknames] = useState({}); // { [userId]: string }

  useEffect(() => {
    if (authUser) {
      setFullName(authUser.fullName || "");
      setEmail(authUser.email || "");
    }
  }, [authUser]);

  useEffect(() => {
    // Fetch all contacts on mount to list them in the nicknames editor
    getAllContacts();
  }, [getAllContacts]);

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Image is too large. Please select an image under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
    };
  };

  // Handle saving profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSavingProfile(true);
    try {
      const updates = { fullName, email };
      if (selectedImg) {
        updates.profilePic = selectedImg;
      }
      await updateProfile(updates);
      setSelectedImg(null);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save nickname helper
  const handleSaveNickname = (userId) => {
    const nickname = editingNicknames[userId];
    setContactNickname(userId, nickname);
    toast.success("Contact nickname updated!");
  };

  // Filter contacts by search query
  const filteredContacts = allContacts.filter((c) => {
    const query = searchQuery.toLowerCase();
    const resolvedName = contactNicknames[c._id] || c.fullName;
    return (
      c.fullName.toLowerCase().includes(query) ||
      resolvedName.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );
  });

  const defaultAvatarPath = "/avatar.png";

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[var(--surface-lowest)]">
      {/* Tab Switcher */}
      <div className="flex border-b border-[var(--surface-high)] bg-[var(--surface)] p-2 gap-2 shrink-0">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === "profile"
              ? "bg-[var(--primary-fixed)] text-[var(--primary)] shadow-sm"
              : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-low)]"
          }`}
        >
          <User className="w-4 h-4" />
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab("theme")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === "theme"
              ? "bg-[var(--primary-fixed)] text-[var(--primary)] shadow-sm"
              : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-low)]"
          }`}
        >
          <Palette className="w-4 h-4" />
          Theme Selector
        </button>
        <button
          onClick={() => setActiveTab("nicknames")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === "nicknames"
              ? "bg-[var(--primary-fixed)] text-[var(--primary)] shadow-sm"
              : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-low)]"
          }`}
        >
          <Tag className="w-4 h-4" />
          Rename Contacts
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
          
          {/* PROFILE DETAILS TAB */}
          {activeTab === "profile" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-[var(--on-surface)]">Edit Profile Details</h3>
                <p className="text-sm text-[var(--on-surface-variant)]">Update your avatar, name, and email details securely.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Uploader */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[var(--primary)] shadow-lg relative">
                      <img
                        src={selectedImg || authUser?.profilePic || defaultAvatarPath}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (e.target.src !== window.location.origin + defaultAvatarPath) {
                            e.target.src = defaultAvatarPath;
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-0 right-0 p-2 bg-[var(--primary)] text-white rounded-full shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <span className="text-xs text-[var(--on-surface-variant)]">Allowed formats: JPG, PNG, WEBP (Max 1MB)</span>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--on-surface)] mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--on-surface-variant)]" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-sm outline-none bg-[var(--surface-low)] text-[var(--on-surface)] rounded-xl py-3 pl-10 pr-4 border border-transparent focus:border-[var(--primary)] transition-all"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--on-surface)] mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--on-surface-variant)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-sm outline-none bg-[var(--surface-low)] text-[var(--on-surface)] rounded-xl py-3 pl-10 pr-4 border border-transparent focus:border-[var(--primary)] transition-all"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[var(--primary)] hover:bg-[var(--primary)] text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #00628b 0%, #007caf 100%)",
                  }}
                >
                  {isSavingProfile ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* APP THEME TAB */}
          {activeTab === "theme" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-[var(--on-surface)]">Choose Visual Aesthetic</h3>
                <p className="text-sm text-[var(--on-surface-variant)]">Switch interface theme instantly with a springy transition.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Mode Card */}
                <button
                  onClick={() => isDark && toggleTheme()}
                  className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${
                    !isDark
                      ? "border-[var(--primary)] bg-white shadow-lg scale-[1.02]"
                      : "border-[var(--surface-high)] bg-[var(--surface-low)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-4 shadow-sm">
                    <Sun className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="font-bold text-[var(--on-surface)]">Light Mode</span>
                  <span className="text-xs text-[var(--on-surface-variant)] text-center mt-1">Clean, standard desktop feel. Great for sunny days.</span>
                </button>

                {/* Dark Mode Card */}
                <button
                  onClick={() => !isDark && toggleTheme()}
                  className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${
                    isDark
                      ? "border-[var(--primary)] bg-[var(--surface-low)] shadow-lg scale-[1.02]"
                      : "border-[var(--surface-high)] bg-white opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
                    <Moon className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="font-bold text-[var(--on-surface)]">Dark Mode</span>
                  <span className="text-xs text-[var(--on-surface-variant)] text-center mt-1">Sleek neon aesthetic. Gentle on eyes at night.</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTACT NICKNAMES TAB */}
          {activeTab === "nicknames" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-xl font-bold text-[var(--on-surface)]">Custom Contact Nicknames</h3>
                <p className="text-sm text-[var(--on-surface-variant)]">Customize how contact names display in your chat lists and chat headers locally.</p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--on-surface-variant)]" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm outline-none bg-[var(--surface-low)] text-[var(--on-surface)] rounded-xl py-3 pl-10 pr-4 border border-transparent focus:border-[var(--primary)] transition-all"
                />
              </div>

              {/* Contacts List for Nicknaming */}
              <div className="space-y-3">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[var(--on-surface-variant)]">
                    No contacts found.
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const currentNickname = contactNicknames[contact._id] || "";
                    const activeEditVal = editingNicknames[contact._id] !== undefined 
                      ? editingNicknames[contact._id] 
                      : currentNickname;

                    return (
                      <div
                        key={contact._id}
                        className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--surface-high)] rounded-2xl gap-4 hover:shadow-sm transition-all"
                      >
                        {/* Contact Avatar & Info */}
                        <div className="flex items-center gap-3 shrink-0">
                          <img
                            src={contact.profilePic || defaultAvatarPath}
                            alt={contact.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-[var(--surface-high)]"
                            onError={(e) => {
                              if (e.target.src !== window.location.origin + defaultAvatarPath) {
                                e.target.src = defaultAvatarPath;
                              }
                            }}
                          />
                          <div className="hidden sm:block">
                            <h4 className="text-sm font-semibold text-[var(--on-surface)] leading-tight">
                              {contact.fullName}
                            </h4>
                            <span className="text-xs text-[var(--on-surface-variant)]">
                              {contact.email}
                            </span>
                          </div>
                        </div>

                        {/* Inline renaming input */}
                        <div className="flex-1 flex items-center gap-2 max-w-[320px]">
                          <div className="relative w-full">
                            <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--on-surface-variant)]" />
                            <input
                              type="text"
                              value={activeEditVal}
                              placeholder={contact.fullName}
                              onChange={(e) =>
                                setEditingNicknames({
                                  ...editingNicknames,
                                  [contact._id]: e.target.value,
                                })
                              }
                              className="w-full text-xs outline-none bg-[var(--surface-low)] text-[var(--on-surface)] rounded-lg py-2 pl-9 pr-3 border border-transparent focus:border-[var(--primary)] transition-all"
                            />
                          </div>
                          <button
                            onClick={() => handleSaveNickname(contact._id)}
                            className="p-2 bg-[var(--primary-fixed)] text-[var(--primary)] rounded-lg hover:scale-105 active:scale-95 transition-all shadow-sm"
                            title="Save custom name"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
