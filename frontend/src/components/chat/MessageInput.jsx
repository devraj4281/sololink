import { useRef, useState, useEffect } from "react";
import useKeyboardSound from "../../hooks/useKeyboardSound";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
import { PlusCircleIcon, SendIcon, XIcon, Mic } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import ReplyPreview from "./ReplyPreview";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [focused, setFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const isSoundEnabled = useChatStore((state) => state.isSoundEnabled);
  const selectedUser = useChatStore((state) => state.selectedUser);
  const socket = useAuthStore((state) => state.socket);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTyping = (e) => {
    setText(e.target.value);

    if (socket && selectedUser) {
      socket.emit("typing", { to: selectedUser._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { to: selectedUser._id });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSubmitting) return;

    const currentText = text.trim();
    const currentImage = imagePreview;

    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsSubmitting(true);

    if (socket && selectedUser) {
      socket.emit("stopTyping", { to: selectedUser._id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      if (isSoundEnabled) setTimeout(() => playRandomKeyStrokeSound(), 0);

      const payload = {};
      if (currentText) payload.text = currentText;
      if (currentImage) payload.image = currentImage;

      await sendMessage(payload);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceSend = async (blob, durationSecs) => {
    setIsRecording(false);
    if (!blob) return;

    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      try {
        await sendMessage({
          audio: base64Audio,
          audioUrl: base64Audio,
          audioDuration: durationSecs,
        });
      } catch (err) {
        toast.error("Failed to send voice message");
      }
    };
    reader.readAsDataURL(blob);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Show voice recorder UI
  if (isRecording) {
    return (
      <div className="p-4 md:p-6 shrink-0 w-full" style={{ background: "transparent" }}>
        <div className="max-w-4xl mx-auto w-full">
          <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setIsRecording(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 shrink-0 w-full" style={{ background: "transparent" }}>
      {/* Reply preview bar */}
      <div className="max-w-4xl mx-auto w-full">
        <ReplyPreview />
      </div>

      <div
        className="max-w-4xl mx-auto w-full p-2 transition-shadow duration-300 mt-2"
        style={{
          background: "var(--surface-lowest)",
          boxShadow: focused ? "0 8px 32px rgba(0,98,139,0.12)" : "0 4px 24px rgba(0,0,0,0.06)",
          borderRadius: "2rem",
        }}
      >
        {imagePreview && (
          <div className="mb-3 px-4 pt-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-700" />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg hover:scale-110 transition-transform"
                type="button"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 flex items-center justify-center rounded-full shrink-0 hover:bg-slate-800 transition-colors"
            style={{ color: imagePreview ? "var(--primary)" : "var(--on-surface-variant)" }}
          >
            <PlusCircleIcon className="w-6 h-6" />
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={handleTyping}
              onKeyDown={() => isSoundEnabled && playRandomKeyStrokeSound()}
              autoComplete="off"
              style={{
                width: "100%",
                background: "transparent",
                padding: "0.625rem 3rem 0.625rem 0.5rem",
                fontSize: "0.9375rem",
                color: "var(--on-surface)",
                outline: "none",
                border: "none",
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Write a message..."
            />
          </div>

          {/* Mic button (only when no text/image) */}
          {!text.trim() && !imagePreview && (
            <button
              type="button"
              onClick={() => setIsRecording(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full shrink-0 hover:bg-slate-800 transition-colors"
              style={{ color: "var(--on-surface-variant)" }}
              title="Record voice message"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <button
            type="submit"
            disabled={!text.trim() && !imagePreview}
            className="w-11 h-11 flex items-center justify-center rounded-full shrink-0 shadow-sm active:scale-90 transition-all"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
              color: "var(--on-primary)",
              opacity: !text.trim() && !imagePreview ? 0.4 : 1,
            }}
          >
            <SendIcon className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default MessageInput;