import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom"; 
import { 
  MailIcon, LockIcon, LoaderIcon, EyeIcon, EyeOffIcon, 
  UserIcon, ShieldCheckIcon, GlobeIcon, CommandIcon 
} from "lucide-react";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData);
  };

  return (
  <div className="h-screen w-full flex flex-col items-center justify-between p-4 bg-[var(--surface)] overflow-hidden">
    
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full max-w-md">
      
      
      <div className="text-center mb-4 shrink-0">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)]">
          <CommandIcon className="w-6 h-6 text-[var(--on-primary)]" />
        </div>
        <h1 className="text-xl font-bold text-[var(--on-surface)]">Sololink</h1>
        <p className="text-[var(--on-surface-variant)] text-xs">Create Your Account</p>
      </div>

      
      <div className="w-full rounded-[1.5rem] p-6 shadow-ambient bg-[var(--surface-lowest)] border border-white/5">
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {[ 
            { label: "Full Name", icon: <UserIcon size={16} />, name: "fullName", type: "text", placeholder: "John Doe" },
            { label: "Username", icon: null, name: "username", type: "text", placeholder: "johndoe", isUsername: true },
            { label: "Email", icon: <MailIcon size={16} />, name: "email", type: "email", placeholder: "name@example.com" }
          ].map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">{field.label}</label>
              <div className="relative flex items-center">
                {field.isUsername ? (
                  <span className="absolute left-4 text-slate-500 font-semibold text-base">@</span>
                ) : (
                  <div className="absolute left-4 text-slate-500">{field.icon}</div>
                )}
                <input
                  type={field.type}
                  value={formData[field.name]}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="v-input h-10 pl-11 text-sm"
                  placeholder={field.placeholder}
                  required
                />
              </div>
            </div>
          ))}

          
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
            <div className="relative flex items-center">
              <LockIcon className="absolute left-4 text-slate-500" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="v-input h-10 pl-11 pr-11 text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-500 hover:text-[var(--primary)]"
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSigningUp} 
            className="v-btn-primary h-11 mt-4 text-sm font-bold w-full"
          >
            {isSigningUp ? <LoaderIcon className="w-4 h-4 animate-spin mx-auto" /> : "Sign Up"}
          </button>
        </form>

        
        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-xs text-slate-500">
            Already have an account? <Link to="/login" className="font-bold text-vblue hover:underline">Login</Link>
          </p>
          <p className="text-center text-[9px] text-slate-500 uppercase tracking-widest leading-tight opacity-70">
            By signing up, you agree to our <br/>
            <span className="underline cursor-pointer">Terms</span> & <span className="underline cursor-pointer">Privacy</span>
          </p>
        </div>
      </div>
    </div>

    
    <div className="py-4 flex gap-8 text-slate-400 opacity-40 shrink-0">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
          <ShieldCheckIcon className="w-3.5 h-3.5" /> End-to-end encrypted
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
          <GlobeIcon className="w-3.5 h-3.5" /> English (US)
        </div>
    </div>
  </div>
);
}

export default SignUpPage;