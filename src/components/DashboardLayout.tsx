import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, UserPlus, Users, CalendarPlus, Receipt,
  Stethoscope, Search, FileText, UserCog, BarChart3,
  LogOut, Menu, Building2, BedDouble, Bell, Pill, X, Settings,
} from "lucide-react";

interface NavItem { label: string; path: string; icon: ReactNode; badge?: boolean }

const navItems: Record<string, NavItem[]> = {
  receptionist: [
    { label: "Dashboard",   path: "/receptionist",             icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Register",    path: "/receptionist/register",    icon: <UserPlus        className="w-5 h-5" /> },
    { label: "Patients",    path: "/receptionist/patients",    icon: <Users           className="w-5 h-5" /> },
    { label: "Appointment", path: "/receptionist/appointment", icon: <CalendarPlus    className="w-5 h-5" /> },
    { label: "Billing",     path: "/receptionist/billing",     icon: <Receipt         className="w-5 h-5" /> },
    { label: "Rooms",       path: "/receptionist/rooms",       icon: <BedDouble       className="w-5 h-5" /> },
    { label: "Pharmacy",    path: "/receptionist/pharmacy",    icon: <Pill            className="w-5 h-5" /> },
  ],
  doctor: [
    { label: "Dashboard",  path: "/doctor",               icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Search",     path: "/doctor/search",        icon: <Search          className="w-5 h-5" /> },
    { label: "History",    path: "/doctor/history",       icon: <FileText        className="w-5 h-5" /> },
    { label: "Rx",         path: "/doctor/prescriptions", icon: <Stethoscope     className="w-5 h-5" /> },
  ],
  admin: [
    { label: "Dashboard", path: "/admin",          icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Users",     path: "/admin/users",    icon: <UserCog         className="w-5 h-5" /> },
    { label: "Reports",   path: "/admin/reports",  icon: <BarChart3       className="w-5 h-5" /> },
    { label: "Settings",  path: "/admin/settings", icon: <Settings        className="w-5 h-5" /> },
  ],
  pharmacy: [
    { label: "Dashboard", path: "/pharmacy/dashboard", icon: <Pill className="w-5 h-5" />, badge: true },
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
        if (pending.length > 0) alerts.push({ text: `${pending.length} pending bill${pending.length > 1 ? "s" : ""} need collection`, type: "high" });
      }
      const stockRaw = window.localStorage.getItem("medcore-pharmacy-stock");
      if (stockRaw) {
        const low = (JSON.parse(stockRaw) as { qty: number; minQty: number }[]).filter((s) => s.qty < s.minQty);
        if (low.length > 0) alerts.push({ text: `${low.length} medicine${low.length > 1 ? "s" : ""} low in stock`, type: "medium" });
      }
      const dispatchRaw = window.localStorage.getItem("medcore-pharmacy-dispatch");
      const workflowRaw = window.localStorage.getItem("medcore-pharmacy-workflow");
      if (dispatchRaw) {
        const dispatch = JSON.parse(dispatchRaw) as Record<string, { sent: boolean }>;
        const workflow = workflowRaw ? JSON.parse(workflowRaw) as Record<string, { dispensedAt?: string; rejectedAt?: string }> : {};
        const pending = Object.entries(dispatch).filter(([id, d]) => d.sent && !workflow[id]?.dispensedAt && !workflow[id]?.rejectedAt).length;
        if (pending > 0) alerts.push({ text: `${pending} prescription${pending > 1 ? "s" : ""} pending in pharmacy`, type: "medium" });
      }
    } catch { /* ignore */ }
    if (alerts.length === 0) alerts.push({ text: "All clear — no alerts", type: "info" });
    return alerts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bellOpen]);

  const pharmacyPendingCount = useMemo(() => {
    if (role !== "pharmacy") return 0;
    try {
      const dispatch = JSON.parse(window.localStorage.getItem("medcore-pharmacy-dispatch") ?? "{}") as Record<string, { sent: boolean }>;
      const workflow = JSON.parse(window.localStorage.getItem("medcore-pharmacy-workflow") ?? "{}") as Record<string, { dispensedAt?: string; rejectedAt?: string }>;
      return Object.entries(dispatch).filter(([id, d]) => d.sent && !workflow[id]?.dispensedAt && !workflow[id]?.rejectedAt).length;
    } catch { return 0; }
  }, [role]);

  const hasAlerts = notifications.some((n) => n.type !== "info");
  const initials = (email ?? "U")[0].toUpperCase();

  return (
    /* Purple outer background — full screen, no scroll */
    <div className="h-screen w-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)" }}>
      <div className="h-full w-full">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* White card — fills full height */}
        <div className="flex h-full bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* ══════════════════════════════════════════════
              SIDEBAR — inside white card, icon + label
          ══════════════════════════════════════════════ */}
          <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col w-[100px] bg-white border-r border-slate-100 transition-transform duration-300 lg:static lg:translate-x-0 lg:rounded-l-3xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

            {/* Logo */}
            <div className="flex items-center justify-center h-16 border-b border-slate-100 shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute right-2 top-4 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav — icon + label below */}
            <nav className="flex flex-col flex-1 items-center w-full py-4 gap-1 overflow-y-auto overflow-x-hidden">
              {items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex flex-col items-center justify-center w-full py-3 px-2 gap-1.5 transition-all duration-200 ${
                      active ? "" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                      active
                        ? "text-white shadow-lg"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                    style={active ? { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 8px 20px rgba(124,58,237,0.35)" } : {}}>
                      {item.icon}
                      {item.badge && pharmacyPendingCount > 0 && (
                        <span className="absolute top-2 right-3 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                          {pharmacyPendingCount}
                        </span>
                      )}
                    </span>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${active ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="shrink-0 flex flex-col items-center pb-4 border-t border-slate-100 pt-3">
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex flex-col items-center gap-1.5 w-full py-3 px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl hover:bg-slate-100 transition-all">
                  <LogOut className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-semibold">Logout</span>
              </button>
            </div>
          </aside>

          {/* ══════════════════════════════════════════════
              MAIN CONTENT
          ══════════════════════════════════════════════ */}
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

            {/* Topbar */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                  <Menu className="h-5 w-5" />
                </button>
                {/* Search */}
                <div className="relative hidden sm:block w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-3">
                {/* Bell */}
                <div className="relative">
                  <button
                    onClick={() => setBellOpen((v) => !v)}
                    className="relative grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {hasAlerts && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                  </button>
                  {bellOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Notifications</p>
                        <button onClick={() => setBellOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                        {notifications.map((n, i) => (
                          <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.type === "high" ? "bg-rose-500" : n.type === "medium" ? "bg-amber-400" : "bg-slate-300"}`} />
                            <p className={`text-xs font-medium leading-relaxed ${n.type === "high" ? "text-rose-700" : n.type === "medium" ? "text-amber-700" : "text-slate-500"}`}>{n.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* User */}
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 cursor-default">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
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
            <main className="flex-1 overflow-auto bg-white p-4 sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
