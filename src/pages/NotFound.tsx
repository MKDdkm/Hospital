import { useNavigate } from "react-router-dom";
import { Building2, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4 text-center">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3 mb-12">
        <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <p
          className="text-white text-lg font-extrabold tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Clinik HMS
        </p>
      </div>

      {/* 404 */}
      <div className="relative z-10 space-y-4">
        <p
          className="text-[120px] font-extrabold leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          404
        </p>
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Page not found
        </h1>
        <p className="text-sm text-white/40 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="pt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-blue-500/25"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
