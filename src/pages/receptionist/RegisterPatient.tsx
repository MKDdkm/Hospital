import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const RegisterPatient = () => {
  const [form, setForm] = useState({ name: "", phone: "", age: "", gender: "", symptoms: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Patient ${form.name} registered successfully!`);
    setForm({ name: "", phone: "", age: "", gender: "", symptoms: "" });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in-up">
        <h1 className="dashboard-title">Register New Patient</h1>

        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Patient name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="10-digit number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Symptoms</Label>
              <Input placeholder="Describe symptoms" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full sm:w-auto px-8">Register Patient</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterPatient;
