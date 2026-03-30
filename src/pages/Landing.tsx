import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import hospitalBg from "@/assets/hospital-bg.jpg";
import { Building2, ShieldCheck, Sparkles } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <img
        src={hospitalBg}
        alt="Hospital"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/62 to-slate-950/80" />
      <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-4xl animate-fade-in-up rounded-3xl border border-white/20 bg-white/10 p-6 sm:p-10 backdrop-blur-xl shadow-[0_25px_80px_-32px_rgba(5,16,34,0.9)]">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Care Operations
          </div>

          <div className="grid h-20 w-20 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)] sm:h-24 sm:w-24">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
          </div>

          <div className="space-y-3 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground tracking-tight">
            MedCore HMS
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-primary-foreground/85 font-light">
              AI-Driven Hospital Management System
            </p>
            <p className="text-sm sm:text-base text-primary-foreground/70 max-w-xl mx-auto">
              Streamline front desk, doctor workflow, and administration from a single secure platform designed for busy hospitals.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white/90">
              <p className="text-lg font-semibold">Fast Intake</p>
              <p className="text-xs sm:text-sm text-white/75">Register and triage patients quickly</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white/90">
              <p className="text-lg font-semibold">Doctor Ready</p>
              <p className="text-xs sm:text-sm text-white/75">Search history and prescribe in seconds</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white/90">
              <p className="text-lg font-semibold">Live Insights</p>
              <p className="text-xs sm:text-sm text-white/75">Monitor appointments and billing health</p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-lg"
              onClick={() => navigate("/login")}
            >
              Get Started
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl border-white/35 bg-white/10 text-white hover:bg-white/20"
              onClick={() => navigate("/project-document")}
            >
              View Phase-1 Document
            </Button>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs sm:text-sm text-white/90">
              <ShieldCheck className="h-4 w-4" />
              Secure role-based access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
