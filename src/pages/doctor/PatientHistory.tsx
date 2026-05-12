import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPatients, getAppointments, getPrescriptions, pushAuditLog, getVitals, saveVitals, type VitalsRecord } from "@/lib/storage";
import { prescriptions as mockPrescriptions } from "@/data/mockData";
import { Search, StickyNote, Check, X, Activity, HeartPulse, Thermometer, Weight, Wind, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const DIAGNOSIS_NOTES_KEY = "medcore-doctor-diagnosis-notes";
type DiagnosisNotes = Record<string, string>;

const emptyVitals = (patientId: string, appointmentId?: string): VitalsRecord => ({
  id: `VT-${Date.now()}`,
  patientId,
  appointmentId,
  recordedAt: new Date().toISOString(),
  bp: "", pulse: "", temp: "", weight: "", spo2: "", notes: "",
});

const VitalBadge = ({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: React.ReactNode }) => (
  <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-3 py-2 min-w-[72px]">
    <span className="text-[#2563eb] mb-0.5">{icon}</span>
    <p className="text-sm font-bold text-slate-800">{value || "—"}<span className="text-[10px] font-normal text-slate-400 ml-0.5">{value ? unit : ""}</span></p>
    <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
  </div>
);

const PatientHistory = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingNote, setEditingNote] = useState<{ apptId: string; value: string } | null>(null);
  const [vitalsModal, setVitalsModal] = useState<{ patientId: string; appointmentId?: string } | null>(null);
  const [vitalsForm, setVitalsForm] = useState<VitalsRecord | null>(null);

  const [diagnosisNotes, setDiagnosisNotes] = useState<DiagnosisNotes>(() => {
    try {
      const raw = window.localStorage.getItem(DIAGNOSIS_NOTES_KEY);
      return raw ? (JSON.parse(raw) as DiagnosisNotes) : {};
    } catch { return {}; }
  });

  const [allVitals, setAllVitals] = useState<VitalsRecord[]>(() => getVitals());

  const allPatients = useMemo(() => getPatients(), []);
  const allAppointments = useMemo(() => getAppointments(), []);
  const allPrescriptions = useMemo(() => [...mockPrescriptions, ...getPrescriptions()], []);

  const saveNote = (apptId: string, note: string) => {
    const updated = { ...diagnosisNotes, [apptId]: note };
    setDiagnosisNotes(updated);
    window.localStorage.setItem(DIAGNOSIS_NOTES_KEY, JSON.stringify(updated));
    pushAuditLog("doctor.diagnosis.noted", `Appointment ${apptId} — note saved`);
    toast.success("Diagnosis note saved.");
    setEditingNote(null);
  };

  const openVitalsModal = (patientId: string, appointmentId?: string) => {
    setVitalsForm(emptyVitals(patientId, appointmentId));
    setVitalsModal({ patientId, appointmentId });
  };

  const handleSaveVitals = () => {
    if (!vitalsForm) return;
    saveVitals(vitalsForm);
    setAllVitals(getVitals());
    pushAuditLog("doctor.vitals.recorded", `${vitalsForm.patientId} | BP:${vitalsForm.bp} P:${vitalsForm.pulse} T:${vitalsForm.temp}`);
    toast.success("Vitals recorded.");
    setVitalsModal(null);
    setVitalsForm(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPatients.slice(0, 10);
    return allPatients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [allPatients, query]);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1100px] space-y-5 animate-fade-in-up">

        {/* Header */}
        <section className="rounded-3xl border border-white/70 bg-gradient-to-r from-[#1f5f85] via-[#3b82f6] to-blue-400 p-5 text-white shadow-[0_25px_60px_-35px_rgba(18,53,78,0.75)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">Doctor Workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Patient History & Vitals</h1>
          <p className="mt-1 text-sm text-white/80">Search patients · Record vitals · Add diagnosis notes</p>
        </section>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by name or ID..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Date:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:border-[#2563eb]" />
            <span className="text-xs text-slate-400">–</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:border-[#2563eb]" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-[#2563eb] hover:underline">Clear</button>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {filtered.length === 0 && <p className="text-sm text-slate-500">No patients found.</p>}

          {filtered.map((p) => {
            let patientAppts = allAppointments.filter((a) => a.patientId === p.id);
            if (dateFrom) patientAppts = patientAppts.filter((a) => a.date >= dateFrom);
            if (dateTo) patientAppts = patientAppts.filter((a) => a.date <= dateTo);
            const patientRx = allPrescriptions.filter((rx) => rx.patientId === p.id);
            const patientVitals = allVitals.filter((v) => v.patientId === p.id);
            const latestVitals = patientVitals[0];

            return (
              <div key={p.id} className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-sm overflow-hidden">

                {/* Patient header */}
                <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{p.name}
                        <span className="ml-2 text-xs font-normal text-slate-500">{p.id} · {p.age}y · {p.gender}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Chief complaint: {p.symptoms}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openVitalsModal(p.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#2563eb]/30 bg-[#2563eb]/5 px-3 py-1.5 text-xs font-semibold text-[#2563eb] hover:bg-[#2563eb]/10 transition-all"
                      >
                        <Activity className="h-3.5 w-3.5" /> Record Vitals
                      </button>
                      <button
                        onClick={() => navigate(`/doctor/write-rx?patientId=${p.id}&patientName=${encodeURIComponent(p.name)}`)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" /> Write Rx
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">

                  {/* Latest vitals strip */}
                  {latestVitals && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-2 inline-flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-[#2563eb]" /> Latest Vitals
                        <span className="font-normal text-slate-400 normal-case tracking-normal">— {new Date(latestVitals.recordedAt).toLocaleString()}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <VitalBadge label="BP" value={latestVitals.bp} unit="mmHg" icon={<HeartPulse className="h-3.5 w-3.5" />} />
                        <VitalBadge label="Pulse" value={latestVitals.pulse} unit="bpm" icon={<Activity className="h-3.5 w-3.5" />} />
                        <VitalBadge label="Temp" value={latestVitals.temp} unit="°C" icon={<Thermometer className="h-3.5 w-3.5" />} />
                        <VitalBadge label="Weight" value={latestVitals.weight} unit="kg" icon={<Weight className="h-3.5 w-3.5" />} />
                        <VitalBadge label="SpO₂" value={latestVitals.spo2} unit="%" icon={<Wind className="h-3.5 w-3.5" />} />
                      </div>
                      {latestVitals.notes && (
                        <p className="mt-2 text-xs text-slate-500 italic border-l-2 border-[#2563eb]/30 pl-2">{latestVitals.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Appointments */}
                  {patientAppts.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Appointments ({patientAppts.length})</p>
                      <div className="space-y-2">
                        {patientAppts.map((a) => (
                          <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-slate-500">{a.date}</span>
                                <span className="font-semibold text-slate-700">{a.doctor}</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  a.status === "Completed" ? "bg-emerald-100 text-emerald-700"
                                  : a.status === "Checked In" ? "bg-indigo-100 text-indigo-700"
                                  : "bg-slate-100 text-slate-600"
                                }`}>{a.status}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => openVitalsModal(p.id, a.id)}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#2563eb]/20 bg-[#2563eb]/5 px-2.5 py-1 text-[11px] font-semibold text-[#2563eb] hover:bg-[#2563eb]/10 transition-colors"
                                >
                                  <Activity className="h-3 w-3" /> Vitals
                                </button>
                                <button
                                  onClick={() => setEditingNote({ apptId: a.id, value: diagnosisNotes[a.id] ?? "" })}
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                  <StickyNote className="h-3 w-3" />
                                  {diagnosisNotes[a.id] ? "Edit note" : "Add note"}
                                </button>
                              </div>
                            </div>
                            {diagnosisNotes[a.id] && editingNote?.apptId !== a.id && (
                              <p className="mt-1.5 text-xs text-slate-600 italic border-l-2 border-[#2563eb]/30 pl-2">{diagnosisNotes[a.id]}</p>
                            )}
                            {editingNote?.apptId === a.id && (
                              <div className="mt-2 flex gap-2">
                                <input
                                  autoFocus
                                  value={editingNote.value}
                                  onChange={(e) => setEditingNote({ ...editingNote, value: e.target.value })}
                                  placeholder="Diagnosis, observations, follow-up instructions..."
                                  className="flex-1 rounded-lg border border-[#2563eb]/30 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#2563eb]"
                                />
                                <button onClick={() => saveNote(a.id, editingNote.value)} className="rounded-lg bg-emerald-500 p-1.5 text-white hover:bg-emerald-600">
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setEditingNote(null)} className="rounded-lg bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prescriptions */}
                  {patientRx.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Prescriptions ({patientRx.length})</p>
                      <div className="space-y-1.5">
                        {patientRx.map((rx) => (
                          <div key={rx.id} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-[#2563eb]">{rx.id}</span>
                              <span className="mx-2 text-slate-300">·</span>
                              <span className="text-slate-500">{rx.date}</span>
                              <span className="mx-2 text-slate-300">·</span>
                              <span className="font-semibold text-slate-700">{rx.medicines.map((m) => m.name).join(", ")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {patientAppts.length === 0 && patientRx.length === 0 && !latestVitals && (
                    <p className="text-sm text-slate-500">No history available{(dateFrom || dateTo) ? " in this date range" : ""}.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Vitals Modal ── */}
      {vitalsModal && vitalsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/60 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 inline-flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#2563eb]" /> Record Vitals
              </h3>
              <button onClick={() => setVitalsModal(null)} className="rounded-full p-1.5 hover:bg-slate-100 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { field: "bp" as const, label: "Blood Pressure", placeholder: "120/80", unit: "mmHg", icon: <HeartPulse className="h-3.5 w-3.5" /> },
                { field: "pulse" as const, label: "Pulse Rate", placeholder: "72", unit: "bpm", icon: <Activity className="h-3.5 w-3.5" /> },
                { field: "temp" as const, label: "Temperature", placeholder: "98.6", unit: "°F/°C", icon: <Thermometer className="h-3.5 w-3.5" /> },
                { field: "weight" as const, label: "Weight", placeholder: "65", unit: "kg", icon: <Weight className="h-3.5 w-3.5" /> },
                { field: "spo2" as const, label: "SpO₂", placeholder: "98", unit: "%", icon: <Wind className="h-3.5 w-3.5" /> },
              ].map(({ field, label, placeholder, unit, icon }) => (
                <div key={field} className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] flex items-center gap-1">
                    {icon} {label}
                  </label>
                  <div className="relative">
                    <input
                      value={vitalsForm[field]}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, [field]: e.target.value })}
                      placeholder={placeholder}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-sm font-semibold text-slate-800 focus:border-[#2563eb] focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Notes</label>
              <input
                value={vitalsForm.notes}
                onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                placeholder="Any observations, complaints, or remarks..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-[#2563eb] focus:outline-none"
              />
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setVitalsModal(null)}>Cancel</Button>
              <Button onClick={handleSaveVitals} className="bg-[#2563eb] hover:bg-[#1d4ed8] inline-flex items-center gap-2">
                <Check className="h-4 w-4" /> Save Vitals
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientHistory;
