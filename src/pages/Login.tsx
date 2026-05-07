import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import {
  Shield, Stethoscope, ClipboardList, Pill,
  Mail, Lock, Eye, EyeOff,
  Activity, Users, FileText, TrendingUp,
} from "lucide-react";

interface RoleConfig {
  value: UserRole;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  iconBg: string;
}

const roleConfigs: RoleConfig[] = [
  {
    value: "admin",
    label: "Admin",
    icon: <Shield className="w-5 h-5" />,
    color: "violet",
    activeBg: "bg-violet-50",
    activeBorder: "border-violet-500",
    activeText: "text-violet-700",
    iconBg: "bg-violet-500",
  },
  {
    value: "doctor",
    label: "Doctor",
    icon: <Stethoscope className="w-5 h-5" />,
    color: "emerald",
    activeBg: "bg-emerald-50",
    activeBorder: "border-emerald-500",
    activeText: "text-emerald-700",
    iconBg: "bg-emerald-500",
  },
  {
    value: "receptionist",
    label: "Receptionist",
    icon: <ClipboardList className="w-5 h-5" />,
    color: "sky",
    activeBg: "bg-sky-50",
    activeBorder: "border-sky-500",
    activeText: "text-sky-700",
    iconBg: "bg-sky-500",
  },
  {
    value: "pharmacy",
    label: "Pharmacy",
    icon: <Pill className="w-5 h-5" />,
    color: "amber",
    activeBg: "bg-amber-50",
    activeBorder: "border-amber-500",
    activeText: "text-amber-700",
    iconBg: "bg-amber-500",
  },
];

const features = [
  { icon: <Activity className="w-4 h-4" />, text: "Real-time patient queue management" },
  { icon: <Users className="w-4 h-4" />, text: "Multi-role access control" },
  { icon: <FileText className="w-4 h-4" />, text: "Digital prescriptions & pharmacy dispatch" },
  { icon: <TrendingUp className="w-4 h-4" />, text: "Revenue & operations analytics" },
];

const Login = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("receptionist");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setTimeout(() => {
      login(email, selectedRole);
      navigate(`/${selectedRole}`);
      setIsLoading(false);
    }, 600);
  };

  const activeRole = roleConfigs.find((r) => r.value === selectedRole)!;

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between bg-[#0f172a] relative overflow-hidden p-10 xl:p-14">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p
                className="text-white text-xl font-extrabold leading-none tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Clinik
              </p>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mt-0.5">Hospital Suite</p>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1
              className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Hospital Management
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Made Simple
              </span>
            </h1>
            <p className="mt-4 text-base text-white/55 leading-relaxed max-w-sm">
              A unified platform for every role — from front desk to pharmacy. Streamline operations, reduce errors, and deliver better care.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
                  {f.icon}
                </div>
                <p className="text-sm text-white/65">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-white/25">© 2026 Clinik HMS · Secure Hospital Management System</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:px-12 xl:px-16 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <p
            className="text-slate-900 text-lg font-extrabold tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Clinik HMS
          </p>
        </div>

        <div className="w-full max-w-md mx-auto space-y-7 animate-fade-in-up">
          {/* Header */}
          <div>
            <h2
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Welcome back
            </h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue to your workspace</p>
          </div>

          {/* Role selector */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-slate-700">Select your role</label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {roleConfigs.map((r) => {
                const isActive = selectedRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`flex flex-col items-center gap-2.5 py-3.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? `${r.activeBg} ${r.activeBorder} ${r.activeText} shadow-sm`
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        isActive ? `${r.iconBg} text-white shadow-sm` : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {r.icon}
                    </div>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="name@hospital.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full h-11 pl-10 pr-4 rounded-xl border-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                    errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full h-11 pl-10 pr-11 rounded-xl border-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                    errors.password
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                `Sign in as ${activeRole.label}`
              )}
            </button>
          </form>

          {/* Role hint */}
          <p className="text-center text-xs text-slate-400">
            Use any email &amp; password (6+ chars) to sign in
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
