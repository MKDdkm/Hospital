import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, UserPlus, Users, CalendarPlus, Receipt,
  Stethoscope, Search, FileText, PlusCircle,
  UserCog, BarChart3, LogOut, Menu, ChevronRight, Building2, BedDouble, ClipboardCheck, Bell, Pill
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const navItems: Record<string, NavItem[]> = {
  receptionist: [
    { label: "Dashboard", path: "/receptionist", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Register Patient", path: "/receptionist/register", icon: <UserPlus className="w-5 h-5" /> },
    { label: "Patient List", path: "/receptionist/patients", icon: <Users className="w-5 h-5" /> },
    { label: "Book Appointment", path: "/receptionist/appointment", icon: <CalendarPlus className="w-5 h-5" /> },
    { label: "Billing", path: "/receptionist/billing", icon: <Receipt className="w-5 h-5" /> },
    { label: "Room Occupancy", path: "/receptionist/rooms", icon: <BedDouble className="w-5 h-5" /> },
    { label: "Closing Report", path: "/receptionist/closing-report", icon: <ClipboardCheck className="w-5 h-5" /> },
  ],
  doctor: [
    { label: "Dashboard", path: "/doctor", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Search Patient", path: "/doctor/search", icon: <Search className="w-5 h-5" /> },
    { label: "Patient History", path: "/doctor/history", icon: <FileText className="w-5 h-5" /> },
    { label: "Add Prescription", path: "/doctor/prescribe", icon: <PlusCircle className="w-5 h-5" /> },
    { label: "Prescriptions", path: "/doctor/prescriptions", icon: <Stethoscope className="w-5 h-5" /> },
  ],
  admin: [
    { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "User Management", path: "/admin/users", icon: <UserCog className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <BarChart3 className="w-5 h-5" /> },
  ],
  pharmacy: [
    { label: "Landing", path: "/pharmacy", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Pharmacy Dashboard", path: "/pharmacy/dashboard", icon: <Pill className="w-5 h-5" /> },
  ],
};

const roleLabels: Record<string, string> = {
  receptionist: "Receptionist",
  doctor: "Doctor",
  admin: "Administrator",
  pharmacy: "Pharmacy",
};

const headerTitles: Record<string, string> = {
  receptionist: "Patient profile",
  doctor: "Doctor dashboard",
  admin: "Admin command",
  pharmacy: "Pharmacy operations",
};

const headerSubtitles: Record<string, string> = {
  receptionist: "Front desk and queue flow",
  doctor: "Care delivery and clinical queue",
  admin: "Operations, users, and reporting",
  pharmacy: "Prescription queue and dispensing control",
};

const receptionistDirectory: Record<string, { name: string; desk: string; shift: string; phone: string }> = {
  "frontdesk@medcore.com": { name: "Neha Singh", desk: "Front Desk A", shift: "Morning (08:00 - 16:00)", phone: "+91 98765 42001" },
  "reception@medcore.com": { name: "Pooja Desai", desk: "Front Desk B", shift: "Evening (14:00 - 22:00)", phone: "+91 98765 42002" },
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { role, email, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = navItems[role || "receptionist"];
  const roleLabel = roleLabels[role || "receptionist"];
  const headerTitle = headerTitles[role || "receptionist"];
  const headerSubtitle = headerSubtitles[role || "receptionist"];
  const receptionistProfile = role === "receptionist"
    ? receptionistDirectory[(email || "").toLowerCase()] ?? {
      name: email ? email.split("@")[0].replace(/[._-]/g, " ") : "Front Desk Executive",
      desk: "Front Desk",
      shift: "General Shift",
      phone: "+91 90000 00000",
    }
    : null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#cbdde9] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1480px] overflow-hidden rounded-[34px] border border-white/80 bg-[#cbdde9] shadow-[0_35px_90px_-46px_rgba(30,76,107,0.45)] sm:min-h-[calc(100vh-3rem)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/30 bg-white/25 backdrop-blur-2xl shadow-[0_28px_70px_-40px_rgba(40,114,161,0.6)] transition-all duration-500 ease-out lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col items-center gap-4 border-b border-white/20 px-7 py-10">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-white/50 bg-white/50 backdrop-blur-md shadow-[0_14px_28px_-16px_rgba(40,114,161,0.6)]">
            <Building2 className="h-7 w-7 text-[#1b5f8f]" />
          </div>
          <div className="text-center">
            <p className="font-display text-[34px] font-extrabold uppercase tracking-[0.12em] text-slate-900">Clinik</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-700">{roleLabel} workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-4">
          {items.map((item, idx) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{ animationDelay: `${idx * 30}ms` }}
                className={`group flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-[13px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-sm border transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
                  active
                    ? "bg-white/85 border-white/60 text-[#1b5275] shadow-[0_14px_26px_-22px_rgba(40,114,161,0.55)]"
                    : "border-white/30 bg-white/28 text-slate-700 hover:bg-white/45 hover:border-white/50 hover:text-[#2872a1]"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
                <ChevronRight className={`h-5 w-5 transition-all duration-300 ${active ? "opacity-100 rotate-0" : "opacity-0 group-hover:opacity-55 -rotate-90"}`} />
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/20 px-4 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-[0.08em] text-slate-700 transition-all duration-300 ease-out border border-white/30 bg-white/28 hover:bg-white/45 hover:border-white/50 hover:scale-105 active:scale-95"
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col bg-gradient-to-br from-white/50 via-white/40 to-white/35 backdrop-blur-xl">
        {/* Top nav */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/40 bg-white/60 px-3 backdrop-blur-2xl sm:px-7 shadow-[0_12px_24px_-14px_rgba(40,114,161,0.25)] transition-all duration-300 ease-out">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden transition-all duration-300 hover:scale-110 active:scale-95"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 transition-transform duration-300" />
            </Button>
            <div className="min-w-0 transition-all duration-300">
              <h2 className="font-display text-[29px] font-extrabold tracking-tight text-slate-900 transition-all duration-300">{headerTitle}</h2>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 truncate max-w-[55vw] sm:max-w-none transition-all duration-300">{headerSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex transition-all duration-300">
              <span className="uppercase tracking-[0.2em]">{roleLabel}</span>
            </div>
            <button className="relative grid h-9 w-9 place-items-center rounded-full border border-white/50 bg-white/30 text-[#2872a1] transition-all duration-300 ease-out backdrop-blur-md hover:bg-white/45 hover:scale-110 active:scale-95 shadow-[0_10px_20px_-12px_rgba(40,114,161,0.35)]" title="Notifications">
              <Bell className="h-4 w-4 transition-transform duration-300" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            </button>
            <div className="group relative">
              <button className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-b from-[#5f9cc0] to-[#2872a1] text-sm font-bold text-white shadow-[0_14px_28px_-14px_rgba(40,114,161,0.9)] transition-all duration-300 ease-out hover:scale-110 active:scale-95">
                {(email || "U")[0].toUpperCase()}
              </button>
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white/95 backdrop-blur-md border border-white/50 shadow-[0_24px_55px_-16px_rgba(0,0,0,0.25)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out">
                <div className="p-4 border-b border-white/30">
                  {receptionistProfile ? (
                    <>
                      <div className="mb-3 flex items-center gap-3 rounded-lg border border-white/50 bg-white/50 p-2.5">
                        <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-b from-[#5f9cc0] to-[#2872a1] text-lg font-bold text-white shadow-[0_12px_24px_-14px_rgba(40,114,161,0.8)]">
                          {(email || "U")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{receptionistProfile.name}</p>
                          <p className="text-xs text-slate-500 truncate">{email || "User"}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#2872a1]">Receptionist profile</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">Desk: <span className="font-semibold text-slate-700">{receptionistProfile.desk}</span></p>
                      <p className="mt-1 text-xs text-slate-600">Shift: <span className="font-semibold text-slate-700">{receptionistProfile.shift}</span></p>
                      <p className="mt-1 text-xs text-slate-600">Contact: <span className="font-semibold text-slate-700">{receptionistProfile.phone}</span></p>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 flex items-center gap-3 rounded-lg border border-white/50 bg-white/50 p-2.5">
                        <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-b from-[#5f9cc0] to-[#2872a1] text-lg font-bold text-white shadow-[0_12px_24px_-14px_rgba(40,114,161,0.8)]">
                          {(email || "U")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{email || "User"}</p>
                          <p className="text-xs text-slate-500 capitalize">{role || "Staff"}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={logout}
                  className="w-full px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50/50 transition-colors duration-300 flex items-center gap-2 justify-start rounded-b-xl"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-3 sm:p-6 transition-all duration-300 ease-out animate-fade-in">
          {children}
        </main>
      </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
