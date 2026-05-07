import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { appointments, bills, doctors, prescriptions, type Appointment } from "@/data/mockData";
import { getPatients, pushAuditLog } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarCheck, Clock3, FileText, Search, Stethoscope, UserRound, Users, CheckCircle2, FilePlus } from "lucide-react";
import { toast } from "sonner";

const APPOINTMENTS_STORAGE_KEY = "medcore-receptionist-appointments";
const PRESCRIPTIONS_STORAGE_KEY = "medcore-doctor-prescriptions";
const PHARMACY_DISPATCH_STORAGE_KEY = "medcore-pharmacy-dispatch";

type LocalAppointmentStatus = Appointment["status"] | "Checked In" | "No Show";

interface DashboardAppointment extends Omit<Appointment, "status"> {
  status: LocalAppointmentStatus;
  priority?: "Normal" | "Emergency" | "Senior" | "Follow-up";
}

const statusClass: Record<LocalAppointmentStatus, string> = {
  Scheduled: "bg-slate-100 text-slate-700",
  "Checked In": "bg-indigo-100 text-indigo-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
  "No Show": "bg-amber-100 text-amber-700",
};

const priorityClass = (priority: DashboardAppointment["priority"]) => {
  if (priority === "Emergency") return "bg-rose-100 text-rose-700";
  if (priority === "Senior") return "bg-amber-100 text-amber-700";
  if (priority === "Follow-up") return "bg-indigo-100 text-indigo-700";
  return "bg-slate-100 text-slate-700";
};

const getLatestDate = (allAppointments: DashboardAppointment[]) => {
  const today = new Date().toISOString().split("T")[0];
  const hasToday = allAppointments.some((appointment) => appointment.date === today);
  if (hasToday) return today;

  const sortedDates = [...new Set(allAppointments.map((appointment) => appointment.date))].sort((a, b) => b.localeCompare(a));
  return sortedDates[0] ?? today;
};

