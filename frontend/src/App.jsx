import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { useCallStore } from "./store/useCallStore";
import { useEffect } from "react";
import PageLoader from "./components/ui/PageLoader";
import { Toaster } from "react-hot-toast";
import IncomingCallModal from "./components/calls/IncomingCallModal";
import CallScreen from "./components/calls/CallScreen";
import CallScreenMinimized from "./components/calls/CallScreenMinimized";
import ReconnectModal from "./components/calls/ReconnectModal";

function App() {
  const { checkAuth, isCheckingAuth, authUser, socket } = useAuthStore();
  const {
    subscribeToCallEvents,
    unsubscribeFromCallEvents,
    callStatus,
    checkActiveCall,
  } = useCallStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (socket) {
      subscribeToCallEvents();
      return () => unsubscribeFromCallEvents();
    }
  }, [socket, subscribeToCallEvents, unsubscribeFromCallEvents]);

  // After auth resolves, check sessionStorage for a stale active call.
  // This hits GET /api/calls/active to verify against the server before
  // showing the ReconnectModal.
  useEffect(() => {
    if (authUser) {
      checkActiveCall();
    }
    // Only run once after authUser is first available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id]);

  // Prevent accidental page close during active calls
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (callStatus === "active" || callStatus === "calling" || callStatus === "reconnecting") {
        e.preventDefault();
        e.returnValue = "You have an active call. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [callStatus]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="h-screen w-full bg-vbg overflow-hidden">
      <Routes>
        <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
      </Routes>
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Inter, sans-serif" } }} />
      {authUser && <IncomingCallModal />}
      {authUser && <CallScreen />}
      {authUser && <CallScreenMinimized />}
      {authUser && <ReconnectModal />}
    </div>
  );
}

export default App;
