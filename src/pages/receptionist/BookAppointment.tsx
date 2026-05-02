import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appointments, doctors, type Appointment } from "@/data/mockData";
import { getPatients, getNextToken, peekNextToken, pushAuditLog } from "@/lib/storage";
import { toast } from "sonner";
import {
  CalendarCheck, Clock3, AlertTriangle, CheckCircle2,
  Users, Zap, RefreshCcw, CalendarPlus, Search,
} from "lucide-react";

const APPOINTMENTS_STORAGE_KEY = "medcore-receptionist-appointments";
const SLOT_CAPACITY_PER_DOCTOR = 8;

type LocalAppointmentStatus = Appointment["status"] | "Checked In" | "No Show";
type AppointmentType = "OPD" | "Emergency" | "Follow-up" | "Consultation";

interface LocalAppointment extends Omit<Appointment, "status"> {
  status: LocalAppointmentStatus;
  appointmentType?: AppointmentType;
  visitNote?: string;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

const toDisplayTime = (timeValue: string) => {
  if (!timeValue) return timeValue;
  const [h, m] = timeValue.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return timeValue;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
};

const getStoredAppointments = (): LocalAppointment[] => {
  if (typeof window === "undefined") return appointments.map((a) => ({ ...a }));
  try {
    const raw = window.localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!raw) return appointments.map((a) => ({ ...a }));
    const parsed = JSON.parse(raw) as LocalAppointment[];
    return Array.isArray(parsed) ? parsed : appointments.map((a) => ({ ...a }));
  } catch {
    return appointments.map((a) => ({ ...a }));
  }
};