const resolveDoctorFromEmail = (email: string | null) => {
  if (!email) return doctors[0];
  const localPart = email.split("@")[0].toLowerCase();

  const matched = doctors.find((doctor) => {
    const normalized = doctor.replace("Dr. ", "").toLowerCase();
    const tokens = normalized.split(" ");
    return tokens.some((token) => localPart.includes(token));
  });

  return matched ?? doctors[0];
};

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { email } = useAuth();

  const [localAppointments, setLocalAppointments] = useState<DashboardAppointment[]>(() => {
    if (typeof window === "undefined") return appointments.map((a) => ({ ...a }));
    try {
      const raw = window.localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (!raw) return appointments.map((a) => ({ ...a }));
      const parsed = JSON.parse(raw) as DashboardAppointment[];
      return Array.isArray(parsed) ? parsed : appointments.map((a) => ({ ...a }));
    } catch {
      return appointments.map((a) => ({ ...a }));
    }
  });

  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);

  const markCompleted = (appointmentId: string) => {
    setLocalAppointments((prev) => {
      const next = prev.map((a) => a.id === appointmentId ? { ...a, status: "Completed" as LocalAppointmentStatus } : a);
      window.localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    pushAuditLog("doctor.appointment.completed", `Appointment ${appointmentId} marked completed`);
    toast.success("Appointment marked as completed.");
    setFollowUpPrompt(appointmentId);
    setTimeout(() => setFollowUpPrompt(null), 8000);
  };

  const activeDoctor = useMemo(() => resolveDoctorFromEmail(email), [email]);
  const activeDate = useMemo(() => getLatestDate(localAppointments), [localAppointments]);

  const myAppointments = useMemo(
    () => localAppointments.filter((appointment) => appointment.doctor === activeDoctor),
    [localAppointments, activeDoctor],
  );

  const myAppointmentsToday = useMemo(
    () => myAppointments.filter((appointment) => appointment.date === activeDate),
    [myAppointments, activeDate],
  );

  const myPatientIds = useMemo(
    () => [...new Set(myAppointments.map((appointment) => appointment.patientId))],
    [myAppointments],
  );

  const myPatients = useMemo(
    () => getPatients().filter((patient) => myPatientIds.includes(patient.id)),
    [myPatientIds],
  );

  const myPrescriptions = useMemo(
    () => prescriptions.filter((entry) => entry.doctor === activeDoctor),
    [activeDoctor],
  );

  const myLocalPrescriptions = useMemo(() => {
    if (typeof window === "undefined") return [] as Array<{ id: string; doctor: string }>;
    try {
      const raw = window.localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Array<{ id: string; doctor: string }>) : [];
      return parsed.filter((entry) => entry.doctor === activeDoctor);
    } catch {
      return [];
    }
  }, [activeDoctor]);

  const pharmacyDispatch = useMemo(() => {
    if (typeof window === "undefined") return {} as Record<string, { sent: boolean }>;
    try {
      const raw = window.localStorage.getItem(PHARMACY_DISPATCH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, { sent: boolean }>) : {};
    } catch {
      return {};
    }
  }, []);

  // Pharmacy workflow — dispensed status feedback
  const pharmacyWorkflow = useMemo<Record<string, { dispensedAt?: string; acceptedAt?: string }>>(() => {
    try {
      const raw = window.localStorage.getItem("medcore-pharmacy-workflow");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }, []);

  const myBillingAmount = useMemo(
    () => bills.filter((bill) => myPatientIds.includes(bill.patientId)).reduce((sum, bill) => sum + bill.total, 0),
    [myPatientIds],
  );

  const pendingReviews = useMemo(
    () => myAppointmentsToday.filter((appointment) => appointment.status === "Scheduled" || appointment.status === "Checked In").length,
    [myAppointmentsToday],
  );

  const completedToday = useMemo(
    () => myAppointmentsToday.filter((appointment) => appointment.status === "Completed").length,
    [myAppointmentsToday],
  );

  const noShowToday = useMemo(
    () => myAppointmentsToday.filter((appointment) => appointment.status === "No Show").length,
    [myAppointmentsToday],
  );

  const completionRate = useMemo(() => {
    if (myAppointmentsToday.length === 0) return 0;
    return Math.round((completedToday / myAppointmentsToday.length) * 100);
  }, [completedToday, myAppointmentsToday.length]);

  const upcomingQueue = useMemo(
    () => myAppointmentsToday
      .filter((appointment) => appointment.status === "Scheduled" || appointment.status === "Checked In")
      .sort((a, b) => a.token - b.token)
      .slice(0, 6),
    [myAppointmentsToday],
  );

  const combinedPrescriptionCount = myPrescriptions.length + myLocalPrescriptions.length;
  const sentToPharmacyCount = useMemo(
    () => myLocalPrescriptions.filter((entry) => pharmacyDispatch[entry.id]?.sent).length,
    [myLocalPrescriptions, pharmacyDispatch],
  );
  const pendingPharmacyCount = myLocalPrescriptions.length - sentToPharmacyCount;
  const dispensedCount = useMemo(
    () => myLocalPrescriptions.filter((entry) => pharmacyWorkflow[entry.id]?.dispensedAt).length,
    [myLocalPrescriptions, pharmacyWorkflow],
  );

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1320px] animate-fade-in-up">
        <div className="rounded-[28px] border border-white/60 bg-white/95 backdrop-blur-2xl p-4 shadow-[0_24px_65px_-45px_rgba(40,114,161,0.45)] sm:p-6">
          <section className="rounded-2xl bg-gradient-to-r from-[#2872a1] via-[#2f7fb3] to-[#5f9cc0] px-5 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/80">Personalized Doctor Workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{activeDoctor}</h1>
            <p className="mt-1 text-sm text-white/85">Showing only your appointments, patients, and clinical workload.</p>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate("/doctor/prescriptions")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-[#2872a1]"><FileText className="h-4 w-4" /> Prescription Status</p>
              <p className="mt-1 text-xs text-slate-500">Track pharmacy-sent and dispensed prescriptions.</p>
            </button>
            <button
              type="button"
              onClick={() => navigate("/doctor/search")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-[#2872a1]"><Search className="h-4 w-4" /> Search Patient</p>
              <p className="mt-1 text-xs text-slate-500">Open chart details quickly from doctor workspace.</p>
            </button>
          </section>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-white/60 bg-white/50 p-4 transition-all duration-300 hover:bg-white/70">
              <p className="text-xs font-semibold text-slate-500">My Appointments (Today)</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{myAppointmentsToday.length}</p>
              <p className="mt-1 text-xs text-slate-600">{pendingReviews} pending review</p>
            </article>
            <article className="rounded-2xl border border-white/60 bg-white/50 p-4 transition-all duration-300 hover:bg-white/70">
              <p className="text-xs font-semibold text-slate-500">My Patients</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{myPatients.length}</p>
              <p className="mt-1 text-xs text-slate-600">Unique assigned patients</p>
            </article>
            <article className="rounded-2xl border border-white/60 bg-white/50 p-4 transition-all duration-300 hover:bg-white/70">
              <p className="text-xs font-semibold text-slate-500">My Prescriptions</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{combinedPrescriptionCount}</p>
              <p className="mt-1 text-xs text-slate-600">Total authored by you</p>
            </article>
            <article className="rounded-2xl border border-white/60 bg-white/50 p-4 transition-all duration-300 hover:bg-white/70">
              <p className="text-xs font-semibold text-slate-500">Completion Rate</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{completionRate}%</p>
              <p className="mt-1 text-xs text-slate-600">{completedToday} completed • {noShowToday} no-show</p>
            </article>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
            <article className="rounded-2xl border border-white/60 bg-white/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">My Queue Today</h3>
                <span className="text-xs font-semibold text-slate-500">Date: {activeDate}</span>
              </div>
              <div className="space-y-2">
                {upcomingQueue.length === 0 && <p className="text-xs text-slate-500">No active queue items for you today.</p>}
                {upcomingQueue.map((appointment) => (
                  <div key={appointment.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Token {appointment.token} — {appointment.patientName}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{appointment.time} · {appointment.patientId}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass(appointment.priority)}`}>
                          {appointment.priority ?? "Normal"}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass[appointment.status]}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/doctor/write-rx?patientId=${appointment.patientId}&patientName=${encodeURIComponent(appointment.patientName)}`)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#2872a1]/30 bg-[#2872a1]/5 px-2.5 py-1 text-[11px] font-semibold text-[#2872a1] hover:bg-[#2872a1]/10 transition-all"
                      >
                        <FilePlus className="h-3 w-3" /> Write Rx
                      </button>
                      <button
                        onClick={() => markCompleted(appointment.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-all"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Mark Done
                      </button>
                    </div>
                    {followUpPrompt === appointment.id && (
                      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 mt-1">
                        <span className="text-[11px] font-semibold text-amber-700">Schedule follow-up?</span>
                        <button
                          onClick={() => navigate(`/receptionist/appointment?patientId=${appointment.patientId}&doctor=${encodeURIComponent(appointment.doctor)}`)}
                          className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-amber-600 transition-colors"
                        >
                          Book Now
                        </button>
                        <button onClick={() => setFollowUpPrompt(null)} className="text-amber-400 hover:text-amber-600 text-[10px] ml-auto">Dismiss</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/60 bg-white/50 p-4">
              <h3 className="text-sm font-bold text-slate-800">My Performance</h3>
              <div className="mt-3 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Completion progress</span>
                    <span>{completedToday}/{Math.max(myAppointmentsToday.length, 1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                  <p className="inline-flex items-center gap-1 font-semibold"><Clock3 className="h-3.5 w-3.5 text-[#2872a1]" /> Pending reviews: {pendingReviews}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                  <p className="inline-flex items-center gap-1 font-semibold"><Users className="h-3.5 w-3.5 text-[#2872a1]" /> Assigned patients: {myPatients.length}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                  <p className="inline-flex items-center gap-1 font-semibold"><FileText className="h-3.5 w-3.5 text-[#2872a1]" /> Revenue touchpoints: ₹{myBillingAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                  <p className="inline-flex items-center gap-1 font-semibold"><Stethoscope className="h-3.5 w-3.5 text-[#2872a1]" /> Sent to pharmacy: {sentToPharmacyCount} • Pending: {pendingPharmacyCount} • Dispensed: {dispensedCount}</p>
                </div>
              </div>
            </article>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-white/60 bg-white/50 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-800">My Patients Snapshot</h3>
              <div className="space-y-2">
                {myPatients.length === 0 && <p className="text-xs text-slate-500">No patients linked yet.</p>}
                {myPatients.slice(0, 6).map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{patient.name}</p>
                      <p className="text-[11px] text-slate-500">{patient.symptoms}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">{patient.age}y</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/60 bg-white/50 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-800">My Clinical Highlights</h3>
              <div className="space-y-2 text-xs">
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 inline-flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-[#2872a1]" /> Prescriptions authored: {myPrescriptions.length}
                </p>
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 inline-flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-[#2872a1]" /> Total appointments assigned: {myAppointments.length}
                </p>
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 inline-flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-[#2872a1]" /> Follow-up opportunity set: {myAppointments.filter((a) => a.status === "Completed").length}
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
