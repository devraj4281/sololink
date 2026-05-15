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

function App() {
  const { checkAuth, isCheckingAuth, authUser, socket } = useAuthStore();
  const { subscribeToCallEvents, unsubscribeFromCallEvents } = useCallStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (socket) {
      subscribeToCallEvents();
      return () => unsubscribeFromCallEvents();
    }
  }, [socket, subscribeToCallEvents, unsubscribeFromCallEvents]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="h-screen w-full bg-vbg overflow-hidden">
      <Routes>
        <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
      </Routes>
      <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }} />
      {authUser && <IncomingCallModal />}
      {authUser && <CallScreen />}
    </div>
  );
}
export default App;
