import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { patients } from "@/data/mockData";

const RegisterPatient = () => {
  const [form, setForm] = useState({ name: "", phone: "", age: "", gender: "", symptoms: "", emergencyContact: "" });

  const normalizedPhone = form.phone.replace(/\D/g, "");
  const normalizedName = form.name.trim().toLowerCase();

  const duplicateMatches = useMemo(() => {
    if (!normalizedPhone && !normalizedName) return [];

    return patients.filter((patient) => {
      const samePhone = normalizedPhone.length >= 10 && patient.phone.replace(/\D/g, "") === normalizedPhone;
      const sameName = normalizedName.length >= 3 && patient.name.trim().toLowerCase() === normalizedName;
      return samePhone || sameName;
    });
  }, [normalizedPhone, normalizedName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (normalizedPhone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    const age = Number(form.age);
    if (!Number.isFinite(age) || age < 0 || age > 120) {
      toast.error("Age must be between 0 and 120.");
      return;
    }

    const emergencyDigits = form.emergencyContact.replace(/\D/g, "");
    if (form.emergencyContact && emergencyDigits.length !== 10) {
      toast.error("Emergency contact must be a valid 10-digit number.");
      return;
    }

    if (duplicateMatches.length > 0) {
      toast.error("Possible duplicate patient found. Please verify before registering.");
      return;
    }

    toast.success(`Patient ${form.name} registered successfully!`);
    setForm({ name: "", phone: "", age: "", gender: "", symptoms: "", emergencyContact: "" });
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
                <Label>Emergency Contact</Label>
                <Input placeholder="Optional 10-digit number" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
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

            {duplicateMatches.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Possible duplicate patient records</p>
                <div className="mt-2 space-y-1">
                  {duplicateMatches.map((patient) => (
                    <p key={patient.id} className="text-xs text-amber-700">
                      {patient.id} - {patient.name} ({patient.phone})
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full sm:w-auto px-8">Register Patient</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterPatient;
