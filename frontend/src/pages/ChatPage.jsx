import { useMediaQuery } from "../hooks/useMediaQuery";
import DesktopChatLayout from "../layouts/DesktopChatLayout";
import MobileChatLayout from "../layouts/MobileChatLayout";

function ChatPage() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <MobileChatLayout /> : <DesktopChatLayout />;
}

export default ChatPage;