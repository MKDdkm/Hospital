import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

const existingUsers = [
  { name: "Dr. Ananya Gupta", role: "Doctor", email: "ananya@medcore.com" },
  { name: "Dr. Rajesh Iyer", role: "Doctor", email: "rajesh@medcore.com" },
  { name: "Dr. Meena Nair", role: "Doctor", email: "meena@medcore.com" },
  { name: "Pooja Desai", role: "Receptionist", email: "pooja@medcore.com" },
  { name: "Ravi Kumar", role: "Receptionist", email: "ravi@medcore.com" },
];

const UserManagement = () => {
  const [form, setForm] = useState({ name: "", email: "", role: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`${form.role} "${form.name}" added successfully!`);
    setForm({ name: "", email: "", role: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        <h1 className="dashboard-title">User Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5" /> Add Staff</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@medcore.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Doctor">Doctor</SelectItem>
                    <SelectItem value="Receptionist">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Add Staff Member</Button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-card rounded-xl border">
            <div className="px-4 sm:px-6 py-4 border-b"><h3 className="font-semibold">Staff Directory</h3></div>
            <div className="responsive-table-wrap">
              <table className="responsive-table responsive-table--compact">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {existingUsers.map((u, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 sm:px-6 py-3 font-medium">{u.name}</td>
                      <td className="px-4 sm:px-6 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.role === "Doctor" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                        }`}>{u.role}</span>
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
