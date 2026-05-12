import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Trash2, Search } from "lucide-react";
import { pushAuditLog } from "@/lib/storage";

const USERS_KEY = "medcore-admin-users";

interface StaffUser {
  id: string;
  name: string;
  role: string;
  email: string;
  addedAt: string;
}

const DEFAULT_USERS: StaffUser[] = [
  { id: "U-001", name: "Dr. Ananya Gupta", role: "Doctor", email: "ananya@medcore.com", addedAt: "2026-03-01" },
  { id: "U-002", name: "Dr. Rajesh Iyer", role: "Doctor", email: "rajesh@medcore.com", addedAt: "2026-03-01" },
  { id: "U-003", name: "Dr. Meena Nair", role: "Doctor", email: "meena@medcore.com", addedAt: "2026-03-01" },
  { id: "U-004", name: "Pooja Desai", role: "Receptionist", email: "pooja@medcore.com", addedAt: "2026-03-01" },
  { id: "U-005", name: "Ravi Kumar", role: "Receptionist", email: "ravi@medcore.com", addedAt: "2026-03-01" },
];

const loadUsers = (): StaffUser[] => {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StaffUser[]) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
};

const roleColor = (role: string) => {
  if (role === "Doctor") return "bg-blue-100 text-blue-700";
  if (role === "Receptionist") return "bg-cyan-100 text-cyan-700";
  if (role === "Pharmacy") return "bg-indigo-100 text-indigo-700";
  return "bg-slate-100 text-slate-700";
};

const UserManagement = () => {
  const [users, setUsers] = useState<StaffUser[]>(() => loadUsers());
  const [form, setForm] = useState({ name: "", email: "", role: "" });
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) { toast.error("Please select a role."); return; }

    const duplicate = users.find((u) => u.email.toLowerCase() === form.email.toLowerCase());
    if (duplicate) { toast.error("A user with this email already exists."); return; }

    const newUser: StaffUser = {
      id: `U-${Date.now().toString().slice(-5)}`,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      addedAt: new Date().toISOString().split("T")[0],
    };

    const updated = [...users, newUser];
    setUsers(updated);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    pushAuditLog("admin.user.added", `${newUser.id} | ${newUser.name} | ${newUser.role} | ${newUser.email}`);
    toast.success(`${form.role} "${form.name}" added successfully.`);
    setForm({ name: "", email: "", role: "" });
  };

  const removeUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    window.localStorage.setItem(USERS_KEY, JSON.stringify(updated));
    pushAuditLog("admin.user.removed", `${user.id} | ${user.name} | ${user.role}`);
    toast.success(`${user.name} removed from directory.`);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1200px] space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h1 className="dashboard-title">User Management</h1>
          <span className="rounded-full border border-white/50 bg-white/40 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {users.length} staff members
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Add staff form */}
          <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#2563eb]">
              <UserPlus className="w-4 h-4" /> Add Staff Member
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@medcore.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Doctor">Doctor</SelectItem>
                    <SelectItem value="Receptionist">Receptionist</SelectItem>
                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Add Staff Member</Button>
            </form>

            {/* Role summary */}
            <div className="mt-5 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Role Breakdown</p>
              {["Doctor", "Receptionist", "Pharmacy"].map((role) => {
                const count = users.filter((u) => u.role === role).length;
                return (
                  <div key={role} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleColor(role)}`}>{role}</span>
                    <span className="text-xs font-bold text-slate-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff directory */}
          <div className="lg:col-span-2 rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold text-slate-800">Staff Directory</h3>
              <div className="relative w-full sm:w-60">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, role..."
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 focus:border-[#2563eb] focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Added</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No staff members match your search.</td>
                    </tr>
                  )}
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleColor(u.role)}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{u.addedAt}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeUser(u.id)}
                          className="rounded-full border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
