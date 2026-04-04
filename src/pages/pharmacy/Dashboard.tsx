import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { prescriptions } from "@/data/mockData";
import { toast } from "sonner";
import { CheckCircle2, ClipboardList, Pill, Search, Truck } from "lucide-react";

interface StoredPrescription {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  medicines: { name: string; dosage: string; timing: string; duration: string }[];
  notes: string;
  date: string;
}

interface PharmacyDispatch {
  sent: boolean;
  sentAt?: string;
}

interface PharmacyWorkflow {
  acceptedAt?: string;
  dispensedAt?: string;
}

const PRESCRIPTIONS_STORAGE_KEY = "medcore-doctor-prescriptions";
const PHARMACY_DISPATCH_STORAGE_KEY = "medcore-pharmacy-dispatch";
const PHARMACY_WORKFLOW_STORAGE_KEY = "medcore-pharmacy-workflow";
const PHARMACY_HANDOVER_STORAGE_KEY = "medcore-pharmacy-handover-note";

const PharmacyDashboard = () => {
  const [query, setQuery] = useState("");
  const [handoverNote, setHandoverNote] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(PHARMACY_HANDOVER_STORAGE_KEY) ?? "";
  });
  const [lowStockItems, setLowStockItems] = useState([
    { name: "Ibuprofen 400mg", level: "Low", restockRequested: false },
    { name: "Amoxicillin 500mg", level: "Critical", restockRequested: false },
    { name: "Cetirizine 10mg", level: "Low", restockRequested: false },
  ]);

  const [localPrescriptions] = useState<StoredPrescription[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredPrescription[]) : [];
    } catch {
      return [];
    }
  });

  const [dispatchMap] = useState<Record<string, PharmacyDispatch>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(PHARMACY_DISPATCH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, PharmacyDispatch>) : {};
    } catch {
      return {};
    }
  });

  const [workflow, setWorkflow] = useState<Record<string, PharmacyWorkflow>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(PHARMACY_WORKFLOW_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, PharmacyWorkflow>) : {};
    } catch {
      return {};
    }
  });

  const incomingPrescriptions = useMemo(() => {
    const merged = [...localPrescriptions, ...prescriptions];
    const onlySent = merged.filter((entry) => dispatchMap[entry.id]?.sent);
    return onlySent.sort((a, b) => b.date.localeCompare(a.date));
  }, [dispatchMap, localPrescriptions]);

  const filteredPrescriptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return incomingPrescriptions;

    return incomingPrescriptions.filter((entry) =>
      [entry.id, entry.patientId, entry.patientName, entry.doctor].some((token) => token.toLowerCase().includes(term)),
    );
  }, [incomingPrescriptions, query]);

  const metrics = useMemo(() => {
    const total = incomingPrescriptions.length;
    const accepted = incomingPrescriptions.filter((entry) => workflow[entry.id]?.acceptedAt).length;
    const dispensed = incomingPrescriptions.filter((entry) => workflow[entry.id]?.dispensedAt).length;
    const pending = total - accepted;

    return { total, accepted, dispensed, pending };
  }, [incomingPrescriptions, workflow]);

  const updateWorkflow = (prescriptionId: string, patch: PharmacyWorkflow, successMessage: string) => {
    const updated = {
      ...workflow,
      [prescriptionId]: {
        ...workflow[prescriptionId],
        ...patch,
      },
    };

    setWorkflow(updated);
    window.localStorage.setItem(PHARMACY_WORKFLOW_STORAGE_KEY, JSON.stringify(updated));
    toast.success(successMessage);
  };

  const saveHandoverNote = () => {
    window.localStorage.setItem(PHARMACY_HANDOVER_STORAGE_KEY, handoverNote);
    toast.success("Pharmacy handover note saved.");
  };

  const requestRestock = (medicineName: string) => {
    setLowStockItems((prev) => prev.map((item) => (
      item.name === medicineName ? { ...item, restockRequested: true } : item
    )));
    toast.success(`Restock request sent for ${medicineName}.`);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1320px] space-y-5 animate-fade-in-up">
        <section className="rounded-3xl border border-white/70 bg-gradient-to-r from-[#1f5f85] via-[#2c759f] to-[#3e8ebc] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">Pharmacy Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Doctor-to-pharmacy prescription queue</h1>
          <p className="mt-2 text-sm text-white/85">Everything doctors send to pharmacy is listed here with action status.</p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-semibold text-slate-500">Incoming Queue</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.total}</p>
            <p className="mt-1 text-xs text-slate-600">Sent by doctors</p>
          </article>
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-semibold text-slate-500">Pending Verification</p>
            <p className="mt-2 text-3xl font-bold text-amber-700">{metrics.pending}</p>
            <p className="mt-1 text-xs text-slate-600">Not accepted yet</p>
          </article>
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-semibold text-slate-500">Accepted</p>
            <p className="mt-2 text-3xl font-bold text-indigo-700">{metrics.accepted}</p>
            <p className="mt-1 text-xs text-slate-600">Ready to dispense</p>
          </article>
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-semibold text-slate-500">Dispensed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{metrics.dispensed}</p>
            <p className="mt-1 text-xs text-slate-600">Completed handover</p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
            <h2 className="text-sm font-bold text-slate-900">Low Stock Radar</h2>
            <div className="mt-3 space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.name} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                    <p className={`text-[11px] font-semibold ${item.level === "Critical" ? "text-rose-600" : "text-amber-600"}`}>{item.level} stock</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={item.restockRequested}
                    onClick={() => requestRestock(item.name)}
                  >
                    {item.restockRequested ? "Requested" : "Request Restock"}
                  </Button>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
            <h2 className="text-sm font-bold text-slate-900">Shift Handover Note</h2>
            <textarea
              rows={5}
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              placeholder="Add pharmacy notes for next shift..."
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <Button type="button" onClick={saveHandoverNote} className="mt-2">Save Handover</Button>
          </article>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><ClipboardList className="h-4 w-4 text-[#2c759f]" /> Prescription Intake Window</h2>
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient, doctor, RX ID"
                className="pl-9"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filteredPrescriptions.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-600">
                No sent prescriptions found in pharmacy queue.
              </div>
            )}

            {filteredPrescriptions.map((entry) => {
              const state = workflow[entry.id];
              const isAccepted = Boolean(state?.acceptedAt);
              const isDispensed = Boolean(state?.dispensedAt);

              return (
                <article key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{entry.patientName} ({entry.patientId})</p>
                      <p className="text-xs text-slate-600">{entry.id} • Dr. {entry.doctor.replace("Dr. ", "")} • {entry.date}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDispensed ? "bg-emerald-100 text-emerald-700" : isAccepted ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}>
                        {isDispensed ? "Dispensed" : isAccepted ? "Accepted" : "Pending"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1">
                        <Pill className="h-3 w-3" /> {entry.medicines.length} medicines
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Medicines</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-700">
                      {entry.medicines.map((m, idx) => (
                        <li key={`${entry.id}-${idx}`}>
                          {m.name} - {m.dosage}, {m.timing}, {m.duration}
                        </li>
                      ))}
                    </ul>
                    {entry.notes ? <p className="mt-2 text-xs text-slate-600"><strong>Doctor note:</strong> {entry.notes}</p> : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isAccepted}
                      onClick={() => updateWorkflow(entry.id, { acceptedAt: new Date().toISOString() }, "Prescription accepted by pharmacy.")}
                      className="inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark Accepted
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!isAccepted || isDispensed}
                      onClick={() => updateWorkflow(entry.id, { dispensedAt: new Date().toISOString() }, "Medicines marked as dispensed.")}
                      className="inline-flex items-center gap-1"
                    >
                      <Truck className="h-4 w-4" /> Mark Dispensed
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default PharmacyDashboard;
