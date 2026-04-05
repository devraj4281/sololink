import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { PlusCircleIcon, SmileIcon, SendIcon, XIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [focused, setFocused] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage, isSoundEnabled } = useChatStore();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();
    sendMessage({ text: text.trim(), image: imagePreview });
    setText("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-4 md:p-6 shrink-0 w-full" style={{ background: "transparent" }}>
      <div 
        className="max-w-4xl mx-auto w-full p-2 transition-shadow duration-300"
        style={{ 
          background: "var(--surface-lowest)", 
          boxShadow: focused ? "0 8px 32px rgba(0,98,139,0.12)" : "0 4px 24px rgba(0,0,0,0.06)", 
          borderRadius: "2rem" 
        }}
      >
        {imagePreview && (
          <div className="mb-3 px-4 pt-2">
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl" />
              <button
                onClick={removeImage}
                className="spring absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "var(--surface-lowest)", boxShadow: "0 1px 6px rgba(0,0,0,0.18)", color: "var(--on-surface-variant)" }}
                type="button"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* Attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="spring w-12 h-12 flex items-center justify-center rounded-full shrink-0"
            style={{ color: imagePreview ? "var(--primary)" : "var(--on-surface-variant)", background: imagePreview ? "var(--primary-fixed)" : "transparent" }}
          >
            <PlusCircleIcon className="w-6 h-6" />
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

          {/* Message input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => { setText(e.target.value); isSoundEnabled && playRandomKeyStrokeSound(); }}
              style={{
                width: "100%",
                background: "transparent",
                borderRadius: "1rem",
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
            <button
              type="button"
              className="spring absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
              style={{ color: "var(--on-surface-variant)" }}
            >
              <SmileIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Send */}
          <button
            type="submit"
            disabled={!text.trim() && !imagePreview}
            className="spring w-11 h-11 flex items-center justify-center rounded-full shrink-0 shadow-sm active:scale-90"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
              color: "var(--on-primary)",
              opacity: (!text.trim() && !imagePreview) ? 0.40 : 1,
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
