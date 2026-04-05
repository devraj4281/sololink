import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router";
import { MailIcon, LockIcon, LoaderIcon, EyeIcon, UserIcon, ShieldCheckIcon, GlobeIcon, CommandIcon } from "lucide-react";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", username: "", email: "", password: "" });
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4" style={{ background: "var(--surface)" }}>
      {/* Branding */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)" }}>
          <CommandIcon className="w-8 h-8" style={{ color: "var(--on-primary)" }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--on-surface)" }}>Sololink</h1>
        <p className="mt-1" style={{ color: "var(--on-surface-variant)" }}>Create Your Account</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-[2rem] p-8 shadow-ambient" style={{ background: "var(--surface-lowest)" }}>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="v-label">Full Name</label>
            <div className="relative">
              <UserIcon className="v-input-icon" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="v-input"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="v-label">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">@</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="v-input pl-10"
                placeholder="johndoe"
              />
            </div>
          </div>

          <div>
            <label className="v-label">Email</label>
            <div className="relative">
              <MailIcon className="v-input-icon" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="v-input"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="v-label">Password</label>
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

          <button type="submit" disabled={isSigningUp} className="v-btn-primary mt-2">
            {isSigningUp ? <LoaderIcon className="w-5 h-5 animate-spin" /> : "Sign Up"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-semibold text-vblue hover:underline">Login</Link>
        </p>
        
        <p className="mt-4 text-center text-xs text-slate-400 uppercase tracking-wider font-bold">
          By signing up, you agree to our<br/> <a href="#" className="text-slate-500 hover:text-vblue transition-colors">Terms</a> and <a href="#" className="text-slate-500 hover:text-vblue transition-colors">Privacy Policy</a>.
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 flex gap-6 text-slate-400">
          <ShieldCheckIcon className="w-5 h-5 hover:text-slate-600 transition-colors" />
          <GlobeIcon className="w-5 h-5 hover:text-slate-600 transition-colors" />
      </div>
    </div>
  );
}

export default SignUpPage;