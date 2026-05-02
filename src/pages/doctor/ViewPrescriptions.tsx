import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { doctors, prescriptions } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle2, Clock3, Truck, XCircle, Send } from "lucide-react";

interface StoredPrescription {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  medicines: { name: string; dosage: string; timing: string; duration: string }[];
  notes: string;
  date: string;
}

interface PharmacyDispatch { sent: boolean; sentAt?: string }
interface PharmacyWorkflow { acceptedAt?: string; dispensedAt?: string; rejectedAt?: string; rejectionReason?: string }

const PRESCRIPTIONS_STORAGE_KEY = "medcore-doctor-prescriptions";
const PHARMACY_DISPATCH_STORAGE_KEY = "medcore-pharmacy-dispatch";
const PHARMACY_WORKFLOW_STORAGE_KEY = "medcore-pharmacy-workflow";

const resolveDoctorFromEmail = (email: string | null) => {
  if (!email) return doctors[0];
  const localPart = email.split("@")[0].toLowerCase();
  const matched = doctors.find((doctor) => {
    const normalized = doctor.replace("Dr. ", "").toLowerCase();
    return normalized.split(" ").some((token) => localPart.includes(token));
  });
  return matched ?? doctors[0];
};

const ViewPrescriptions = () => {
  const { email } = useAuth();
  const location = useLocation();
  const activeDoctor = useMemo(() => resolveDoctorFromEmail(email), [email]);

  // Support ?patient=P-XXXX filter from SearchPatient
  const patientFilterFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("patient") ?? "";
  }, [location.search]);

  const [localPrescriptions] = useState<StoredPrescription[]>(() => {
    try {
      const raw = window.localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredPrescription[]) : [];
    } catch { return []; }
  });

  const [dispatchMap, setDispatchMap] = useState<Record<string, PharmacyDispatch>>(() => {
    try {
      const raw = window.localStorage.getItem(PHARMACY_DISPATCH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, PharmacyDispatch>) : {};
    } catch { return {}; }
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [patientFilter, setPatientFilter] = useState(patientFilterFromUrl);

  // Read pharmacy workflow for closed-loop status
  const pharmacyWorkflow = useMemo<Record<string, PharmacyWorkflow>>(() => {
    try {
      const raw = window.localStorage.getItem(PHARMACY_WORKFLOW_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, PharmacyWorkflow>) : {};
    } catch { return {}; }
  }, []);

  const myPrescriptions = useMemo(
    () => [...localPrescriptions, ...prescriptions]
      .filter((e) => {
        const matchDoctor = e.doctor === activeDoctor;
        const matchDate = (!dateFrom || e.date >= dateFrom) && (!dateTo || e.date <= dateTo);
        const matchPatient = !patientFilter || e.patientName.toLowerCase().includes(patientFilter.toLowerCase()) || e.patientId.toLowerCase().includes(patientFilter.toLowerCase());
        return matchDoctor && matchDate && matchPatient;
      })
      .sort((a, b) => b.date.localeCompare(a.date)),
    [activeDoctor, localPrescriptions, dateFrom, dateTo, patientFilter],
  );

  const sendToPharmacy = (prescriptionId: string) => {
    const updated = { ...dispatchMap, [prescriptionId]: { sent: true, sentAt: new Date().toISOString() } };
    setDispatchMap(updated);
    window.localStorage.setItem(PHARMACY_DISPATCH_STORAGE_KEY, JSON.stringify(updated));
    toast.success("Prescription forwarded to pharmacy.");
  };

  const getPharmacyStatus = (rxId: string) => {
    const dispatch = dispatchMap[rxId];
    const workflow = pharmacyWorkflow[rxId];
    if (!dispatch?.sent) return { label: "Not Sent", color: "bg-slate-100 text-slate-600", icon: <Clock3 className="h-3 w-3" /> };
    if (workflow?.dispensedAt) return { label: "Dispensed ✓", color: "bg-emerald-100 text-emerald-700", icon: <Truck className="h-3 w-3" /> };
    if (workflow?.rejectedAt) return { label: "Rejected", color: "bg-rose-100 text-rose-700", icon: <XCircle className="h-3 w-3" /> };
    if (workflow?.acceptedAt) return { label: "Accepted", color: "bg-indigo-100 text-indigo-700", icon: <CheckCircle2 className="h-3 w-3" /> };
    return { label: "Sent — Pending", color: "bg-amber-100 text-amber-700", icon: <Send className="h-3 w-3" /> };
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1100px] space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h1 className="dashboard-title">My Prescriptions</h1>
          <span className="rounded-full border border-white/50 bg-white/40 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {myPrescriptions.length} total
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            placeholder="Filter by patient name or ID..."
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="h-9 w-full sm:w-56 rounded-lg border border-slate-200 bg-white/80 px-3 text-xs text-slate-700 focus:outline-none focus:border-[#2872a1]"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">From</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white/80 px-2 text-xs text-slate-700 focus:outline-none focus:border-[#2872a1]" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white/80 px-2 text-xs text-slate-700 focus:outline-none focus:border-[#2872a1]" />
          </div>
          {(dateFrom || dateTo || patientFilter) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setPatientFilter(""); }}
              className="text-xs text-[#2872a1] hover:underline">Clear filters</button>
          )}
        </div>

        {myPrescriptions.length === 0 && (
          <div className="rounded-2xl border border-white/60 bg-white/70 p-8 text-center text-sm text-slate-500">
            No prescriptions found for {activeDoctor}.
          </div>
        )}

        <div className="space-y-4">
          {myPrescriptions.map((rx) => {
            const status = getPharmacyStatus(rx.id);
            const workflow = pharmacyWorkflow[rx.id];
            const isSent = dispatchMap[rx.id]?.sent;

            return (
              <div key={rx.id} className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{rx.patientName}
                      <span className="ml-2 text-xs font-normal text-slate-500">({rx.patientId})</span>
                    </p>
                    <p className="text-xs text-slate-500">{rx.id} · {rx.doctor} · {rx.date}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Pharmacy status badge — closed loop */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                    <span className="text-xs font-medium text-slate-400">{rx.id}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  {/* Medicines table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          <th className="px-3 py-2 text-left">Medicine</th>
                          <th className="px-3 py-2 text-left">Dosage</th>
                          <th className="px-3 py-2 text-left">Timing</th>
                          <th className="px-3 py-2 text-left">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rx.medicines.map((m, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 font-semibold text-slate-800">{m.name}</td>
                            <td className="px-3 py-2 text-slate-600">{m.dosage}</td>
                            <td className="px-3 py-2 text-slate-600">{m.timing}</td>
                            <td className="px-3 py-2 text-slate-600">{m.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rx.notes && (
                    <p className="text-sm text-slate-600"><span className="font-semibold">Notes:</span> {rx.notes}</p>
                  )}

                  {/* Pharmacy timeline */}
                  {isSent && (
                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-xs space-y-1">
                      <p className="font-semibold text-slate-600 mb-1.5">Pharmacy Timeline</p>
                      <p className="inline-flex items-center gap-1.5 text-amber-700">
                        <Send className="h-3 w-3" /> Sent: {dispatchMap[rx.id]?.sentAt ? new Date(dispatchMap[rx.id].sentAt!).toLocaleString() : "—"}
                      </p>
                      {workflow?.acceptedAt && (
                        <p className="inline-flex items-center gap-1.5 text-indigo-700 ml-4">
                          <CheckCircle2 className="h-3 w-3" /> Accepted: {new Date(workflow.acceptedAt).toLocaleString()}
                        </p>
                      )}
                      {workflow?.dispensedAt && (
                        <p className="inline-flex items-center gap-1.5 text-emerald-700 ml-4">
                          <Truck className="h-3 w-3" /> Dispensed: {new Date(workflow.dispensedAt).toLocaleString()}
                        </p>
                      )}
                      {workflow?.rejectedAt && (
                        <p className="inline-flex items-center gap-1.5 text-rose-700 ml-4">
                          <XCircle className="h-3 w-3" /> Rejected: {new Date(workflow.rejectedAt).toLocaleString()}
                          {workflow.rejectionReason && <span className="text-rose-600"> — {workflow.rejectionReason}</span>}
                        </p>
                      )}
                    </div>
                  )}

                  {!isSent && (
                    <Button type="button" size="sm" onClick={() => sendToPharmacy(rx.id)} className="inline-flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5" /> Send to Pharmacy
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewPrescriptions;
