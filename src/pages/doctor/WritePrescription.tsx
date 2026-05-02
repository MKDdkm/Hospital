import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPatients, getPrescriptions, pushAuditLog, sendPrescriptionToPharmacy } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { doctors } from "@/data/mockData";
import { toast } from "sonner";
import { getClinicSettings } from "@/pages/admin/ClinicSettings";
import {
  Plus, Trash2, Search, Send, Printer, FilePlus,
  CheckCircle2, AlertTriangle, User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MedicineRow {
  name: string;
  dosage: string;
  timing: string;
  duration: string;
}

interface StoredPrescription {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  medicines: MedicineRow[];
  notes: string;
  date: string;
}

// ─── Common medicine suggestions ─────────────────────────────────────────────
const MEDICINE_SUGGESTIONS = [
  "Paracetamol 500mg", "Ibuprofen 400mg", "Amoxicillin 500mg",
  "Cetirizine 10mg", "Omeprazole 20mg", "Metformin 500mg",
  "Atorvastatin 10mg", "Azithromycin 500mg", "Pantoprazole 40mg",
  "Dolo 650mg", "Cefixime 200mg", "Levocetirizine 5mg",
  "Metronidazole 400mg", "Ciprofloxacin 500mg", "Ranitidine 150mg",
];

const TIMING_OPTIONS = [
  "Once daily", "Twice daily", "Thrice daily",
  "Before meals", "After meals", "Before bed",
  "Morning & Night", "Every 8 hours", "As needed",
];

const DURATION_OPTIONS = [
  "3 days", "5 days", "7 days", "10 days", "14 days",
  "1 month", "2 months", "3 months", "Ongoing",
];

const PRESCRIPTIONS_KEY = "medcore-doctor-prescriptions";

const resolveDoctorFromEmail = (email: string | null) => {
  if (!email) return doctors[0];
  const localPart = email.split("@")[0].toLowerCase();
  return doctors.find((d) => {
    const normalized = d.replace("Dr. ", "").toLowerCase();
    return normalized.split(" ").some((t) => localPart.includes(t));
  }) ?? doctors[0];
};

const emptyRow = (): MedicineRow => ({ name: "", dosage: "", timing: "After meals", duration: "5 days" });

// ─── Component ────────────────────────────────────────────────────────────────
const WritePrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = useAuth();
  const activeDoctor = useMemo(() => resolveDoctorFromEmail(email), [email]);

  // Pre-fill from URL params (from SearchPatient or Dashboard)
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const prefilledPatientId = urlParams.get("patientId") ?? "";
  const prefilledPatientName = urlParams.get("patientName") ?? "";

  const [patientSearch, setPatientSearch] = useState(
    prefilledPatientId ? `${prefilledPatientName} (${prefilledPatientId})` : ""
  );
  const [selectedPatientId, setSelectedPatientId] = useState(prefilledPatientId);
  const [showDropdown, setShowDropdown] = useState(false);
  const [medicines, setMedicines] = useState<MedicineRow[]>([emptyRow()]);
  const [notes, setNotes] = useState("");
  const [sendToPharmacyNow, setSendToPharmacyNow] = useState(true);
  const [saved, setSaved] = useState<StoredPrescription | null>(null);
  const [medicineSuggest, setMedicineSuggest] = useState<number | null>(null);

  const allPatients = useMemo(() => getPatients(), []);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q || selectedPatientId) return [];
    return allPatients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.phone.includes(q)
    ).slice(0, 8);
  }, [patientSearch, selectedPatientId, allPatients]);

  const selectedPatient = useMemo(
    () => allPatients.find((p) => p.id === selectedPatientId),
    [selectedPatientId, allPatients]
  );

  // Previous prescriptions for this patient
  const previousRx = useMemo(() => {
    if (!selectedPatientId) return [];
    return getPrescriptions().filter((rx) => rx.patientId === selectedPatientId).slice(0, 3);
  }, [selectedPatientId]);

  const addRow = () => setMedicines((prev) => [...prev, emptyRow()]);

  const removeRow = (idx: number) =>
    setMedicines((prev) => prev.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof MedicineRow, value: string) =>
    setMedicines((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedPatient) {
      toast.error("Please select a patient.");
      return;
    }
    const validMeds = medicines.filter((m) => m.name.trim());
    if (validMeds.length === 0) {
      toast.error("Add at least one medicine.");
      return;
    }

    const rx: StoredPrescription = {
      id: `RX-${Date.now().toString().slice(-6)}`,
      patientId: selectedPatientId,
      patientName: selectedPatient.name,
      doctor: activeDoctor,
      medicines: validMeds,
      notes: notes.trim(),
      date: new Date().toISOString().split("T")[0],
    };

    // Save to localStorage
    const existing = (() => {
      try {
        const raw = window.localStorage.getItem(PRESCRIPTIONS_KEY);
        return raw ? (JSON.parse(raw) as StoredPrescription[]) : [];
      } catch { return []; }
    })();
    window.localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify([rx, ...existing]));

    pushAuditLog("doctor.prescription.written", `${rx.id} | ${rx.patientName} | ${activeDoctor} | ${validMeds.length} medicines`);

    if (sendToPharmacyNow) {
      sendPrescriptionToPharmacy(rx.id);
    }

    setSaved(rx);
    toast.success(`Prescription ${rx.id} saved${sendToPharmacyNow ? " & sent to pharmacy" : ""}.`);
  };

  const printRx = (rx: StoredPrescription) => {
    const clinic = getClinicSettings();
    const win = window.open("", "_blank", "width=600,height=500");
    if (!win) return;
    const rows = rx.medicines.map((m) =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${m.name}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${m.dosage}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${m.timing}</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${m.duration}</td></tr>`
    ).join("");
    win.document.write(`<html><head><title>Prescription</title>
    <style>body{font-family:Arial,sans-serif;padding:28px;color:#0f172a;font-size:13px}
    .clinic-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #cbd5e1;padding-bottom:12px;margin-bottom:14px}
    .clinic-name{font-size:20px;font-weight:700;color:#1e5a80;margin-bottom:2px}
    .clinic-sub{font-size:11px;color:#64748b}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th{text-align:left;border-bottom:2px solid #cbd5e1;padding:6px 8px;font-size:11px;color:#64748b;text-transform:uppercase}
    .footer{margin-top:18px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px}
    .sig{margin-top:30px;text-align:right;font-size:12px}
    </style></head><body>
    <div class="clinic-header">
      <div>
        <div class="clinic-name">${clinic.name}</div>
        <div class="clinic-sub">${clinic.tagline}</div>
        <div class="clinic-sub">${clinic.address}${clinic.city ? ", " + clinic.city : ""}${clinic.pincode ? " — " + clinic.pincode : ""}</div>
        <div class="clinic-sub">${clinic.phone}${clinic.email ? " · " + clinic.email : ""}</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#64748b">
        <div>${clinic.workingDays}</div>
        <div>${clinic.openTime} – ${clinic.closeTime}</div>
        ${clinic.registrationNumber ? `<div>Reg: ${clinic.registrationNumber}</div>` : ""}
      </div>
    </div>
    <div style="margin-bottom:10px;font-size:12px;color:#64748b">Prescription — <strong>${rx.id}</strong> | Date: ${rx.date}</div>
    <div><strong>Patient:</strong> ${rx.patientName} (${rx.patientId})</div>
    <div><strong>Doctor:</strong> ${rx.doctor}</div>
    <table><thead><tr><th>Medicine</th><th>Dosage</th><th>Timing</th><th>Duration</th></tr></thead>
    <tbody>${rows}</tbody></table>
    ${rx.notes ? `<p style="margin-top:14px"><strong>Instructions:</strong> ${rx.notes}</p>` : ""}
    <div class="sig">____________________<br/>${rx.doctor}<br/><span style="font-size:10px;color:#94a3b8">Signature & Stamp</span></div>
    <div class="footer">${clinic.name} · ${clinic.phone} · This prescription is valid for 30 days. Keep medicines out of reach of children.</div>
    <script>window.onload=()=>{window.print()}</script></body></html>`);
    win.document.close();
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (saved) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl space-y-5 animate-fade-in-up">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-800">Prescription Saved</p>
                <p className="text-sm text-emerald-600">{saved.id} · {saved.date}</p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200/60 bg-white/70 p-4 space-y-1.5">
              <p className="text-sm font-semibold text-slate-800">{saved.patientName} <span className="text-xs font-normal text-slate-500">({saved.patientId})</span></p>
              <p className="text-xs text-slate-600">Doctor: {saved.doctor}</p>
              <div className="mt-2 space-y-1">
                {saved.medicines.map((m, i) => (
                  <p key={i} className="text-xs text-slate-700">• <strong>{m.name}</strong> — {m.dosage}, {m.timing}, {m.duration}</p>
                ))}
              </div>
              {saved.notes && <p className="text-xs text-slate-500 italic mt-1">Note: {saved.notes}</p>}
            </div>
            {sendToPharmacyNow && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                <Send className="h-3.5 w-3.5" /> Sent to pharmacy queue
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => printRx(saved)} variant="outline" className="inline-flex items-center gap-2">
                <Printer className="h-4 w-4" /> Print Prescription
              </Button>
              <Button onClick={() => { setSaved(null); setPatientSearch(""); setSelectedPatientId(""); setMedicines([emptyRow()]); setNotes(""); }} className="inline-flex items-center gap-2 bg-[#2872a1] hover:bg-[#1a4d73]">
                <FilePlus className="h-4 w-4" /> Write Another
              </Button>
              <Button variant="ghost" onClick={() => navigate("/doctor/prescriptions")} className="text-xs">
                View All Prescriptions →
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1000px] space-y-5 animate-fade-in-up">

        {/* Header */}
        <section className="rounded-3xl border border-white/70 bg-gradient-to-r from-[#1f5f85] via-[#2c759f] to-[#3e8ebc] p-5 text-white shadow-[0_25px_60px_-35px_rgba(18,53,78,0.75)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">Doctor Workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Write Prescription</h1>
          <p className="mt-1 text-sm text-white/80">{activeDoctor} · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </section>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
          {/* Left — main form */}
          <div className="space-y-5">

            {/* Patient selector */}
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-5 shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#2872a1] inline-flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Patient
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search patient by name, ID, or phone..."
                  value={patientSearch}
                  onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatientId(""); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-9"
                />
                {showDropdown && filteredPatients.length > 0 && (
                  <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                    {filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setPatientSearch(`${p.name} (${p.id})`);
                          setShowDropdown(false);
                        }}
                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors border-b last:border-0"
                      >
                        <p className="font-semibold text-slate-800">{p.name} <span className="text-xs text-slate-500">({p.id})</span></p>
                        <p className="text-xs text-slate-500">{p.phone} · {p.age}y · {p.symptoms}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedPatient && (
                <div className="mt-3 rounded-xl border border-[#2872a1]/20 bg-[#2872a1]/5 px-3 py-2.5">
                  <p className="text-sm font-bold text-slate-800">{selectedPatient.name}</p>
                  <p className="text-xs text-slate-500">{selectedPatient.id} · {selectedPatient.age}y · {selectedPatient.gender}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Chief complaint: {selectedPatient.symptoms}</p>
                </div>
              )}
            </div>

            {/* Medicines */}
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2872a1]">Medicines</p>
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#2872a1]/30 bg-[#2872a1]/5 px-3 py-1.5 text-xs font-semibold text-[#2872a1] hover:bg-[#2872a1]/10 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Medicine
                </button>
              </div>

              <div className="space-y-3">
                {medicines.map((row, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 w-5 shrink-0">#{idx + 1}</span>
                      <div className="relative flex-1">
                        <Input
                          placeholder="Medicine name (e.g. Paracetamol 500mg)"
                          value={row.name}
                          onChange={(e) => { updateRow(idx, "name", e.target.value); setMedicineSuggest(idx); }}
                          onFocus={() => setMedicineSuggest(idx)}
                          onBlur={() => setTimeout(() => setMedicineSuggest(null), 150)}
                          className="text-sm"
                        />
                        {medicineSuggest === idx && row.name.length > 0 && (
                          <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                            {MEDICINE_SUGGESTIONS.filter((s) => s.toLowerCase().includes(row.name.toLowerCase())).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onMouseDown={() => updateRow(idx, "name", s)}
                                className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 transition-colors border-b last:border-0 font-medium text-slate-700"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {medicines.length > 1 && (
                        <button type="button" onClick={() => removeRow(idx)} className="rounded-full border border-rose-200 bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 transition-colors shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-7">
                      <div>
                        <Label className="text-[10px] text-slate-500 mb-1 block">Dosage</Label>
                        <Input
                          placeholder="e.g. 1 tablet"
                          value={row.dosage}
                          onChange={(e) => updateRow(idx, "dosage", e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500 mb-1 block">Timing</Label>
                        <select
                          value={row.timing}
                          onChange={(e) => updateRow(idx, "timing", e.target.value)}
                          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-[#2872a1] focus:outline-none"
                        >
                          {TIMING_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500 mb-1 block">Duration</Label>
                        <select
                          value={row.duration}
                          onChange={(e) => updateRow(idx, "duration", e.target.value)}
                          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-[#2872a1] focus:outline-none"
                        >
                          {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-5 shadow-sm">
              <Label className="text-xs font-bold uppercase tracking-[0.12em] text-[#2872a1] mb-2 block">Doctor's Instructions</Label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions, dietary advice, follow-up date, precautions..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#2872a1] focus:outline-none resize-none"
              />
            </div>

            {/* Send to pharmacy toggle */}
            <label className="flex items-center gap-3 rounded-xl border border-[#2872a1]/20 bg-[#2872a1]/5 px-4 py-3 cursor-pointer hover:bg-[#2872a1]/10 transition-all">
              <input
                type="checkbox"
                checked={sendToPharmacyNow}
                onChange={(e) => setSendToPharmacyNow(e.target.checked)}
                className="rounded"
              />
              <div>
                <p className="text-sm font-semibold text-[#2872a1]">Send to Pharmacy immediately</p>
                <p className="text-xs text-slate-500">Prescription will appear in pharmacy queue right away</p>
              </div>
              <Send className="h-4 w-4 text-[#2872a1] ml-auto" />
            </label>

            <Button type="submit" className="w-full bg-gradient-to-r from-[#2872a1] to-[#1a4d73] py-3 text-sm font-bold inline-flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Save Prescription
            </Button>
          </div>

          {/* Right — patient history sidebar */}
          <div className="space-y-4">
            {selectedPatient ? (
              <>
                <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2872a1] mb-3">Patient Info</p>
                  <div className="space-y-2">
                    {[
                      { label: "Name", value: selectedPatient.name },
                      { label: "Age / Gender", value: `${selectedPatient.age}y · ${selectedPatient.gender}` },
                      { label: "Phone", value: selectedPatient.phone },
                      { label: "Symptoms", value: selectedPatient.symptoms },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                        <span className="text-xs text-slate-500">{item.label}</span>
                        <span className="text-xs font-semibold text-slate-800 text-right max-w-[55%] truncate">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {previousRx.length > 0 && (
                  <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2872a1] mb-3">Previous Prescriptions</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {previousRx.map((rx) => (
                        <div key={rx.id} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-[#2872a1]">{rx.id}</span>
                            <span className="text-[10px] text-slate-400">{rx.date}</span>
                          </div>
                          {rx.medicines.map((m, i) => (
                            <p key={i} className="text-[11px] text-slate-600">• {m.name} — {m.dosage}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center">
                <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Select a patient to see their info and history</p>
              </div>
            )}

            {/* Quick tips */}
            <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4">
              <p className="text-xs font-bold text-amber-800 mb-2 inline-flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Quick Tips
              </p>
              <ul className="space-y-1 text-[11px] text-amber-700">
                <li>• Type medicine name to get suggestions</li>
                <li>• Check previous Rx to avoid duplicates</li>
                <li>• Always add dosage and duration</li>
                <li>• Use instructions for special cases</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default WritePrescription;
