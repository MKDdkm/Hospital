import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import hospitalBg from "@/assets/hospital-bg.jpg";
import { Building2, Shield, Stethoscope, ClipboardList, Mail, Lock, Eye, EyeOff } from "lucide-react";

const roles: { value: UserRole; label: string; icon: React.ReactNode }[] = [
  { value: "admin", label: "Admin", icon: <Shield className="w-5 h-5" /> },
  { value: "doctor", label: "Doctor", icon: <Stethoscope className="w-5 h-5" /> },
  { value: "receptionist", label: "Receptionist", icon: <ClipboardList className="w-5 h-5" /> },
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

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10">
      <img
        src={hospitalBg}
        alt="Hospital"
        className="absolute inset-0 hidden h-full w-full object-cover md:block"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 hidden bg-slate-950/70 md:block" />
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-5xl animate-fade-in-up">
          <div className="grid overflow-hidden rounded-3xl border border-white/20 bg-white/8 shadow-[0_30px_80px_-30px_rgba(9,22,40,0.85)] backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]">
            {/* Left Hero Section */}
            <section className="order-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600 px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-10">
              <div className="w-full max-w-md space-y-5 text-center sm:space-y-6">
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-3xl border border-white/30 bg-white/10 shadow-[0_30px_70px_-36px_rgba(0,0,0,0.9)] sm:h-36 sm:w-36 lg:h-40 lg:w-40">
                  <Building2 className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
                    MedCore HMS
                  </h1>
                  <p className="text-sm text-white/80 mt-2">Hospital Management System</p>
                </div>
              </div>
            </section>

            {/* Right Form Section */}
            <section className="order-2 bg-white/95 p-5 sm:p-8 lg:p-10">
              <div className="mx-auto w-full max-w-md space-y-6">
                {/* Header */}
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Welcome back</h2>
                  <p className="text-sm text-muted-foreground mt-1">Sign in to continue to your workspace</p>
                </div>

                {/* Role Selection Cards */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Select your role</label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setSelectedRole(r.value)}
                        className={`flex flex-col items-center justify-center gap-2 py-3 sm:py-4 px-2 rounded-xl text-xs font-semibold transition-all border-2 ${
                          selectedRole === r.value
                            ? "bg-gradient-to-b from-blue-50 to-cyan-50 border-blue-500 text-blue-700 shadow-lg shadow-blue-200/40"
                            : "bg-white border-slate-200 text-foreground/80 hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg transition-all ${
                            selectedRole === r.value
                              ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.icon}
                        </div>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="name@hospital.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        className={`w-full h-11 pl-12 pr-4 rounded-xl border-2 bg-background transition-all focus:outline-none ${
                          errors.email
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        }`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        className={`w-full h-11 pl-12 pr-12 rounded-xl border-2 bg-background transition-all focus:outline-none ${
                          errors.password
                            ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>

                  {/* Forgot Password Link */}
                  <div className="flex justify-end">
                    <a
                      href="#"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot Password?
                    </a>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      "Sign In to Dashboard"
                    )}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-sm py-4 mt-8">
        <div className="text-center text-xs sm:text-sm text-white/60">
          <p>© 2026 MedCore HMS | Secure Hospital Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
