import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doctors, patients } from "@/data/mockData";
import { toast } from "sonner";

const BookAppointment = () => {
  const [form, setForm] = useState({ patientId: "", doctor: "", date: "", time: "", token: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Appointment booked successfully!");
    setForm({ patientId: "", doctor: "", date: "", time: "", token: "" });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in-up">
        <h1 className="dashboard-title">Book Appointment</h1>

        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Doctor</Label>
                <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Token Number</Label>
                <Input type="number" placeholder="Token #" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} required />
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto px-8">Book Appointment</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointment;
