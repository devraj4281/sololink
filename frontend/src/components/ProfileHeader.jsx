import { useState, useRef, useEffect } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  
  const defaultAvatarPath = "/avatar.png"; 

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authUser) {
      setSelectedImg(null);
    }
  }, [authUser]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Check file size to improve speed (Issue 1)
    if (file.size > 1024 * 1024) {
      alert("Image is too large. Please choose a file under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const displayImg = selectedImg || authUser?.profilePic;

  return (
    <div className="p-6 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          
          <div className="avatar online">
            <button
              className="size-14 rounded-full overflow-hidden relative group border border-slate-700"
              onClick={() => fileInputRef.current.click()}
              type="button" 
            >
              <img
                src={displayImg || defaultAvatarPath}
                alt="User profile"
                className="size-full object-cover"
                onError={(e) => {
                  if (e.target.src !== window.location.origin + defaultAvatarPath) {
                    e.target.src = defaultAvatarPath;
                  }
                }}
              />

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-[10px] font-medium uppercase tracking-wider">Change</span>
              </div>
            </button>

            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div>
            <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
              {authUser?.fullName || "Guest"}
            </h3>
            <p className="text-emerald-500 text-xs font-medium">Online</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {/* LOGOUT BUTTON */}
          <button
            className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-slate-800 rounded-full"
            title="Logout"
            onClick={() => {
              setSelectedImg(null); 
              logout();
            }}
          >
            <LogOutIcon className="size-5" />
          </button>

          {/* SOUND TOGGLE */}
          <button
            className="text-slate-400 hover:text-sky-400 transition-colors p-2 hover:bg-slate-800 rounded-full"
            title={isSoundEnabled ? "Mute" : "Unmute"}
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch(() => {});
              toggleSound();
            }}
          >
            {isSoundEnabled ? <Volume2Icon className="size-5" /> : <VolumeOffIcon className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;