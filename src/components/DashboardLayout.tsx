import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, UserPlus, Users, CalendarPlus, Receipt,
  Stethoscope, Search, FileText, PlusCircle,
  UserCog, BarChart3, LogOut, Menu, ChevronRight, Building2
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
};

const roleLabels: Record<string, string> = {
  receptionist: "Receptionist",
  doctor: "Doctor",
  admin: "Administrator",
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { role, email, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = navItems[role || "receptionist"];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-[linear-gradient(190deg,hsl(216_40%_16%),hsl(216_34%_11%))] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/20 bg-white/10">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-sidebar-foreground">MedCore HMS</p>
            <p className="text-xs text-sidebar-foreground/55">Clinical Operations Suite</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-white/15 text-white shadow-[0_10px_30px_-15px_rgba(0,0,0,0.85)]"
                    : "text-sidebar-foreground/75 hover:bg-white/8 hover:text-sidebar-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
                <ChevronRight className={`h-4 w-4 transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-70"}`} />
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-sidebar-foreground/70 hover:bg-white/8 hover:text-sidebar-foreground w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top nav */}
        <header className="h-16 border-b border-border/70 bg-card/80 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h2 className="font-display text-sm font-semibold text-foreground">{roleLabels[role || "receptionist"]} Portal</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[55vw] sm:max-w-none">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
              Secure Session
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-[0_6px_20px_-10px_hsl(var(--primary))]">
              {(email || "U")[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
