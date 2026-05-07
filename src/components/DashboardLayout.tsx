import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, UserPlus, Users, CalendarPlus, Receipt,
  Stethoscope, Search, FileText,
  UserCog, BarChart3, LogOut, Menu, Building2, BedDouble, Bell, Pill, X,
} from "lucide-react";
import { getPatients } from "@/lib/storage";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  badge?: boolean;
}

const navItems: Record<string, NavItem[]> = {
  receptionist: [
    { label: "Dashboard",        path: "/receptionist",              icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { label: "Register Patient", path: "/receptionist/register",     icon: <UserPlus        className="w-[18px] h-[18px]" /> },
    { label: "Patient List",     path: "/receptionist/patients",     icon: <Users           className="w-[18px] h-[18px]" /> },
    { label: "Book Appointment", path: "/receptionist/appointment",  icon: <CalendarPlus    className="w-[18px] h-[18px]" /> },
    { label: "Billing",          path: "/receptionist/billing",      icon: <Receipt         className="w-[18px] h-[18px]" /> },
    { label: "Room Occupancy",   path: "/receptionist/rooms",        icon: <BedDouble       className="w-[18px] h-[18px]" /> },
    { label: "Pharmacy",         path: "/receptionist/pharmacy",     icon: <Pill            className="w-[18px] h-[18px]" /> },
  ],
  doctor: [
    { label: "Dashboard",       path: "/doctor",               icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { label: "Search Patient",  path: "/doctor/search",        icon: <Search          className="w-[18px] h-[18px]" /> },
    { label: "Patient History", path: "/doctor/history",       icon: <FileText        className="w-[18px] h-[18px]" /> },
    { label: "My Prescriptions",path: "/doctor/prescriptions", icon: <Stethoscope     className="w-[18px] h-[18px]" /> },
  ],
  admin: [
    { label: "Dashboard",       path: "/admin",          icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { label: "User Management", path: "/admin/users",    icon: <UserCog         className="w-[18px] h-[18px]" /> },
    { label: "Reports",         path: "/admin/reports",  icon: <BarChart3       className="w-[18px] h-[18px]" /> },
    { label: "Clinic Settings", path: "/admin/settings", icon: <Building2       className="w-[18px] h-[18px]" /> },
  ],
  pharmacy: [
    { label: "Dashboard", path: "/pharmacy/dashboard", icon: <Pill className="w-[18px] h-[18px]" />, badge: true },
  ],
};

const roleLabels: Record<string, string> = {
  receptionist: "Receptionist",
  doctor: "Doctor",
  admin: "Administrator",
  pharmacy: "Pharmacy",
};

const receptionistDirectory: Record<string, string> = {
  "frontdesk@medcore.com": "Neha Singh",
  "reception@medcore.com": "Pooja Desai",
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { role, email, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const items = navItems[role ?? "receptionist"];
  const roleLabel = roleLabels[role ?? "receptionist"];

  const displayName = useMemo(() => {
    if (role === "receptionist") {
      const name = receptionistDirectory[(email ?? "").toLowerCase()];
      if (name) return name;
    }
    return email ? email.split("@")[0].replace(/[._-]/g, " ") : "User";
  }, [role, email]);

  const notifications = useMemo(() => {
    const alerts: { text: string; type: "high" | "medium" | "info" }[] = [];
    try {
      const liveBillsRaw = window.localStorage.getItem("medcore-live-bills");
      if (liveBillsRaw) {
        const pending = (JSON.parse(liveBillsRaw) as { status: string }[]).filter((b) => b.status === "Pending");
        if (pending.length > 0)
          alerts.push({ text: `${pending.length} pending bill${pending.length > 1 ? "s" : ""} need collection`, type: "high" });
      }
      const stockRaw = window.localStorage.getItem("medcore-pharmacy-stock");
      if (stockRaw) {
        const low = (JSON.parse(stockRaw) as { qty: number; minQty: number }[]).filter((s) => s.qty < s.minQty);
        if (low.length > 0)
          alerts.push({ text: `${low.length} medicine${low.length > 1 ? "s" : ""} low in stock`, type: "medium" });
      }
      const dispatchRaw = window.localStorage.getItem("medcore-pharmacy-dispatch");
      const workflowRaw = window.localStorage.getItem("medcore-pharmacy-workflow");
      if (dispatchRaw) {
        const dispatch = JSON.parse(dispatchRaw) as Record<string, { sent: boolean }>;
        const workflow = workflowRaw
          ? (JSON.parse(workflowRaw) as Record<string, { dispensedAt?: string; rejectedAt?: string }>)
          : {};
        const pending = Object.entries(dispatch).filter(
          ([id, d]) => d.sent && !workflow[id]?.dispensedAt && !workflow[id]?.rejectedAt,
        ).length;
        if (pending > 0)
          alerts.push({ text: `${pending} prescription${pending > 1 ? "s" : ""} pending in pharmacy`, type: "medium" });
      }
    } catch { /* ignore */ }
    if (alerts.length === 0) alerts.push({ text: "All clear — no alerts", type: "info" });
    return alerts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bellOpen]);

  const pharmacyPendingCount = useMemo(() => {
    if (role !== "pharmacy") return 0;
    try {
      const dispatch = JSON.parse(
        window.localStorage.getItem("medcore-pharmacy-dispatch") ?? "{}",
      ) as Record<string, { sent: boolean }>;
      const workflow = JSON.parse(
        window.localStorage.getItem("medcore-pharmacy-workflow") ?? "{}",
      ) as Record<string, { dispensedAt?: string; rejectedAt?: string }>;
      return Object.entries(dispatch).filter(
        ([id, d]) => d.sent && !workflow[id]?.dispensedAt && !workflow[id]?.rejectedAt,
      ).length;
    } catch { return 0; }
  }, [role]);

  const hasAlerts = notifications.some((n) => n.type !== "info");
  const currentPage = items.find((i) => i.path === location.pathname)?.label ?? "Dashboard";
  const initials = (email ?? "U")[0].toUpperCase();

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return getPatients().filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.phone.includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════
          SIDEBAR — deep navy bg-[#0f172a]
      ══════════════════════════════════════════════════════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 min-w-[16rem] flex-col bg-[#0f172a] transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/30">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p
                className="text-[15px] font-extrabold text-white tracking-tight leading-none"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Clinik
              </p>
              <p className="text-[9px] text-white/35 uppercase tracking-[0.18em] mt-0.5">Hospital Suite</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/30 hover:text-white/70 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role label */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            {roleLabel} Workspace
          </p>
        </div>

        {/* Nav items — fill full height, no gap at bottom */}
        <nav className="flex flex-col flex-1 overflow-hidden px-3">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex flex-1 items-center justify-between gap-3 px-3 text-[13px] font-semibold transition-all duration-200 rounded-xl my-0.5 ${
                  active
                    ? "bg-blue-500 text-white shadow-[0_4px_14px_rgba(59,130,246,0.35)]"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`transition-colors ${active ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>
                    {item.icon}
                  </span>
                  <span className="tracking-[0.01em]">{item.label}</span>
                </span>
                {item.badge && pharmacyPendingCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none shrink-0">
                    {pharmacyPendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — user + sign out */}
        <div className="shrink-0 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white capitalize">{displayName}</p>
              <p className="truncate text-[11px] text-white/30">{email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-[13px] font-medium text-slate-500 hover:bg-white/[0.05] hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1
                className="text-[15px] font-bold text-slate-900 leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                {currentPage}
              </h1>
              <p className="text-[11px] text-slate-400 capitalize hidden sm:block">
                {roleLabel} · Clinik HMS
              </p>
            </div>
          </div>

          {/* Global search */}
          <div className="hidden md:flex flex-1 max-w-xs mx-6 relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={() => {
                      const path = role === "doctor" ? `/doctor/history` : `/receptionist/patient/${p.id}`;
                      navigate(path);
                      setSearchQuery("");
                      setSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 shrink-0">
                      {p.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.id} · {p.age}y · {p.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {hasAlerts && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Notifications</p>
                    <button
                      onClick={() => setBellOpen(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Close notifications"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                    {notifications.map((n, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.type === "high"
                              ? "bg-rose-500"
                              : n.type === "medium"
                              ? "bg-amber-400"
                              : "bg-slate-300"
                          }`}
                        />
                        <p
                          className={`text-xs font-medium leading-relaxed ${
                            n.type === "high"
                              ? "text-rose-700"
                              : n.type === "medium"
                              ? "text-amber-700"
                              : "text-slate-500"
                          }`}
                        >
                          {n.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 mx-1" />

            {/* User chip */}
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 cursor-default">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 capitalize leading-none">{displayName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
