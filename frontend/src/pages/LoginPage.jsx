import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router";
import { MailIcon, LockIcon, LoaderIcon, EyeIcon, ArrowRightIcon, QrCodeIcon, ShieldCheckIcon, GlobeIcon, CommandIcon } from "lucide-react";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4" style={{ background: "var(--surface)" }}>
      {/* Branding */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)" }}>
          <CommandIcon className="w-8 h-8" style={{ color: "var(--on-primary)" }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--on-surface)" }}>Sololink</h1>
        <p className="mt-1" style={{ color: "var(--on-surface-variant)" }}>Welcome Back</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-[2rem] p-8 shadow-ambient" style={{ background: "var(--surface-lowest)" }}>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="v-label">Username or Email</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">@</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="v-input pl-10"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <a href="#" className="text-sm font-semibold text-vblue hover:underline">Forgot Password?</a>
            </div>
            <div className="relative">
              <LockIcon className="v-input-icon" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="v-input pr-10"
                placeholder="••••••••"
              />
              <EyeIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5 cursor-pointer hover:text-slate-600" />
            </div>
          </div>

          <button type="submit" disabled={isLoggingIn} className="v-btn-primary">
            {isLoggingIn ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <>Log In <ArrowRightIcon className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="bg-white px-2">Secure Options</span>
          </div>
        </div>

        <button type="button" className="v-btn-secondary flex items-center justify-center gap-2">
          <QrCodeIcon className="w-5 h-5" />
          Log in with QR Code
        </button>
      </div>

      <p className="mt-8 text-sm text-slate-600">
        New to Sololink? <Link to="/signup" className="font-semibold text-vblue hover:underline">Create an account</Link>
      </p>

      {/* Footer */}
      <div className="fixed bottom-8 flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4" /> End-to-end encrypted</div>
        <div className="flex items-center gap-2"><GlobeIcon className="w-4 h-4" /> English (US)</div>
      </div>
    </div>
  );
}

export default LoginPage;