const typeColors: Record<AppointmentType, string> = {
  OPD: "bg-blue-100 text-blue-700 border-blue-200",
  Emergency: "bg-rose-100 text-rose-700 border-rose-200",
  "Follow-up": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Consultation: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const BookAppointment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    patientId: "",
    doctor: "",
    date: "",
    time: "",
    appointmentType: "OPD" as AppointmentType,
    visitNote: "",
    reminderEnabled: true,
    reminderChannel: "SMS",
  });

  const [bookedAppointments, setBookedAppointments] = useState<LocalAppointment[]>(() =>
    getStoredAppointments(),
  );
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const allPatients = useMemo(() => getPatients(), []);
  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return allPatients.slice(0, 8);
    return allPatients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.phone.includes(q)
    ).slice(0, 8);
  }, [allPatients, patientSearch]);

  // Pre-fill from URL params (from patient profile / search)
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

  const slotAppointments = useMemo(
    () => bookedAppointments.filter((a) => a.date === form.date && a.doctor === form.doctor),
    [bookedAppointments, form.date, form.doctor],
  );

  // Slot grid: for each time slot, how many bookings exist
  const slotUsage = useMemo(() => {
    return TIME_SLOTS.reduce<Record<string, number>>((acc, slot) => {
      const display = toDisplayTime(slot);
      acc[slot] = slotAppointments.filter((a) => a.time === display).length;
      return acc;
    }, {});
  }, [slotAppointments]);

  const suggestedToken = useMemo(() => {
    if (!form.date || !form.doctor) return "";
    return String(peekNextToken());
  }, [form.date, form.doctor]);

  const slotFull = form.date && form.doctor
    ? slotAppointments.filter((a) => a.status !== "Cancelled" && a.status !== "No Show").length >= SLOT_CAPACITY_PER_DOCTOR
    : false;

  const samePatientConflict = useMemo(() => {
    if (!form.date || !form.patientId) return null;
    return bookedAppointments.find(
      (a) =>
        a.patientId === form.patientId &&
        a.date === form.date &&
        a.status !== "Cancelled" &&
        a.status !== "No Show",
    ) ?? null;
  }, [bookedAppointments, form.date, form.patientId]);

  const selectedPatient = useMemo(
    () => getPatients().find((p) => p.id === form.patientId),
    [form.patientId],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (slotFull) {
      toast.error(`Doctor slot is full (${SLOT_CAPACITY_PER_DOCTOR} appointments). Choose another date or doctor.`);
      return;
    }
    if (samePatientConflict) {
      toast.error("This patient already has an active appointment on the selected date.");
      return;
    }
    if (!selectedPatient) {
      toast.error("Please select a valid patient.");
      return;
    }

    const token = getNextToken();
    const appointmentId = `A-${Date.now().toString().slice(-6)}`;
    const displayTime = toDisplayTime(form.time) || form.time;

    const newAppointment: LocalAppointment = {
      id: appointmentId,
      patientId: form.patientId,
      patientName: selectedPatient.name,
      doctor: form.doctor,
      date: form.date,
      time: displayTime,
      token,
      status: "Scheduled",
      appointmentType: form.appointmentType,
      visitNote: form.visitNote,
    };

    const updated = [...bookedAppointments, newAppointment].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.doctor !== b.doctor) return a.doctor.localeCompare(b.doctor);
      return a.token - b.token;
    });

    window.localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(updated));
    setBookedAppointments(updated);

    pushAuditLog(
      "appointment.booked",
      `${appointmentId} | ${selectedPatient.name} | ${form.doctor} | ${form.date} ${displayTime} | Token ${token} | ${form.appointmentType} | Reminder: ${form.reminderEnabled ? form.reminderChannel : "Off"}`,
    );

    // Print appointment slip
    const printSlip = () => {
      const win = window.open("", "_blank", "width=480,height=360");
      if (!win) return;
      win.document.write(`<html><head><title>Appointment Slip</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a;}
      .title{font-size:18px;font-weight:700;color:#2872a1;margin-bottom:4px;}
      .row{display:flex;gap:8px;margin-bottom:6px;font-size:13px;}
      .label{color:#64748b;min-width:120px;}.value{font-weight:600;}
      .footer{margin-top:14px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;}
      .token{font-size:32px;font-weight:800;color:#2872a1;text-align:center;margin:12px 0;}
      </style></head><body>
      <div class="title">MedCore HMS — Appointment Slip</div>
      <div class="token">Token #${token}</div>
      <div class="row"><span class="label">Patient</span><span class="value">${selectedPatient.name} (${selectedPatient.id})</span></div>
      <div class="row"><span class="label">Doctor</span><span class="value">${form.doctor}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${form.date}</span></div>
      <div class="row"><span class="label">Time</span><span class="value">${displayTime}</span></div>
      <div class="row"><span class="label">Type</span><span class="value">${form.appointmentType}</span></div>
      ${form.visitNote ? `<div class="row"><span class="label">Note</span><span class="value">${form.visitNote}</span></div>` : ""}
      <div class="footer">Please arrive 10 minutes before your appointment. MedCore HMS &copy; 2026</div>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
      win.document.close();
    };
    printSlip();

    toast.success(`Appointment booked! Token #${token} for ${selectedPatient.name}`);
    setForm({
      patientId: "", doctor: "", date: "", time: "",
      appointmentType: "OPD", visitNote: "",
      reminderEnabled: true, reminderChannel: "SMS",
    });
    setPatientSearch("");
  };

  // Doctor load summary for selected date
  const doctorLoad = useMemo(() => {
    if (!form.date) return [];
    return doctors.map((doc) => {
      const count = bookedAppointments.filter(
        (a) => a.doctor === doc && a.date === form.date && a.status !== "Cancelled" && a.status !== "No Show",
      ).length;
      return { doc, count, pct: Math.min(100, Math.round((count / SLOT_CAPACITY_PER_DOCTOR) * 100)) };
    });
  }, [bookedAppointments, form.date]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1100px] space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h1 className="dashboard-title text-[#2872a1]">Book Appointment</h1>
          <button
            type="button"
            onClick={() => navigate("/receptionist")}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/40 px-3 py-1.5 text-xs font-semibold text-[#2872a1] hover:bg-white/60 transition-all"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Back to Queue
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
          {/* ── Booking form ── */}
          <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-5 shadow-[0_18px_45px_-20px_rgba(40,114,161,0.25)]">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[#2872a1]">
              <CalendarPlus className="inline h-3.5 w-3.5 mr-1" /> Appointment Details
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Appointment type */}
              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <div className="flex flex-wrap gap-2">
                  {(["OPD", "Emergency", "Follow-up", "Consultation"] as AppointmentType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, appointmentType: type })}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                        form.appointmentType === type
                          ? typeColors[type]
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {type === "Emergency" && <Zap className="inline h-3 w-3 mr-0.5" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Patient — searchable */}
                <div className="space-y-1.5">
                  <Label>Patient <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search patient by name, ID, or phone..."
                      value={patientSearch}
                      onChange={(e) => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className="pl-9"
                    />
                    {showPatientDropdown && filteredPatients.length > 0 && (
                      <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                        {filteredPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, patientId: p.id });
                              setPatientSearch(`${p.name} (${p.id})`);
                              setShowPatientDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition-colors border-b last:border-0"
                          >
                            <p className="font-semibold text-slate-800">{p.name} <span className="text-xs text-slate-500">({p.id})</span></p>
                            <p className="text-xs text-slate-500">{p.phone} · {p.age}y · {p.symptoms}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPatient && (
                    <p className="text-xs text-slate-500">
                      {selectedPatient.age}y · {selectedPatient.gender} · {selectedPatient.symptoms}
                    </p>
                  )}
                </div>

                {/* Doctor */}
                <div className="space-y-1.5">
                  <Label>Doctor <span className="text-rose-500">*</span></Label>
                  <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                    <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label>Date <span className="text-rose-500">*</span></Label>
                  <Input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                {/* Time */}
                <div className="space-y-1.5">
                  <Label>Time <span className="text-rose-500">*</span></Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Time slot grid */}
              {form.doctor && form.date && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">
                    Quick-select slot — {slotAppointments.filter((a) => a.status !== "Cancelled").length}/{SLOT_CAPACITY_PER_DOCTOR} booked
                  </p>
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-7">
                    {TIME_SLOTS.map((slot) => {
                      const used = slotUsage[slot] ?? 0;
                      const isFull = used >= 2;
                      const isSelected = form.time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isFull}
                          onClick={() => setForm({ ...form, time: slot })}
                          className={`rounded-lg border px-1.5 py-2 text-[11px] font-semibold transition-all ${
                            isSelected
                              ? "border-[#2872a1] bg-[#2872a1] text-white shadow-md"
                              : isFull
                                ? "border-rose-200 bg-rose-50 text-rose-400 cursor-not-allowed"
                                : used === 1
                                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-[#2872a1] hover:bg-blue-50"
                          }`}
                        >
                          {toDisplayTime(slot)}
                          {used > 0 && !isFull && <span className="block text-[9px] opacity-70">{used} booked</span>}
                          {isFull && <span className="block text-[9px]">Full</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 text-[10px] font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-white border border-slate-300" />Available</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-200" />1 booked</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-300" />Full</span>
                  </div>
                </div>
              )}

              {/* Visit note + reminder */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Visit Note</Label>
                  <Input
                    placeholder="Reason, follow-up, special instruction"
                    value={form.visitNote}
                    onChange={(e) => setForm({ ...form, visitNote: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reminder Channel</Label>
                  <Select value={form.reminderChannel} onValueChange={(v) => setForm({ ...form, reminderChannel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.reminderEnabled}
                  onChange={(e) => setForm({ ...form, reminderEnabled: e.target.checked })}
                  className="rounded"
                />
                Send appointment reminder before visit
              </label>

              {/* Alerts */}
              {form.appointmentType === "Emergency" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 inline-flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" /> Emergency appointment — patient will be prioritised in queue.
                </div>
              )}
              {slotFull && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 inline-flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" /> Slot capacity reached. Choose another doctor or date.
                </div>
              )}
              {samePatientConflict && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 inline-flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" /> Patient already has an active appointment on this date with {samePatientConflict.doctor} at {samePatientConflict.time}.
                </div>
              )}
              {suggestedToken && (
                <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Token #{suggestedToken} will be assigned automatically.
                </p>
              )}

              <Button
                type="submit"
                disabled={slotFull || Boolean(samePatientConflict)}
                className="w-full sm:w-auto px-8 bg-gradient-to-r from-[#2872a1] to-[#1a4d73] inline-flex items-center gap-2"
              >
                <CalendarCheck className="h-4 w-4" /> Confirm Booking
              </Button>
            </form>
          </div>

          {/* ── Right panel: doctor load + today's bookings ── */}
          <div className="space-y-4">
            {/* Doctor availability for selected date */}
            {form.date && (
              <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 shadow-[0_18px_45px_-20px_rgba(40,114,161,0.2)]">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#2872a1]">
                  <Users className="inline h-3.5 w-3.5 mr-1" /> Doctor Load — {form.date}
                </p>
                <div className="space-y-2.5">
                  {doctorLoad.map(({ doc, count, pct }) => (
                    <div key={doc}>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, doctor: doc })}
                          className={`hover:text-[#2872a1] transition-colors text-left ${form.doctor === doc ? "text-[#2872a1]" : ""}`}
                        >
                          {doc}
                        </button>
                        <span className={count >= SLOT_CAPACITY_PER_DOCTOR ? "text-rose-600" : count >= 5 ? "text-amber-600" : "text-emerald-600"}>
                          {count}/{SLOT_CAPACITY_PER_DOCTOR}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full transition-all ${pct >= 100 ? "bg-rose-400" : pct >= 62 ? "bg-amber-400" : "bg-emerald-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's bookings for selected doctor */}
            {form.doctor && form.date && slotAppointments.length > 0 && (
              <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 shadow-[0_18px_45px_-20px_rgba(40,114,161,0.2)]">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#2872a1]">
                  <Clock3 className="inline h-3.5 w-3.5 mr-1" /> Existing Bookings
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {slotAppointments
                    .sort((a, b) => a.token - b.token)
                    .map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">#{a.token} {a.patientName}</p>
                          <p className="text-[11px] text-slate-500">{a.time}</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          a.status === "Completed" ? "bg-emerald-100 text-emerald-700"
                          : a.status === "Checked In" ? "bg-indigo-100 text-indigo-700"
                          : a.status === "Cancelled" ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Quick register link */}
            <div className="rounded-2xl border border-dashed border-[#2872a1]/30 bg-[#2872a1]/5 p-4 text-center">
              <p className="text-xs text-slate-600">Patient not in the list?</p>
              <button
                type="button"
                onClick={() => navigate("/receptionist/register")}
                className="mt-2 text-xs font-semibold text-[#2872a1] hover:underline"
              >
                Register new patient →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointment;
