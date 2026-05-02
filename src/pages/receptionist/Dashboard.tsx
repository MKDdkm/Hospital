import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { appointments, bills, type Appointment } from "@/data/mockData";
import { getPatients, generatePatientId, savePatient, pushAuditLog as storagePushAuditLog, createBillDraftFromAppointment } from "@/lib/storage";
import { getClinicSettings } from "@/pages/admin/ClinicSettings";
import { Users, CalendarCheck, Receipt, Activity, Search, Filter, ClipboardList, UserPlus, CalendarPlus, IndianRupee, Clock3, UserCheck2, Gauge, RefreshCcw, Hospital, BellRing, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";

type LocalAppointmentStatus = Appointment["status"] | "Checked In" | "No Show";
type PatientPriority = "Normal" | "Emergency" | "Senior" | "Follow-up";

interface LocalAppointment extends Omit<Appointment, "status"> {
  status: LocalAppointmentStatus;
  priority?: PatientPriority;
}

const statusOptions: LocalAppointmentStatus[] = ["Scheduled", "Checked In", "Completed", "Cancelled", "No Show"];

const statusBadgeClass: Record<LocalAppointmentStatus, string> = {
  Scheduled: "bg-cyan-100 text-cyan-700",
  "Checked In": "bg-indigo-100 text-indigo-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
  "No Show": "bg-amber-100 text-amber-700",
};

const APPOINTMENTS_STORAGE_KEY = "medcore-receptionist-appointments";
const DASHBOARD_PREFS_STORAGE_KEY = "medcore-receptionist-dashboard-prefs";
const SHIFT_NOTES_STORAGE_KEY = "medcore-receptionist-shift-notes";
const AUDIT_LOGS_STORAGE_KEY = "medcore-receptionist-audit-logs";
const ROOM_OCCUPANCY_STORAGE_KEY = "medcore-room-occupancy";

interface AuditLog {
  id: string;
  type: string;
  at: string;
  details: string;
}

interface RoomOccupancyRow {
  roomType: string;
  totalBeds: number;
  occupiedBeds: number;
  reservedBeds: number;
}

const getInitialDashboardDate = () => {
  const today = new Date().toISOString().split("T")[0];
  // Check both mock and localStorage appointments
  let allDates = appointments.map((a) => a.date);
  try {
    const raw = window.localStorage.getItem("medcore-receptionist-appointments");
    if (raw) {
      const parsed = JSON.parse(raw) as { date: string }[];
      if (Array.isArray(parsed)) allDates = [...allDates, ...parsed.map((a) => a.date)];
    }
  } catch { /* ignore */ }
  if (allDates.includes(today)) return today;
  const sorted = [...new Set(allDates)].sort((a, b) => b.localeCompare(a));
  return sorted[0] ?? today;
};

const getPriorityClass = (priority: PatientPriority) => {
  if (priority === "Emergency") return "bg-rose-100 text-rose-700";
  if (priority === "Senior") return "bg-amber-100 text-amber-700";
  if (priority === "Follow-up") return "bg-indigo-100 text-indigo-700";
  return "bg-slate-100 text-slate-700";
};

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [allPatients, setAllPatients] = useState(() => getPatients());
  const [clockTime, setClockTime] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [localAppointments, setLocalAppointments] = useState<LocalAppointment[]>(() => {
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
  });
  const [selectedDate, setSelectedDate] = useState(getInitialDashboardDate);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LocalAppointmentStatus>("All");
  const [doctorFilter, setDoctorFilter] = useState<"All" | string>("All");
  const [activeTokenId, setActiveTokenId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(DASHBOARD_PREFS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { activeTokenId?: string | null };
      return parsed.activeTokenId ?? null;
    } catch {
      return null;
    }
  });
  const [shiftNotes, setShiftNotes] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(SHIFT_NOTES_STORAGE_KEY) ?? "";
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AuditLog[];
      return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
    } catch {
      return [];
    }
  });
  const [walkInForm, setWalkInForm] = useState({
    name: "",
    phone: "",
    symptoms: "",
    doctor: "",
    priority: "Normal" as PatientPriority,
  });

  useEffect(() => {
    window.localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(localAppointments));
  }, [localAppointments]);

  useEffect(() => {
    window.localStorage.setItem(SHIFT_NOTES_STORAGE_KEY, shiftNotes);
  }, [shiftNotes]);

  useEffect(() => {
    window.localStorage.setItem(
      DASHBOARD_PREFS_STORAGE_KEY,
      JSON.stringify({ selectedDate, searchTerm, statusFilter, doctorFilter, activeTokenId }),
    );
  }, [selectedDate, searchTerm, statusFilter, doctorFilter, activeTokenId]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DASHBOARD_PREFS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        selectedDate?: string;
        searchTerm?: string;
        statusFilter?: "All" | LocalAppointmentStatus;
        doctorFilter?: "All" | string;
      };

      if (parsed.selectedDate) setSelectedDate(parsed.selectedDate);
      if (parsed.searchTerm) setSearchTerm(parsed.searchTerm);
      if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
      if (parsed.doctorFilter) setDoctorFilter(parsed.doctorFilter);
    } catch {
      // Ignore malformed local storage payloads.
    }
  }, []);

  const doctorOptions = useMemo(() => ["All", ...new Set(localAppointments.map((appointment) => appointment.doctor))], [localAppointments]);

  const dateAppointments = useMemo(
    () => localAppointments.filter((appointment) => appointment.date === selectedDate),
    [localAppointments, selectedDate],
  );

  const filteredAppointments = useMemo(() => {
    return dateAppointments.filter((appointment) => {
      const matchesSearch = searchTerm.trim().length === 0
        || appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase())
        || appointment.id.toLowerCase().includes(searchTerm.toLowerCase())
        || String(appointment.token).includes(searchTerm);

      const matchesStatus = statusFilter === "All" || appointment.status === statusFilter;
      const matchesDoctor = doctorFilter === "All" || appointment.doctor === doctorFilter;
      return matchesSearch && matchesStatus && matchesDoctor;
    });
  }, [dateAppointments, searchTerm, statusFilter, doctorFilter]);

  const queueMetrics = useMemo(() => {
    const waiting = dateAppointments.filter((appointment) => appointment.status === "Scheduled").length;
    const checkedIn = dateAppointments.filter((appointment) => appointment.status === "Checked In").length;
    const completed = dateAppointments.filter((appointment) => appointment.status === "Completed").length;
    const cancelled = dateAppointments.filter((appointment) => appointment.status === "Cancelled" || appointment.status === "No Show").length;
    const currentToken = dateAppointments.find((appointment) => appointment.status === "Checked In")?.token ?? "-";

    const estimatedWaitMinutes = Math.max(0, (waiting * 12) + (checkedIn * 8));
    return { waiting, checkedIn, completed, cancelled, currentToken, estimatedWaitMinutes };
  }, [dateAppointments]);

  const completionRate = useMemo(() => {
    if (dateAppointments.length === 0) return 0;
    return Math.round((queueMetrics.completed / dateAppointments.length) * 100);
  }, [dateAppointments.length, queueMetrics.completed]);

  const noShowRate = useMemo(() => {
    if (dateAppointments.length === 0) return 0;
    const noShowCount = dateAppointments.filter((appointment) => appointment.status === "No Show").length;
    return Math.round((noShowCount / dateAppointments.length) * 100);
  }, [dateAppointments]);

  const upcomingQueue = useMemo(
    () => [...dateAppointments]
      .filter((appointment) => appointment.status === "Scheduled")
      .sort((a, b) => a.token - b.token)
      .slice(0, 4),
    [dateAppointments],
  );

  const pendingBills = useMemo(() => bills.filter((bill) => bill.status === "Pending"), []);
  const pendingAmount = useMemo(
    () => pendingBills.reduce((sum, bill) => sum + bill.total, 0),
    [pendingBills],
  );

  const stats = [
    { label: "Total Patients", value: allPatients.length, icon: <Users className="w-6 h-6" />, color: "text-primary" },
    { label: "Appointments (Selected Date)", value: dateAppointments.length, icon: <CalendarCheck className="w-6 h-6" />, color: "text-success" },
    { label: "Pending Bills", value: pendingBills.length, icon: <Receipt className="w-6 h-6" />, color: "text-warning" },
    { label: "Completed", value: queueMetrics.completed, icon: <Activity className="w-6 h-6" />, color: "text-accent" },
  ];

  const printOPDSlip = (appointment: LocalAppointment) => {
    const clinic = getClinicSettings();
    const win = window.open("", "_blank", "width=420,height=380");
    if (!win) return;
    win.document.write(`<html><head><title>OPD Slip</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#0f172a;font-size:13px}
    .header{font-size:17px;font-weight:700;color:#1e5a80;margin-bottom:2px}
    .sub{font-size:11px;color:#64748b;margin-bottom:14px}
    .token{font-size:42px;font-weight:900;color:#1e5a80;text-align:center;margin:10px 0;letter-spacing:-1px}
    .row{display:flex;gap:8px;margin-bottom:5px;font-size:12px}
    .label{color:#64748b;min-width:100px}
    .value{font-weight:600}
    .divider{border:none;border-top:1px dashed #cbd5e1;margin:12px 0}
    .footer{font-size:10px;color:#94a3b8;text-align:center;margin-top:14px}
    </style></head><body>
    <div class="header">${clinic.name}</div>
    <div class="sub">${clinic.phone}${clinic.address ? " · " + clinic.address : ""}</div>
    <div class="sub">${new Date().toLocaleString()}</div>
    <hr class="divider"/>
    <div class="token">Token #${appointment.token}</div>
    <hr class="divider"/>
    <div class="row"><span class="label">Patient</span><span class="value">${appointment.patientName}</span></div>
    <div class="row"><span class="label">Patient ID</span><span class="value">${appointment.patientId}</span></div>
    <div class="row"><span class="label">Doctor</span><span class="value">${appointment.doctor}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${appointment.date}</span></div>
    <div class="row"><span class="label">Time</span><span class="value">${appointment.time}</span></div>
    <div class="row"><span class="label">Type</span><span class="value">${(appointment as LocalAppointment & { appointmentType?: string }).appointmentType ?? "OPD"}</span></div>
    <div class="footer">Please show this slip at the doctor's cabin. ${clinic.name}</div>
    <script>window.onload=()=>{window.print()}</script></body></html>`);
    win.document.close();
  };

  const updateAppointmentStatus = (appointmentId: string, status: LocalAppointmentStatus) => {
    setLocalAppointments((prev) => prev.map((appointment) => (
      appointment.id === appointmentId ? { ...appointment, status } : appointment
    )));

    const target = localAppointments.find((appointment) => appointment.id === appointmentId);
    if (target) {
      // Auto-print OPD slip on Check In
      if (status === "Checked In") {
        printOPDSlip(target);
      }
      const nextLogs: AuditLog[] = [
        {
          id: `AL-${Date.now()}`,
          type: "appointment.status.updated",
          at: new Date().toISOString(),
          details: `${target.id} | ${target.patientName} -> ${status}`,
        },
        ...auditLogs,
      ].slice(0, 80);
      setAuditLogs(nextLogs.slice(0, 12));
      window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(nextLogs));
    }
  };

  const notifications = useMemo(() => {
    const items: { severity: "high" | "medium" | "info"; message: string }[] = [];

    if (queueMetrics.waiting >= 5) {
      items.push({ severity: "high", message: `Queue is heavy with ${queueMetrics.waiting} waiting patients.` });
    }
    if (queueMetrics.cancelled >= 2) {
      items.push({ severity: "medium", message: `${queueMetrics.cancelled} patients cancelled/no-show today. Consider reminder follow-ups.` });
    }
    if (pendingAmount >= 2000) {
      items.push({ severity: "high", message: `Pending collections are ₹${pendingAmount.toLocaleString()}. Prioritize billing follow-up.` });
    }

    try {
      const raw = window.localStorage.getItem(ROOM_OCCUPANCY_STORAGE_KEY);
      if (raw) {
        const rows = JSON.parse(raw) as RoomOccupancyRow[];
        if (Array.isArray(rows)) {
          const fullRooms = rows
            .filter((row) => (row.totalBeds - row.occupiedBeds - row.reservedBeds) <= 0)
            .map((row) => row.roomType);
          if (fullRooms.length > 0) {
            items.push({ severity: "high", message: `Room availability alert: ${fullRooms.join(", ")} is full.` });
          }
        }
      }
    } catch {
      // Ignore malformed room occupancy data.
    }

    if (items.length === 0) {
      items.push({ severity: "info", message: "No critical operational alerts right now." });
    }

    return items;
  }, [queueMetrics.waiting, queueMetrics.cancelled, pendingAmount]);

  const reminderQueue = useMemo(() => {
    const reminders: { type: string; message: string }[] = [];
    const pendingFollowUps = filteredAppointments.filter((appointment) => appointment.status === "Scheduled").slice(0, 4);
    pendingFollowUps.forEach((appointment) => {
      reminders.push({
        type: "Reminder",
        message: `${appointment.patientName} - send visit reminder for ${appointment.time} (${appointment.doctor})`,
      });
    });

    pendingBills.slice(0, 3).forEach((bill) => {
      reminders.push({
        type: "Payment",
        message: `${bill.patientName} - pending ₹${bill.total.toLocaleString()} follow-up`,
      });
    });

    return reminders.slice(0, 6);
  }, [filteredAppointments, pendingBills]);

  const callNextPatient = () => {
    const nextScheduled = [...dateAppointments]
      .filter((appointment) => appointment.status === "Scheduled")
      .sort((a, b) => a.token - b.token)[0];

    if (!nextScheduled) return;

    setLocalAppointments((prev) => prev.map((appointment) => {
      if (appointment.id === nextScheduled.id) {
        return { ...appointment, status: "Checked In" };
      }
      if (appointment.date === selectedDate && appointment.status === "Checked In") {
        return { ...appointment, status: "Scheduled" };
      }
      return appointment;
    }));

    setActiveTokenId(nextScheduled.id);

    const nextLogs: AuditLog[] = [
      {
        id: `AL-${Date.now()}`,
        type: "queue.call_next",
        at: new Date().toISOString(),
        details: `Called token ${nextScheduled.token} (${nextScheduled.patientName})`,
      },
      ...auditLogs,
    ].slice(0, 80);
    setAuditLogs(nextLogs.slice(0, 12));
    window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(nextLogs));
  };

  const recallActiveToken = () => {
    const fallbackCheckedIn = dateAppointments.find((appointment) => appointment.status === "Checked In")?.id ?? null;
    const targetId = activeTokenId ?? fallbackCheckedIn;
    if (!targetId) return;

    setLocalAppointments((prev) => prev.map((appointment) => {
      if (appointment.id === targetId) {
        return { ...appointment, status: "Checked In" };
      }
      return appointment;
    }));

    setActiveTokenId(targetId);

    const recalled = dateAppointments.find((appointment) => appointment.id === targetId);
    const nextLogs: AuditLog[] = [
      {
        id: `AL-${Date.now()}`,
        type: "queue.recall",
        at: new Date().toISOString(),
        details: `Recalled token ${recalled?.token ?? "-"} (${recalled?.patientName ?? "Unknown"})`,
      },
      ...auditLogs,
    ].slice(0, 80);
    setAuditLogs(nextLogs.slice(0, 12));
    window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(nextLogs));
  };

  const markCurrentNoShow = () => {
    const checkedIn = dateAppointments.find((appointment) => appointment.status === "Checked In");
    if (!checkedIn) return;
    updateAppointmentStatus(checkedIn.id, "No Show");
    setActiveTokenId(null);

    const nextLogs: AuditLog[] = [
      {
        id: `AL-${Date.now()}`,
        type: "queue.no_show",
        at: new Date().toISOString(),
        details: `Marked no show for token ${checkedIn.token} (${checkedIn.patientName})`,
      },
      ...auditLogs,
    ].slice(0, 80);
    setAuditLogs(nextLogs.slice(0, 12));
    window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(nextLogs));
  };

  const completeCurrentToken = () => {
    const checkedIn = dateAppointments.find((appointment) => appointment.status === "Checked In");
    if (!checkedIn) return;

    updateAppointmentStatus(checkedIn.id, "Completed");
    setActiveTokenId(null);

    // Auto-create bill draft for completed appointment
    createBillDraftFromAppointment({
      patientId: checkedIn.patientId,
      patientName: checkedIn.patientName,
      appointmentId: checkedIn.id,
      doctor: checkedIn.doctor,
      date: checkedIn.date,
    });

    const nextLogs: AuditLog[] = [
      {
        id: `AL-${Date.now()}`,
        type: "queue.complete",
        at: new Date().toISOString(),
        details: `Completed token ${checkedIn.token} (${checkedIn.patientName})`,
      },
      ...auditLogs,
    ].slice(0, 80);
    setAuditLogs(nextLogs.slice(0, 12));
    window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(nextLogs));
    toast.success("Visit completed. Bill draft created in Billing.");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setDoctorFilter("All");
    toast.success("Filters reset.");
  };

  const quickAddWalkIn = () => {
    const name = walkInForm.name.trim();
    const phone = walkInForm.phone.trim();
    if (!name || !walkInForm.doctor || !selectedDate) {
      toast.error("Please enter walk-in name and doctor.");
      return;
    }
    if (phone && phone.replace(/\D/g, "").length !== 10) {
      toast.error("Walk-in phone must be 10 digits.");
      return;
    }

    const nextToken = dateAppointments
      .filter((appointment) => appointment.doctor === walkInForm.doctor)
      .reduce((maxToken, appointment) => Math.max(maxToken, appointment.token), 0) + 1;

    // Save walk-in as a real patient in storage
    const newPatientId = generatePatientId();
    const newPatient = {
      id: newPatientId,
      name,
      phone: phone.replace(/\D/g, "") || "0000000000",
      age: 0,
      gender: "Other" as const,
      symptoms: walkInForm.symptoms.trim() || "Walk-in",
      registeredAt: new Date().toISOString().split("T")[0],
    };
    savePatient(newPatient);
    setAllPatients(getPatients());

    const walkInAppointment: LocalAppointment = {
      id: `A-WI-${Date.now().toString().slice(-6)}`,
      patientId: newPatientId,
      patientName: name,
      doctor: walkInForm.doctor,
      date: selectedDate,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      token: nextToken,
      status: "Scheduled",
      priority: walkInForm.priority,
    };

    setLocalAppointments((prev) => [...prev, walkInAppointment]);

    const nextLogs: AuditLog[] = [
      {
        id: `AL-${Date.now()}`,
        type: "walkin.added",
        at: new Date().toISOString(),
        details: `${walkInAppointment.patientName} added | ${walkInAppointment.doctor} | Token ${nextToken} | ${walkInForm.priority}`,
      },
      ...auditLogs,
    ].slice(0, 80);
    setAuditLogs(nextLogs.slice(0, 12));
    window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(nextLogs));
    storagePushAuditLog("walkin.added", `${name} | ${walkInForm.doctor} | Token ${nextToken}`);

    setWalkInForm({ name: "", phone: "", symptoms: "", doctor: walkInForm.doctor, priority: "Normal" });
    toast.success(`Walk-in ${name} added to queue. Patient ID: ${newPatientId}`);
  };

  const admitCheckedInPatient = () => {
    const checkedIn = dateAppointments.find((appointment) => appointment.status === "Checked In");
    if (!checkedIn) {
      toast.error("No checked-in patient available to admit.");
      return;
    }

    const nextLogs: AuditLog[] = [
      {
        id: `AL-${Date.now()}`,
        type: "admit.initiated",
        at: new Date().toISOString(),
        details: `Admission initiated for ${checkedIn.patientName} (${checkedIn.patientId})`,
      },
      ...auditLogs,
    ].slice(0, 80);
    setAuditLogs(nextLogs.slice(0, 12));
    window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(nextLogs));

    navigate(`/receptionist/rooms?patientId=${encodeURIComponent(checkedIn.patientId)}&doctor=${encodeURIComponent(checkedIn.doctor)}`);
    toast.success("Admission flow opened in Room Occupancy.");
  };

  const generateHandoverSummary = () => {
    const summary = [
      `Shift handover - ${new Date().toLocaleString()}`,
      `Waiting: ${queueMetrics.waiting}`,
      `Checked in: ${queueMetrics.checkedIn}`,
      `No-show/cancelled: ${queueMetrics.cancelled}`,
      `Pending billing files: ${pendingBills.length}`,
      `Pending billing amount: ₹${pendingAmount.toLocaleString()}`,
      "",
      "Actionables:",
      queueMetrics.waiting > 0 ? `- Call next waiting patients (${queueMetrics.waiting})` : "- No queue backlog",
      pendingBills.length > 0 ? `- Follow-up pending bills (${pendingBills.length})` : "- No pending bill follow-up",
    ].join("\n");

    setShiftNotes(summary);
    toast.success("Handover summary generated.");
  };

  const exportOperationsSnapshot = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      selectedDate,
      queueMetrics,
      appointments: localAppointments,
      shiftNotes,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medcore-operations-snapshot-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openPatientProfile = (patientId: string) => {
    navigate(`/receptionist/patient/${encodeURIComponent(patientId)}`);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1320px] animate-fade-in-up">
        <div className="rounded-[28px] border border-white/60 bg-white/95 backdrop-blur-2xl p-3 shadow-[0_24px_65px_-45px_rgba(40,114,161,0.45)] sm:p-6 transition-all duration-300">
          <section className="flex flex-col gap-3 border-b border-white/40 px-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title text-[#2872a1]">Reception desk operations</h1>
              <p className="mt-1 text-xs font-medium text-slate-500">Live queue control, billing follow-up, and appointment command center.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/50 bg-white/40 px-4 py-2 text-center backdrop-blur-md">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Desk Time</p>
                <p className="font-mono text-base font-bold text-[#2872a1]">{clockTime}</p>
              </div>
              <div className="rounded-xl border border-white/50 bg-white/40 px-4 py-2 text-center backdrop-blur-md">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Date</p>
                <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <article className="glass-card rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl p-4 text-center shadow-[0_15px_35px_-12px_rgba(40,114,161,0.25)] transition-all duration-300 hover:bg-white/50">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-[#5f9cc0] to-[#2872a1] text-white shadow-lg">
                    <Users className="h-8 w-8" />
                  </div>
                  <p className="mt-3 text-lg font-bold text-[#2872a1]">Token {queueMetrics.currentToken}</p>
                  <p className="text-xs text-slate-600">Active patient in desk flow</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2872a1]">
                    <Clock3 className="h-3.5 w-3.5" /> {queueMetrics.estimatedWaitMinutes} mins wait
                  </p>
                </article>

                <article className="glass-card rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl p-4 lg:col-span-2 shadow-[0_15px_35px_-12px_rgba(40,114,161,0.25)] transition-all duration-300 hover:bg-white/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-[#2872a1]">General information</h3>
                    <button
                      onClick={() => navigate("/receptionist/register")}
                      className="rounded-full border border-white/50 bg-white/30 px-2.5 py-1 text-[11px] font-semibold text-[#2872a1] hover:bg-white/45 transition-all duration-300"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="rounded-xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-md p-3 border border-white/40"><p className="text-slate-500">Total patients</p><p className="text-lg font-bold text-[#2872a1] mt-1">{allPatients.length}</p></div>
                    <div className="rounded-xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-md p-3 border border-white/40"><p className="text-slate-500">Today appointments</p><p className="text-lg font-bold text-[#2872a1] mt-1">{dateAppointments.length}</p></div>
                    <div className="rounded-xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-md p-3 border border-white/40"><p className="text-slate-500">Checked in</p><p className="text-lg font-bold text-[#2872a1] mt-1">{queueMetrics.checkedIn}</p></div>
                    <div className="rounded-xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-md p-3 border border-white/40"><p className="text-slate-500">Waiting</p><p className="text-lg font-bold text-[#2872a1] mt-1">{queueMetrics.waiting}</p></div>
                  </div>
                </article>
              </div>

              <div className="glass-card rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl p-4 shadow-[0_15px_35px_-12px_rgba(40,114,161,0.25)] transition-all duration-300">
                <div className="grid grid-cols-1 gap-3 border-b border-white/40 pb-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2872a1]"><CalendarCheck className="h-3.5 w-3.5" /> Date</span>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="h-10 w-full rounded-lg border border-white/50 px-3 text-sm text-slate-700 bg-white/60 backdrop-blur-sm focus:border-[#2872a1] focus:outline-none focus:bg-white/80 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                        className="h-10 shrink-0 rounded-lg border border-white/50 bg-white/60 px-2.5 text-xs font-semibold text-[#2872a1] hover:bg-white/80 transition-all"
                      >
                        Today
                      </button>
                    </div>
                  </label>

                  <label className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2872a1]"><Search className="h-3.5 w-3.5" /> Search</span>
                    <input
                      type="text"
                      value={searchTerm}
                      placeholder="Patient, token, appointment id"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 w-full rounded-lg border border-white/50 px-3 text-sm text-slate-700 bg-white/60 backdrop-blur-sm focus:border-[#2872a1] focus:outline-none focus:bg-white/80 transition-all duration-300"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2872a1]"><Filter className="h-3.5 w-3.5" /> Status</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as "All" | LocalAppointmentStatus)}
                      className="h-10 w-full rounded-lg border border-white/50 px-3 text-sm text-slate-700 bg-white/60 backdrop-blur-sm focus:border-[#2872a1] focus:outline-none focus:bg-white/80 transition-all duration-300"
                    >
                      <option value="All">All</option>
                      {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2872a1]"><Users className="h-3.5 w-3.5" /> Doctor</span>
                    <select
                      value={doctorFilter}
                      onChange={(e) => setDoctorFilter(e.target.value as "All" | string)}
                      className="h-10 w-full rounded-lg border border-white/50 px-3 text-sm text-slate-700 bg-white/60 backdrop-blur-sm focus:border-[#2872a1] focus:outline-none focus:bg-white/80 transition-all duration-300"
                    >
                      {doctorOptions.map((doctor) => <option key={doctor} value={doctor}>{doctor}</option>)}
                    </select>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={callNextPatient}
                    className="rounded-full bg-gradient-to-r from-[#2872a1] to-[#1a4d73] px-3.5 py-2 text-xs font-semibold text-white transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    Call Next
                  </button>
                  <button
                    onClick={recallActiveToken}
                    className="rounded-full border border-white/50 bg-white/30 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#2872a1] transition-all duration-300 hover:bg-white/45 hover:scale-105 active:scale-95"
                  >
                    Recall Token
                  </button>
                  <button
                    onClick={markCurrentNoShow}
                    className="rounded-full border border-white/50 bg-white/30 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#2872a1] transition-all duration-300 hover:bg-white/45 hover:scale-105 active:scale-95"
                  >
                    Mark No Show
                  </button>
                  <button
                    onClick={completeCurrentToken}
                    className="rounded-full border border-emerald-300/70 bg-emerald-100/60 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-emerald-700 transition-all duration-300 hover:bg-emerald-100 hover:scale-105 active:scale-95"
                  >
                    Complete Visit
                  </button>
                  <button
                    onClick={() => navigate("/receptionist/appointment")}
                    className="rounded-full border border-white/50 bg-white/30 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#2872a1] transition-all duration-300 hover:bg-white/45 hover:scale-105 active:scale-95"
                  >
                    <span className="inline-flex items-center gap-1"><CalendarPlus className="h-3.5 w-3.5" /> New booking</span>
                  </button>
                  <button
                    onClick={() => navigate("/receptionist/billing")}
                    className="rounded-full border border-white/50 bg-white/30 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#2872a1] transition-all duration-300 hover:bg-white/45 hover:scale-105 active:scale-95"
                  >
                    <span className="inline-flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" /> Billing</span>
                  </button>
                  <button
                    onClick={() => navigate("/receptionist/register")}
                    className="rounded-full border border-white/50 bg-white/30 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#2872a1] transition-all duration-300 hover:bg-white/45 hover:scale-105 active:scale-95"
                  >
                    <span className="inline-flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" /> Register</span>
                  </button>
                  <button
                    onClick={resetFilters}
                    className="rounded-full border border-white/50 bg-white/30 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-[#2872a1] transition-all duration-300 hover:bg-white/45 hover:scale-105 active:scale-95"
                  >
                    <span className="inline-flex items-center gap-1"><RefreshCcw className="h-3.5 w-3.5" /> Reset filters</span>
                  </button>
                  <button
                    onClick={admitCheckedInPatient}
                    className="rounded-full border border-blue-300/70 bg-blue-100/70 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-blue-700 transition-all duration-300 hover:bg-blue-100 hover:scale-105 active:scale-95"
                  >
                    <span className="inline-flex items-center gap-1"><Hospital className="h-3.5 w-3.5" /> Admit checked-in</span>
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-white/50 bg-white/25 p-3 backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#2872a1]">Quick Walk-In</h4>
                    <UserRoundPlus className="h-4 w-4 text-[#2872a1]" />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                    <input
                      value={walkInForm.name}
                      onChange={(e) => setWalkInForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Patient name *"
                      className="h-9 rounded-lg border border-white/50 bg-white/70 px-2 text-xs text-slate-700 sm:col-span-2"
                    />
                    <input
                      value={walkInForm.phone}
                      onChange={(e) => setWalkInForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone (optional)"
                      className="h-9 rounded-lg border border-white/50 bg-white/70 px-2 text-xs text-slate-700"
                    />
                    <select
                      value={walkInForm.doctor}
                      onChange={(e) => setWalkInForm((prev) => ({ ...prev, doctor: e.target.value }))}
                      className="h-9 rounded-lg border border-white/50 bg-white/70 px-2 text-xs text-slate-700"
                    >
                      <option value="">Doctor *</option>
                      {doctorOptions.filter((doctor) => doctor !== "All").map((doctor) => (
                        <option key={doctor} value={doctor}>{doctor}</option>
                      ))}
                    </select>
                    <select
                      value={walkInForm.priority}
                      onChange={(e) => setWalkInForm((prev) => ({ ...prev, priority: e.target.value as PatientPriority }))}
                      className="h-9 rounded-lg border border-white/50 bg-white/70 px-2 text-xs text-slate-700"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Senior">Senior</option>
                      <option value="Follow-up">Follow-up</option>
                    </select>
                  </div>
                  <input
                    value={walkInForm.symptoms}
                    onChange={(e) => setWalkInForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                    placeholder="Chief complaint / symptoms (optional)"
                    className="mt-2 h-9 w-full rounded-lg border border-white/50 bg-white/70 px-2 text-xs text-slate-700"
                  />
                  <button
                    onClick={quickAddWalkIn}
                    className="mt-2 rounded-full bg-gradient-to-r from-[#2872a1] to-[#1a4d73] px-3.5 py-2 text-xs font-semibold text-white transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    Add walk-in to queue
                  </button>
                </div>

                <div className="mt-4 rounded-xl border border-white/50 bg-white/25 p-3 backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-[#2872a1]">Next Up Queue</h4>
                    <span className="text-[11px] font-semibold text-slate-500">{upcomingQueue.length} scheduled</span>
                  </div>
                  {upcomingQueue.length === 0 && (
                    <p className="text-xs text-slate-500">No scheduled patients in queue for this date.</p>
                  )}
                  <div className="space-y-2">
                    {upcomingQueue.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between rounded-lg border border-white/40 bg-white/40 px-3 py-2">
                        <div>
                          <button
                            onClick={() => openPatientProfile(appointment.patientId)}
                            className="text-xs font-semibold text-slate-800 hover:text-[#2872a1] transition-colors duration-300"
                          >
                            Token {appointment.token} - {appointment.patientName}
                          </button>
                          <div className="text-[11px] text-slate-500">
                            {appointment.time} |
                            <span class="ml-1 font-semibold text-slate-700">{appointment.doctor}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, "Checked In")}
                          className="rounded-full border border-indigo-300/70 bg-indigo-100/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 transition-all duration-300 hover:bg-indigo-100"
                        >
                          Check in
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-2 sm:hidden">
                  {filteredAppointments.length === 0 && (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">No appointments found for current filters.</p>
                  )}

                  {filteredAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            onClick={() => openPatientProfile(appointment.patientId)}
                            className="text-sm font-semibold text-slate-800 hover:text-[#2872a1] transition-colors duration-300"
                          >
                            Token {appointment.token} - {appointment.patientName}
                          </button>
                          <div className="text-xs text-slate-500">
                            <span class="font-semibold text-slate-700">{appointment.doctor}</span>
                            <span> | {appointment.time}</span>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass[appointment.status]}`}>{appointment.status}</span>
                      </div>
                      <select
                        value={appointment.status}
                        onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value as LocalAppointmentStatus)}
                        className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
                      >
                        {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="responsive-table-wrap mt-3 hidden sm:block">
                  <table className="responsive-table">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 text-left font-semibold">Token</th>
                        <th className="px-4 py-3 text-left font-semibold">Patient</th>
                        <th className="px-4 py-3 text-left font-semibold">Doctor</th>
                        <th className="px-4 py-3 text-left font-semibold">Time</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Action</th>
                        <th className="px-4 py-3 text-left font-semibold">Reschedule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 text-sm text-slate-500">No appointments found for current filters.</td>
                        </tr>
                      )}
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment.id} className="border-b border-slate-100 last:border-0 hover:bg-cyan-50/45 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">{appointment.token}</td>
                          <td className="px-4 py-3 text-slate-700">
                            <button
                              onClick={() => openPatientProfile(appointment.patientId)}
                              className="font-semibold hover:text-[#2872a1] transition-colors duration-300"
                            >
                              {appointment.patientName}
                            </button>
                            <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPriorityClass(appointment.priority ?? "Normal")}`}>
                              {appointment.priority ?? "Normal"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <span class="font-semibold text-slate-700">{appointment.doctor}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{appointment.time}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass[appointment.status]}`}>{appointment.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={appointment.status}
                              onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value as LocalAppointmentStatus)}
                              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:border-cyan-400 focus:outline-none"
                            >
                              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/receptionist/appointment?patientId=${encodeURIComponent(appointment.patientId)}&doctor=${encodeURIComponent(appointment.doctor)}&date=${encodeURIComponent(appointment.date)}`)}
                              className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
                            >
                              Reschedule
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <article className="glass-card rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl p-4 shadow-[0_15px_35px_-12px_rgba(40,114,161,0.25)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[#2872a1]">Queue Insights</h3>
                  <Gauge className="h-4 w-4 text-[#2872a1]" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/40 bg-white/40 px-2 py-2 text-center">
                    <p className="text-[11px] text-slate-500">Completion</p>
                    <p className="text-base font-bold text-emerald-700">{completionRate}%</p>
                  </div>
                  <div className="rounded-lg border border-white/40 bg-white/40 px-2 py-2 text-center">
                    <p className="text-[11px] text-slate-500">No-show</p>
                    <p className="text-base font-bold text-amber-700">{noShowRate}%</p>
                  </div>
                  <div className="rounded-lg border border-white/40 bg-white/40 px-2 py-2 text-center">
                    <p className="text-[11px] text-slate-500">Checked in</p>
                    <p className="text-base font-bold text-indigo-700">{queueMetrics.checkedIn}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Completed flow</span>
                      <span>{queueMetrics.completed}/{Math.max(dateAppointments.length, 1)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/50">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Current waiting load</span>
                      <span>{queueMetrics.waiting} patients</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/50">
                      <div className="h-2 rounded-full bg-[#2872a1] transition-all duration-500" style={{ width: `${Math.min(queueMetrics.waiting * 14, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <UserCheck2 className="h-3.5 w-3.5 text-[#2872a1]" /> Keep no-show rate under 10% for smoother desk throughput.
                </p>
              </article>

              <article className="glass-card rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl p-4 shadow-[0_15px_35px_-12px_rgba(40,114,161,0.25)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[#2872a1]">Anamnesis</h3>
                  <span className="rounded-full border border-white/50 bg-white/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2872a1]">Live</span>
                </div>
                <div className="mt-3 space-y-2">
                  {notifications.map((notice, index) => (
                    <div
                      key={`${notice.message}-${index}`}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-300 ${
                        notice.severity === "high"
                          ? "border-rose-300/50 bg-rose-100/40 backdrop-blur-sm text-rose-700"
                          : notice.severity === "medium"
                            ? "border-amber-300/50 bg-amber-100/40 backdrop-blur-sm text-amber-700"
                            : "border-cyan-300/50 bg-cyan-100/40 backdrop-blur-sm text-cyan-700"
                      }`}
                    >
                      {notice.message}
                    </div>
                  ))}
                </div>
              </article>

              <article className="glass-card rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl p-4 shadow-[0_15px_35px_-12px_rgba(40,114,161,0.25)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[#2872a1]">Reminder Queue</h3>
                  <BellRing className="h-4 w-4 text-[#2872a1]" />
                </div>
                <div className="mt-3 space-y-2">
                  {reminderQueue.length === 0 && <p className="text-xs text-slate-500">No reminder tasks right now.</p>}
                  {reminderQueue.map((item, idx) => (
                    <div key={`${item.type}-${idx}`} className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                      <p className="text-[11px] font-semibold text-[#2872a1] uppercase tracking-[0.08em]">{item.type}</p>
                      <p className="text-xs text-slate-700">{item.message}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="glass-card rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl p-4 shadow-[0_15px_35px_-12px_rgba(40,114,161,0.25)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[#2872a1]">Files</h3>
                  <button
                    onClick={() => navigate("/receptionist/billing")}
                    className="rounded-full border border-white/50 bg-white/30 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#2872a1] hover:bg-white/45 transition-all duration-300"
                  >
                    Collect
                  </button>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  {pendingBills.length === 0 && <p className="text-xs text-slate-500">No pending payment files.</p>}
                  {pendingBills.slice(0, 5).map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between rounded-lg bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-md px-3 py-2 border border-white/40">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{bill.id} - {bill.patientName}</p>
                        <p className="text-[11px] text-slate-500">Pending follow-up</p>
                      </div>
                      <p className="text-xs font-bold text-slate-900">₹{bill.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs font-semibold text-amber-700">Total pending: ₹{pendingAmount.toLocaleString()}</p>
              </article>

              <article className="glass-card rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl p-4 shadow-[0_15px_35px_-12px_rgba(40,114,161,0.25)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[#2872a1]">Desk SLA Watch</h3>
                  <Clock3 className="h-4 w-4 text-[#2872a1]" />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                    <p className="text-slate-500">Queue response SLA</p>
                    <p className="mt-1 font-bold text-emerald-700">{Math.max(82, 100 - queueMetrics.waiting * 4)}%</p>
                  </div>
                  <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                    <p className="text-slate-500">Reminder closure</p>
                    <p className="mt-1 font-bold text-indigo-700">{Math.max(78, 100 - reminderQueue.length * 5)}%</p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-white/40 bg-white/45 px-3 py-2 text-xs text-slate-700">
                  <p className="font-semibold text-[#2872a1]">Quick call script</p>
                  <p className="mt-1">"Hello, this is MedCore front desk. Your consultation slot is in 20 minutes, please arrive at the desk."</p>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-slate-800">Notes</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={generateHandoverSummary}
                      className="rounded-full border border-cyan-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-700 hover:bg-cyan-50"
                    >
                      Auto Summary
                    </button>
                    <button
                      onClick={exportOperationsSnapshot}
                      className="rounded-full border border-cyan-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-700 hover:bg-cyan-50"
                    >
                      Download
                    </button>
                  </div>
                </div>
                <textarea
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none"
                  placeholder="Write handover notes for next receptionist shift..."
                />
                <div className="mt-3 max-h-44 space-y-2 overflow-auto pr-1">
                  {auditLogs.length === 0 && <p className="text-xs text-slate-500">No recent activity.</p>}
                  {auditLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                      <p className="text-[11px] font-semibold text-slate-700">{log.type}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{log.details}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className={`mb-2 inline-flex rounded-lg bg-white p-2 ${stat.color}`}>{stat.icon}</div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReceptionistDashboard;
