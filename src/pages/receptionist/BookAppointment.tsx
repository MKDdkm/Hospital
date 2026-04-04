import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appointments, doctors, patients, type Appointment } from "@/data/mockData";
import { toast } from "sonner";

const APPOINTMENTS_STORAGE_KEY = "medcore-receptionist-appointments";
const AUDIT_LOGS_STORAGE_KEY = "medcore-receptionist-audit-logs";
const SLOT_CAPACITY_PER_DOCTOR = 6;

type LocalAppointmentStatus = Appointment["status"] | "Checked In" | "No Show";

interface LocalAppointment extends Omit<Appointment, "status"> {
  status: LocalAppointmentStatus;
}

const parseTimeToMinutes = (timeValue: string) => {
  if (!timeValue) return -1;
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1;
  return (hours * 60) + minutes;
};

const toDisplayTime = (timeValue: string) => {
  const minutes = parseTimeToMinutes(timeValue);
  if (minutes < 0) return timeValue;

  const rawHours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = rawHours >= 12 ? "PM" : "AM";
  const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
};

const getStoredAppointments = (): LocalAppointment[] => {
  if (typeof window === "undefined") return appointments.map((appointment) => ({ ...appointment }));

  try {
    const raw = window.localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!raw) return appointments.map((appointment) => ({ ...appointment }));
    const parsed = JSON.parse(raw) as LocalAppointment[];
    if (!Array.isArray(parsed)) return appointments.map((appointment) => ({ ...appointment }));
    return parsed;
  } catch {
    return appointments.map((appointment) => ({ ...appointment }));
  }
};

const BookAppointment = () => {
  const location = useLocation();
  const [form, setForm] = useState({ patientId: "", doctor: "", date: "", time: "", token: "", visitNote: "", reminderEnabled: true, reminderChannel: "SMS" });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const patientId = params.get("patientId");
    const doctor = params.get("doctor");
    const date = params.get("date");
    const time = params.get("time");

    if (patientId || doctor || date || time) {
      setForm((prev) => ({
        ...prev,
        patientId: patientId ?? prev.patientId,
        doctor: doctor ?? prev.doctor,
        date: date ?? prev.date,
        time: time ?? prev.time,
      }));
    }
  }, [location.search]);

  const bookedAppointments = useMemo(() => getStoredAppointments(), [form.date, form.doctor, form.time]);

  const slotAppointments = useMemo(
    () => bookedAppointments.filter((appointment) => appointment.date === form.date && appointment.doctor === form.doctor),
    [bookedAppointments, form.date, form.doctor],
  );

  const suggestedToken = useMemo(() => {
    if (!form.date || !form.doctor) return "";
    const nextToken = slotAppointments.reduce((maxToken, appointment) => Math.max(maxToken, appointment.token), 0) + 1;
    return String(nextToken);
  }, [slotAppointments, form.date, form.doctor]);

  const slotFull = form.date && form.doctor ? slotAppointments.length >= SLOT_CAPACITY_PER_DOCTOR : false;

  const samePatientConflict = useMemo(() => {
    if (!form.date || !form.patientId) return null;
    return bookedAppointments.find((appointment) => (
      appointment.patientId === form.patientId
      && appointment.date === form.date
      && appointment.status !== "Cancelled"
      && appointment.status !== "No Show"
    )) ?? null;
  }, [bookedAppointments, form.date, form.patientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (slotFull) {
      toast.error(`Doctor slot is full (${SLOT_CAPACITY_PER_DOCTOR} appointments). Choose another time/doctor.`);
      return;
    }

    if (samePatientConflict) {
      toast.error("This patient already has an active appointment on the selected date.");
      return;
    }

    const patient = patients.find((entry) => entry.id === form.patientId);
    if (!patient) {
      toast.error("Please select a valid patient.");
      return;
    }

    const token = Math.max(1, Number(form.token || suggestedToken || "1"));
    const appointmentId = `A-${Date.now().toString().slice(-6)}`;
    const newAppointment: LocalAppointment = {
      id: appointmentId,
      patientId: form.patientId,
      patientName: patient.name,
      doctor: form.doctor,
      date: form.date,
      time: toDisplayTime(form.time),
      token,
      status: "Scheduled",
    };

    const updatedAppointments = [...bookedAppointments, newAppointment].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.doctor !== b.doctor) return a.doctor.localeCompare(b.doctor);
      return a.token - b.token;
    });

    window.localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updatedAppointments));

    const previousAudit = JSON.parse(window.localStorage.getItem(AUDIT_LOGS_STORAGE_KEY) ?? "[]") as Array<Record<string, string>>;
    previousAudit.unshift({
      id: `AL-${Date.now()}`,
      type: "appointment.booked",
      at: new Date().toISOString(),
      details: `${appointmentId} | ${patient.name} | ${form.doctor} | ${form.date} ${toDisplayTime(form.time)} | Token ${token} | Reminder: ${form.reminderEnabled ? form.reminderChannel : "Off"}`,
    });
    window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(previousAudit.slice(0, 80)));

    toast.success("Appointment booked successfully!");
    setForm({ patientId: "", doctor: "", date: "", time: "", token: "", visitNote: "", reminderEnabled: true, reminderChannel: "SMS" });
  };

  const timeMinutes = parseTimeToMinutes(form.time);
  const isPeakHour = timeMinutes >= 600 && timeMinutes <= 840;

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
                <Input
                  type="number"
                  placeholder={suggestedToken ? `Suggested: ${suggestedToken}` : "Token #"}
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                  required
                />
                {suggestedToken && <p className="text-xs text-slate-500">Next available token for this doctor/date: {suggestedToken}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visit Note</Label>
                <Input
                  placeholder="Reason, follow-up note, or special instruction"
                  value={form.visitNote}
                  onChange={(e) => setForm({ ...form, visitNote: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reminder Channel</Label>
                <Select value={form.reminderChannel} onValueChange={(value) => setForm({ ...form, reminderChannel: value })}>
                  <SelectTrigger><SelectValue placeholder="Select reminder channel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.reminderEnabled}
                onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })}
              />
              Send appointment reminder before visit
            </label>

            {isPeakHour && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                Peak hour slot selected. Patient wait time may be higher than usual.
              </div>
            )}

            {slotFull && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                Selected slot capacity reached ({SLOT_CAPACITY_PER_DOCTOR}). Pick another doctor or date.
              </div>
            )}

            {samePatientConflict && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                Patient already has an active appointment on this date with {samePatientConflict.doctor} at {samePatientConflict.time}.
              </div>
            )}

            <Button type="submit" className="w-full sm:w-auto px-8">Book Appointment</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointment;
