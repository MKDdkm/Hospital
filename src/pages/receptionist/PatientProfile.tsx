import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { bills, prescriptions } from "@/data/mockData";
import { getPatients, getAppointments, getPrescriptions, pushAuditLog, savePatient, sendPrescriptionToPharmacy } from "@/lib/storage";
import {
  ArrowLeft, CalendarDays, Phone, Stethoscope, ReceiptText,
  Clock3, UserCircle2, CalendarPlus, Edit3, Check, X,
  HeartPulse, Activity, Pill, Send,
} from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  Scheduled: "bg-cyan-100 text-cyan-700",
  "Checked In": "bg-indigo-100 text-indigo-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
  "No Show": "bg-amber-100 text-amber-700",
};

const PatientProfile = () => {
  const navigate = useNavigate();
  const { patientId = "" } = useParams();

  const [editingSymptoms, setEditingSymptoms] = useState(false);
  const [symptomsValue, setSymptomsValue] = useState("");
  const [dispatchedRx, setDispatchedRx] = useState<Record<string, boolean>>(() => {
    try {
      const raw = window.localStorage.getItem("medcore-pharmacy-dispatch");
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, { sent: boolean }>;
      return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, v.sent]));
    } catch { return {}; }
  });

  const patient = useMemo(
    () => getPatients().find((entry) => entry.id === patientId),
    [patientId],
  );

  const appointmentHistory = useMemo(
    () => getAppointments()
      .filter((entry) => entry.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [patientId],
  );

  const allPrescriptions = useMemo(
    () => [...prescriptions, ...getPrescriptions()]
      .filter((entry) => entry.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [patientId],
  );

  const latestPrescription = allPrescriptions[0];

  const billHistory = useMemo(
    () => bills.filter((entry) => entry.patientId === patientId),
    [patientId],
  );

  const pendingBills = billHistory.filter((b) => b.status === "Pending");
  const totalBilled = billHistory.reduce((sum, b) => sum + b.total, 0);

  const lastVisit = appointmentHistory.find((a) => a.status === "Completed");

  const startEditSymptoms = () => {
    setSymptomsValue(patient?.symptoms ?? "");
    setEditingSymptoms(true);
  };

  const saveSymptoms = () => {
    if (!patient) return;
    const updated = { ...patient, symptoms: symptomsValue.trim() };
    savePatient(updated);
    pushAuditLog("patient.symptoms.updated", `${patient.id} | ${patient.name} | ${symptomsValue.trim()}`);
    toast.success("Symptoms updated.");
    setEditingSymptoms(false);
    // Force re-render by navigating to same page
    navigate(0);
  };

  const handleSendToPharmacy = (rxId: string) => {
    sendPrescriptionToPharmacy(rxId);
    setDispatchedRx((prev) => ({ ...prev, [rxId]: true }));
    toast.success("Prescription sent to pharmacy.");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1200px] animate-fade-in-up space-y-4">
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 sm:p-6 shadow-[0_18px_45px_-20px_rgba(40,114,161,0.35)]">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/50 pb-4">
            <div>
              <h1 className="dashboard-title text-[#2872a1]">Patient Profile</h1>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">ID: {patientId}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient && (
                <>
                  <button
                    onClick={() => navigate(`/receptionist/appointment?patientId=${patientId}`)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2872a1] to-[#1a4d73] px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" /> Book Appointment
                  </button>
                  <button
                    onClick={() => navigate("/receptionist/billing")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-all"
                  >
                    <ReceiptText className="h-3.5 w-3.5" /> Billing
                  </button>
                </>
              )}
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/40 px-3.5 py-2 text-xs font-semibold text-[#2872a1] hover:bg-white/60 transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          </div>

          {!patient ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-700">
              Patient record not found for ID: {patientId}
            </div>
          ) : (
            <>
              {/* Quick stats */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total Visits", value: appointmentHistory.length, icon: <Activity className="h-4 w-4" />, color: "text-[#2872a1]" },
                  { label: "Prescriptions", value: allPrescriptions.length, icon: <Pill className="h-4 w-4" />, color: "text-indigo-700" },
                  { label: "Pending Bills", value: pendingBills.length, icon: <ReceiptText className="h-4 w-4" />, color: pendingBills.length > 0 ? "text-amber-700" : "text-emerald-700" },
                  { label: "Total Billed", value: `₹${totalBilled.toLocaleString()}`, icon: <HeartPulse className="h-4 w-4" />, color: "text-slate-700" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/50 bg-white/50 p-3">
                    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.color}`}>
                      {s.icon} {s.label}
                    </div>
                    <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
                {/* Left column */}
                <section className="space-y-4">
                  {/* Basic details */}
                  <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                    <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#2872a1]">Basic Details</h2>
                    <div className="mt-3 flex items-center gap-4 rounded-xl border border-white/40 bg-white/50 p-3">
                      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-white/60 bg-gradient-to-b from-[#5f9cc0]/20 to-[#2872a1]/10 shadow-md">
                        <UserCircle2 className="h-12 w-12 text-[#2872a1]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-900">{patient.name}</p>
                        <p className="text-xs text-slate-500">{patient.age}y · {patient.gender}</p>
                        {lastVisit && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Last visit: {lastVisit.date} with {lastVisit.doctor}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      {[
                        { label: "Phone", value: patient.phone, icon: <Phone className="h-3.5 w-3.5 text-[#2872a1]" /> },
                        { label: "Registered", value: patient.registeredAt, icon: <CalendarDays className="h-3.5 w-3.5 text-[#2872a1]" /> },
                        { label: "Age", value: `${patient.age} years` },
                        { label: "Gender", value: patient.gender },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{item.label}</p>
                          <p className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1">
                            {item.icon}{item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Editable symptoms */}
                    <div className="mt-2.5 rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">Symptoms</p>
                        {!editingSymptoms ? (
                          <button
                            onClick={startEditSymptoms}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2872a1] hover:underline"
                          >
                            <Edit3 className="h-3 w-3" /> Edit
                          </button>
                        ) : (
                          <div className="flex gap-1">
                            <button onClick={saveSymptoms} className="text-emerald-600 hover:text-emerald-700">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setEditingSymptoms(false)} className="text-rose-500 hover:text-rose-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {editingSymptoms ? (
                        <input
                          autoFocus
                          value={symptomsValue}
                          onChange={(e) => setSymptomsValue(e.target.value)}
                          className="mt-1 w-full rounded-md border border-[#2872a1]/30 bg-white px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2872a1]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{patient.symptoms}</p>
                      )}
                    </div>
                  </article>

                  {/* Appointment timeline */}
                  <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#2872a1]">
                        <Clock3 className="inline h-3.5 w-3.5 mr-1" /> Appointment History
                      </h2>
                      <span className="text-xs font-semibold text-slate-500">{appointmentHistory.length} visits</span>
                    </div>
                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                      {appointmentHistory.length === 0 && (
                        <p className="text-xs text-slate-500">No appointments recorded.</p>
                      )}
                      {appointmentHistory.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                          <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${statusColor[entry.status] ?? "bg-slate-300"}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800">{entry.doctor}</p>
                            <p className="text-[11px] text-slate-500">{entry.date} · {entry.time} · Token {entry.token}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor[entry.status] ?? "bg-slate-100 text-slate-700"}`}>
                            {entry.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>

                {/* Right column */}
                <section className="space-y-4">
                  {/* Billing */}
                  <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#2872a1]">
                        <ReceiptText className="inline h-3.5 w-3.5 mr-1" /> Billing
                      </h2>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${pendingBills.length > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {pendingBills.length > 0 ? `${pendingBills.length} pending` : "All clear"}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {billHistory.length === 0 && <p className="text-xs text-slate-500">No billing records.</p>}
                      {billHistory.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-800">{entry.id}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${entry.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {entry.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{entry.date}</p>
                          <p className="mt-0.5 text-sm font-bold text-slate-900">₹{entry.total.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </article>

                  {/* Prescriptions */}
                  <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#2872a1]">
                        <Stethoscope className="inline h-3.5 w-3.5 mr-1" /> Prescriptions
                      </h2>
                      <span className="text-xs font-semibold text-slate-500">{allPrescriptions.length} total</span>
                    </div>
                    {allPrescriptions.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">No prescriptions available.</p>
                    ) : (
                      <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                        {allPrescriptions.map((rx) => (
                          <div key={rx.id} className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-800">{rx.id}</p>
                              <p className="text-[10px] text-slate-500">{rx.date}</p>
                            </div>
                            <p className="text-[11px] text-slate-600">Dr. {rx.doctor.replace("Dr. ", "")}</p>
                            <div className="mt-1 space-y-0.5">
                              {rx.medicines.slice(0, 2).map((m) => (
                                <p key={m.name} className="text-[11px] text-slate-700">
                                  • {m.name} — {m.dosage}, {m.duration}
                                </p>
                              ))}
                              {rx.medicines.length > 2 && (
                                <p className="text-[10px] text-slate-400">+{rx.medicines.length - 2} more</p>
                              )}
                            </div>
                            {rx.notes && (
                              <p className="mt-1 text-[10px] text-slate-500 italic">Note: {rx.notes}</p>
                            )}
                            <div className="mt-2">
                              {dispatchedRx[rx.id] ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                  <Send className="h-2.5 w-2.5" /> Sent to Pharmacy
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSendToPharmacy(rx.id)}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#2872a1]/30 bg-[#2872a1]/5 px-2.5 py-1 text-[10px] font-semibold text-[#2872a1] hover:bg-[#2872a1]/10 transition-all"
                                >
                                  <Send className="h-2.5 w-2.5" /> Send to Pharmacy
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>

                  {/* Latest prescription highlight */}
                  {latestPrescription && (
                    <article className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">Latest Active Prescription</p>
                      <p className="mt-1 text-xs text-slate-600">{latestPrescription.date} · {latestPrescription.doctor}</p>
                      <div className="mt-2 space-y-1">
                        {latestPrescription.medicines.map((m) => (
                          <p key={m.name} className="text-xs text-slate-700">
                            <span className="font-semibold">{m.name}</span> — {m.dosage}, {m.timing}, {m.duration}
                          </p>
                        ))}
                      </div>
                    </article>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientProfile;
