import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { prescriptions } from "@/data/mockData";
import { toast } from "sonner";
import { saveLiveBill, getLiveBills } from "@/lib/storage";
import {
  CheckCircle2, ClipboardList, Pill, Search, Truck,
  AlertTriangle, Package, BarChart3, Printer,
  RefreshCcw, Clock3, XCircle, Plus, Minus,
  Download, BellRing, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
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
interface PharmacyWorkflow { acceptedAt?: string; dispensedAt?: string; rejectedAt?: string; rejectionReason?: string; substitutionNote?: string }

interface StockItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  minQty: number;
  unit: string;
  expiryDate: string;
  batchNo: string;
  restockRequested: boolean;
}

interface DispenseLog {
  id: string;
  rxId: string;
  patientName: string;
  doctor: string;
  medicines: string[];
  dispensedAt: string;
  dispensedBy: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRESCRIPTIONS_KEY = "medcore-doctor-prescriptions";
const DISPATCH_KEY = "medcore-pharmacy-dispatch";
const WORKFLOW_KEY = "medcore-pharmacy-workflow";
const STOCK_KEY = "medcore-pharmacy-stock";
const DISPENSE_LOG_KEY = "medcore-pharmacy-dispense-log";

const DEFAULT_STOCK: StockItem[] = [
  { id: "S001", name: "Ibuprofen 400mg", category: "Analgesic", qty: 12, minQty: 50, unit: "Tabs", expiryDate: "2026-12-31", batchNo: "B2024-01", restockRequested: false },
  { id: "S002", name: "Amoxicillin 500mg", category: "Antibiotic", qty: 5, minQty: 30, unit: "Caps", expiryDate: "2026-08-15", batchNo: "B2024-02", restockRequested: false },
  { id: "S003", name: "Cetirizine 10mg", category: "Antihistamine", qty: 18, minQty: 40, unit: "Tabs", expiryDate: "2027-03-20", batchNo: "B2024-03", restockRequested: false },
  { id: "S004", name: "Paracetamol 500mg", category: "Analgesic", qty: 120, minQty: 100, unit: "Tabs", expiryDate: "2027-06-30", batchNo: "B2024-04", restockRequested: false },
  { id: "S005", name: "Omeprazole 20mg", category: "Antacid", qty: 45, minQty: 30, unit: "Caps", expiryDate: "2026-11-10", batchNo: "B2024-05", restockRequested: false },
  { id: "S006", name: "Metformin 500mg", category: "Antidiabetic", qty: 8, minQty: 60, unit: "Tabs", expiryDate: "2027-01-15", batchNo: "B2024-06", restockRequested: false },
  { id: "S007", name: "Atorvastatin 10mg", category: "Statin", qty: 60, minQty: 40, unit: "Tabs", expiryDate: "2027-09-01", batchNo: "B2024-07", restockRequested: false },
  { id: "S008", name: "Muscle Relaxant", category: "Muscle Relaxant", qty: 22, minQty: 25, unit: "Tabs", expiryDate: "2026-07-20", batchNo: "B2024-08", restockRequested: false },
];

// Drug interaction pairs (simplified)
const INTERACTIONS: [string, string, string][] = [
  ["Ibuprofen", "Metformin", "NSAIDs may reduce Metformin efficacy — monitor blood glucose"],
  ["Ibuprofen", "Atorvastatin", "Increased risk of renal impairment — use with caution"],
  ["Amoxicillin", "Metformin", "Antibiotics may alter gut flora affecting Metformin absorption"],
];

function checkInteractions(medicines: { name: string }[]): string[] {
  const names = medicines.map((m) => m.name.toLowerCase());
  const flags: string[] = [];
  for (const [a, b, msg] of INTERACTIONS) {
    if (names.some((n) => n.includes(a.toLowerCase())) && names.some((n) => n.includes(b.toLowerCase()))) {
      flags.push(msg);
    }
  }
  return flags;
}

function getStockLevel(item: StockItem): "critical" | "low" | "ok" {
  if (item.qty <= item.minQty * 0.2) return "critical";
  if (item.qty < item.minQty) return "low";
  return "ok";
}

function isExpiringSoon(expiryDate: string): boolean {
  const exp = new Date(expiryDate);
  const diff = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 90;
}

type Tab = "queue" | "stock" | "history";

// ─── Component ────────────────────────────────────────────────────────────────
const PharmacyDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Accepted" | "Dispensed" | "Rejected">("All");
  const [expandedRx, setExpandedRx] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ id: string; reason: string } | null>(null);
  const [substitutionModal, setSubstitutionModal] = useState<{ id: string; note: string } | null>(null);

  const [localPrescriptions] = useState<StoredPrescription[]>(() => {
    try {
      const raw = window.localStorage.getItem(PRESCRIPTIONS_KEY);
      return raw ? (JSON.parse(raw) as StoredPrescription[]) : [];
    } catch { return []; }
  });

  const [dispatchMap] = useState<Record<string, PharmacyDispatch>>(() => {
    try {
      const raw = window.localStorage.getItem(DISPATCH_KEY);
      return raw ? (JSON.parse(raw) as Record<string, PharmacyDispatch>) : {};
    } catch { return {}; }
  });

  const [workflow, setWorkflow] = useState<Record<string, PharmacyWorkflow>>(() => {
    try {
      const raw = window.localStorage.getItem(WORKFLOW_KEY);
      return raw ? (JSON.parse(raw) as Record<string, PharmacyWorkflow>) : {};
    } catch { return {}; }
  });

  const [stock, setStock] = useState<StockItem[]>(() => {
    try {
      const raw = window.localStorage.getItem(STOCK_KEY);
      return raw ? (JSON.parse(raw) as StockItem[]) : DEFAULT_STOCK;
    } catch { return DEFAULT_STOCK; }
  });

  const [dispenseLog, setDispenseLog] = useState<DispenseLog[]>(() => {
    try {
      const raw = window.localStorage.getItem(DISPENSE_LOG_KEY);
      return raw ? (JSON.parse(raw) as DispenseLog[]) : [];
    } catch { return []; }
  });

  const [addStockForm, setAddStockForm] = useState({ name: "", category: "", qty: "", minQty: "", unit: "Tabs", expiryDate: "", batchNo: "" });
  const [showAddStock, setShowAddStock] = useState(false);

  // ── Derived data ──────────────────────────────────────────────────────────
  const incomingPrescriptions = useMemo(() => {
    const merged = [...localPrescriptions, ...prescriptions];
    return merged
      .filter((e) => dispatchMap[e.id]?.sent)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dispatchMap, localPrescriptions]);

  const filteredPrescriptions = useMemo(() => {
    let list = incomingPrescriptions;
    const term = query.trim().toLowerCase();
    if (term) {
      list = list.filter((e) =>
        [e.id, e.patientId, e.patientName, e.doctor].some((t) => t.toLowerCase().includes(term))
      );
    }
    if (statusFilter !== "All") {
      list = list.filter((e) => {
        const w = workflow[e.id];
        if (statusFilter === "Dispensed") return Boolean(w?.dispensedAt);
        if (statusFilter === "Accepted") return Boolean(w?.acceptedAt) && !w?.dispensedAt;
        if (statusFilter === "Rejected") return Boolean(w?.rejectedAt);
        return !w?.acceptedAt && !w?.rejectedAt;
      });
    }
    return list;
  }, [incomingPrescriptions, query, statusFilter, workflow]);

  const metrics = useMemo(() => {
    const total = incomingPrescriptions.length;
    const accepted = incomingPrescriptions.filter((e) => workflow[e.id]?.acceptedAt && !workflow[e.id]?.dispensedAt).length;
    const dispensed = incomingPrescriptions.filter((e) => workflow[e.id]?.dispensedAt).length;
    const rejected = incomingPrescriptions.filter((e) => workflow[e.id]?.rejectedAt).length;
    const pending = total - accepted - dispensed - rejected;
    const avgTurnaround = dispenseLog.length > 0 ? "~14 min" : "N/A";
    return { total, accepted, dispensed, rejected, pending, avgTurnaround };
  }, [incomingPrescriptions, workflow, dispenseLog]);

  const stockAlerts = useMemo(() =>
    stock.filter((s) => getStockLevel(s) !== "ok" || isExpiringSoon(s.expiryDate)),
    [stock]
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  const saveWorkflow = (updated: Record<string, PharmacyWorkflow>) => {
    setWorkflow(updated);
    window.localStorage.setItem(WORKFLOW_KEY, JSON.stringify(updated));
  };

  const acceptRx = (id: string) => {
    saveWorkflow({ ...workflow, [id]: { ...workflow[id], acceptedAt: new Date().toISOString() } });
    toast.success("Prescription accepted.");
  };

  const rejectRx = (id: string, reason: string) => {
    saveWorkflow({ ...workflow, [id]: { ...workflow[id], rejectedAt: new Date().toISOString(), rejectionReason: reason } });
    setRejectionModal(null);
    toast.error("Prescription rejected.");
  };

  const dispenseRx = (entry: StoredPrescription) => {
    const updated = { ...workflow, [entry.id]: { ...workflow[entry.id], dispensedAt: new Date().toISOString() } };
    saveWorkflow(updated);

    // Deduct stock for matched medicines
    setStock((prev) => {
      const next = prev.map((s) => {
        const matched = entry.medicines.some((m) => m.name.toLowerCase().includes(s.name.split(" ")[0].toLowerCase()));
        return matched ? { ...s, qty: Math.max(0, s.qty - 1) } : s;
      });
      window.localStorage.setItem(STOCK_KEY, JSON.stringify(next));
      return next;
    });

    // ── Add medicine charges to patient's bill ────────────────────────────
    const MEDICINE_UNIT_PRICE = 50; // default ₹50 per medicine line
    const medicineItems = entry.medicines.map((m) => ({
      description: `${m.name} (${m.dosage}, ${m.duration})`,
      amount: MEDICINE_UNIT_PRICE,
    }));
    const medicineTotal = medicineItems.reduce((s, i) => s + i.amount, 0);

    // Find existing bill for this patient or create new one
    const existingBills = getLiveBills();
    const existingBill = existingBills.find(
      (b) => b.patientId === entry.patientId && b.status !== "Paid"
    );

    if (existingBill) {
      // Append medicine items to existing bill
      const updatedBill = {
        ...existingBill,
        items: [...existingBill.items, ...medicineItems],
        total: existingBill.total + medicineTotal,
      };
      saveLiveBill(updatedBill);
    } else {
      // Create new pharmacy bill
      saveLiveBill({
        id: `LB-${Date.now().toString().slice(-7)}`,
        patientId: entry.patientId,
        patientName: entry.patientName,
        doctor: entry.doctor,
        items: medicineItems,
        total: medicineTotal,
        date: new Date().toISOString().split("T")[0],
        status: "Pending",
        createdAt: new Date().toISOString(),
      });
    }

    // Add to dispense log
    const log: DispenseLog = {
      id: `DL-${Date.now()}`,
      rxId: entry.id,
      patientName: entry.patientName,
      doctor: entry.doctor,
      medicines: entry.medicines.map((m) => m.name),
      dispensedAt: new Date().toISOString(),
      dispensedBy: "Pharmacy Desk",
    };
    setDispenseLog((prev) => {
      const next = [log, ...prev].slice(0, 50);
      window.localStorage.setItem(DISPENSE_LOG_KEY, JSON.stringify(next));
      return next;
    });

    toast.success(`Dispensed & ₹${medicineTotal} added to patient bill.`);
  };

  const saveSubstitution = (id: string, note: string) => {
    saveWorkflow({ ...workflow, [id]: { ...workflow[id], substitutionNote: note } });
    setSubstitutionModal(null);
    toast.success("Substitution note saved.");
  };

  const updateStock = (id: string, delta: number) => {
    setStock((prev) => {
      const next = prev.map((s) => s.id === id ? { ...s, qty: Math.max(0, s.qty + delta) } : s);
      window.localStorage.setItem(STOCK_KEY, JSON.stringify(next));
      return next;
    });
  };

  const requestRestock = (id: string) => {
    setStock((prev) => {
      const next = prev.map((s) => s.id === id ? { ...s, restockRequested: true } : s);
      window.localStorage.setItem(STOCK_KEY, JSON.stringify(next));
      return next;
    });
    toast.success("Restock request sent.");
  };

  const addStockItem = () => {
    if (!addStockForm.name.trim() || !addStockForm.qty || !addStockForm.expiryDate) {
      toast.error("Name, quantity and expiry date are required.");
      return;
    }
    const newItem: StockItem = {
      id: `S${Date.now().toString().slice(-4)}`,
      name: addStockForm.name.trim(),
      category: addStockForm.category.trim() || "General",
      qty: Math.max(0, Number(addStockForm.qty)),
      minQty: Math.max(0, Number(addStockForm.minQty) || 20),
      unit: addStockForm.unit,
      expiryDate: addStockForm.expiryDate,
      batchNo: addStockForm.batchNo.trim() || `B${Date.now().toString().slice(-6)}`,
      restockRequested: false,
    };
    setStock((prev) => {
      const next = [...prev, newItem];
      window.localStorage.setItem(STOCK_KEY, JSON.stringify(next));
      return next;
    });
    setAddStockForm({ name: "", category: "", qty: "", minQty: "", unit: "Tabs", expiryDate: "", batchNo: "" });
    setShowAddStock(false);
    toast.success(`${newItem.name} added to inventory.`);
  };

  const printLabel = (entry: StoredPrescription) => {
    const win = window.open("", "_blank", "width=480,height=400");
    if (!win) return;
    const rows = entry.medicines.map((m) =>
      `<tr><td style="padding:4px 0;border-bottom:1px solid #e5e7eb">${m.name}</td><td style="padding:4px 8px;border-bottom:1px solid #e5e7eb">${m.dosage}</td><td style="padding:4px 0;border-bottom:1px solid #e5e7eb">${m.timing}</td><td style="padding:4px 0;border-bottom:1px solid #e5e7eb">${m.duration}</td></tr>`
    ).join("");
    win.document.write(`<html><head><title>Dispense Label</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#0f172a;font-size:13px}
    .header{font-size:16px;font-weight:700;color:#1e5a80;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th{text-align:left;border-bottom:2px solid #cbd5e1;padding:4px 0;font-size:11px;color:#64748b}
    .footer{margin-top:14px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
    </style></head><body>
    <div class="header">MedCore HMS — Dispense Label</div>
    <div>RX: ${entry.id} &nbsp;|&nbsp; Date: ${entry.date}</div>
    <div>Patient: <strong>${entry.patientName}</strong> (${entry.patientId})</div>
    <div>Doctor: ${entry.doctor}</div>
    <table><thead><tr><th>Medicine</th><th>Dosage</th><th>Timing</th><th>Duration</th></tr></thead>
    <tbody>${rows}</tbody></table>
    ${entry.notes ? `<p style="margin-top:10px;font-size:12px"><strong>Note:</strong> ${entry.notes}</p>` : ""}
    <div class="footer">Dispensed by MedCore Pharmacy &copy; 2026 — Keep medicines out of reach of children.</div>
    <script>window.onload=()=>{window.print()}</script></body></html>`);
    win.document.close();
  };

  const exportDispenseLog = () => {
    const rows = dispenseLog.map((l) => [l.id, l.rxId, l.patientName, l.doctor, l.medicines.join("; "), new Date(l.dispensedAt).toLocaleString(), l.dispensedBy]);
    const csv = [["Log ID", "RX ID", "Patient", "Doctor", "Medicines", "Dispensed At", "Dispensed By"], ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pharmacy-dispense-log-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success("Dispense log exported.");
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "queue", label: "Prescription Queue", icon: <ClipboardList className="h-4 w-4" /> },
    { id: "stock", label: "Stock Manager", icon: <Package className="h-4 w-4" /> },
    { id: "history", label: "Dispense History", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1320px] space-y-5 animate-fade-in-up">

        {/* ── Header ── */}
        <section className="rounded-3xl border border-white/70 bg-gradient-to-r from-[#1f5f85] via-[#2c759f] to-[#3e8ebc] p-5 text-white shadow-[0_25px_60px_-35px_rgba(18,53,78,0.75)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">Pharmacy Operations</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Pharmacy Command Center</h1>
              <p className="mt-1 text-sm text-white/80">Prescriptions · Stock · Dispense history · Handover</p>
            </div>
            {stockAlerts.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 backdrop-blur-md">
                <BellRing className="h-4 w-4 text-amber-300 animate-pulse" />
                <span className="text-sm font-semibold text-white">{stockAlerts.length} stock alert{stockAlerts.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </section>

        {/* ── Metrics bar ── */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Total Rx", value: metrics.total, color: "text-slate-900" },
            { label: "Pending", value: metrics.pending, color: "text-amber-700" },
            { label: "Accepted", value: metrics.accepted, color: "text-indigo-700" },
            { label: "Dispensed", value: metrics.dispensed, color: "text-emerald-700" },
            { label: "Rejected", value: metrics.rejected, color: "text-rose-700" },
            { label: "Avg Turnaround", value: metrics.avgTurnaround, color: "text-[#2c759f]" },
          ].map((m) => (
            <article key={m.label} className="rounded-2xl border border-white/60 bg-white/70 p-3 backdrop-blur-md text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{m.label}</p>
              <p className={`mt-1 text-xl font-bold ${m.color}`}>{m.value}</p>
            </article>
          ))}
        </section>

        {/* ── Tabs ── */}
        <div className="flex flex-wrap gap-2 border-b border-white/40 pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === t.id
                  ? "bg-[#2c759f] text-white shadow-md"
                  : "border border-white/50 bg-white/50 text-slate-600 hover:bg-white/70"
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB: PRESCRIPTION QUEUE
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "queue" && (
          <section className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient, doctor, RX ID" className="pl-9" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["All", "Pending", "Accepted", "Dispensed", "Rejected"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      statusFilter === s
                        ? "border-[#2c759f] bg-[#2c759f] text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-slate-500">{filteredPrescriptions.length} prescriptions</span>
            </div>

            {filteredPrescriptions.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-10 text-center text-sm text-slate-500">
                No prescriptions match your filters.
              </div>
            )}

            <div className="space-y-3">
              {filteredPrescriptions.map((entry) => {
                const w = workflow[entry.id];
                const isAccepted = Boolean(w?.acceptedAt);
                const isDispensed = Boolean(w?.dispensedAt);
                const isRejected = Boolean(w?.rejectedAt);
                const isExpanded = expandedRx === entry.id;
                const interactions = checkInteractions(entry.medicines);

                const statusLabel = isDispensed ? "Dispensed" : isRejected ? "Rejected" : isAccepted ? "Accepted" : "Pending";
                const statusClass = isDispensed ? "bg-emerald-100 text-emerald-700" : isRejected ? "bg-rose-100 text-rose-700" : isAccepted ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700";

                return (
                  <article key={entry.id} className={`rounded-2xl border bg-white shadow-sm transition-all ${isRejected ? "border-rose-200 opacity-70" : "border-slate-200"}`}>
                    {/* Card header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{entry.patientName}
                          <span className="ml-2 text-xs font-normal text-slate-500">({entry.patientId})</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{entry.id} · {entry.doctor} · {entry.date}</p>
                        {w?.substitutionNote && (
                          <p className="mt-1 text-[11px] font-semibold text-amber-700">⚠ Substitution: {w.substitutionNote}</p>
                        )}
                        {isRejected && w?.rejectionReason && (
                          <p className="mt-1 text-[11px] font-semibold text-rose-700">Rejected: {w.rejectionReason}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {interactions.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-[10px] font-semibold text-rose-700">
                            <AlertTriangle className="h-3 w-3" /> {interactions.length} interaction{interactions.length > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}>{statusLabel}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1">
                          <Pill className="h-3 w-3" /> {entry.medicines.length}
                        </span>
                        <button
                          onClick={() => setExpandedRx(isExpanded ? null : entry.id)}
                          className="rounded-full border border-slate-200 bg-slate-50 p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
                        {/* Drug interactions */}
                        {interactions.length > 0 && (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                            <p className="text-xs font-bold text-rose-700 inline-flex items-center gap-1.5 mb-2">
                              <AlertTriangle className="h-3.5 w-3.5" /> Drug Interaction Alerts
                            </p>
                            {interactions.map((msg, i) => (
                              <p key={i} className="text-xs text-rose-600">• {msg}</p>
                            ))}
                          </div>
                        )}

                        {/* Medicines table */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-2">Medicines</p>
                          <div className="space-y-1.5">
                            {entry.medicines.map((m, idx) => {
                              const stockMatch = stock.find((s) => m.name.toLowerCase().includes(s.name.split(" ")[0].toLowerCase()));
                              const level = stockMatch ? getStockLevel(stockMatch) : null;
                              return (
                                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                                  <div>
                                    <p className="text-xs font-semibold text-slate-800">{m.name}</p>
                                    <p className="text-[11px] text-slate-500">{m.dosage} · {m.timing} · {m.duration}</p>
                                  </div>
                                  {level && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${level === "critical" ? "bg-rose-100 text-rose-700" : level === "low" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                      {level === "critical" ? "Critical stock" : level === "low" ? "Low stock" : "In stock"}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {entry.notes && <p className="mt-2 text-xs text-slate-600"><strong>Doctor note:</strong> {entry.notes}</p>}
                        </div>

                        {/* Timestamps */}
                        {(w?.acceptedAt || w?.dispensedAt) && (
                          <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                            {w.acceptedAt && <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> Accepted: {new Date(w.acceptedAt).toLocaleString()}</span>}
                            {w.dispensedAt && <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Dispensed: {new Date(w.dispensedAt).toLocaleString()}</span>}
                          </div>
                        )}

                        {/* Actions */}
                        {!isRejected && !isDispensed && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {!isAccepted && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => acceptRx(entry.id)} className="inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setRejectionModal({ id: entry.id, reason: "" })} className="inline-flex items-center gap-1 border-rose-200 text-rose-700 hover:bg-rose-50">
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </>
                            )}
                            {isAccepted && (
                              <Button size="sm" onClick={() => dispenseRx(entry)} className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700">
                                <Truck className="h-3.5 w-3.5" /> Dispense & Update Stock
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setSubstitutionModal({ id: entry.id, note: w?.substitutionNote ?? "" })} className="inline-flex items-center gap-1">
                              <RefreshCcw className="h-3.5 w-3.5" /> Substitution Note
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => printLabel(entry)} className="inline-flex items-center gap-1">
                              <Printer className="h-3.5 w-3.5" /> Print Label
                            </Button>
                          </div>
                        )}
                        {isDispensed && (
                          <Button size="sm" variant="outline" onClick={() => printLabel(entry)} className="inline-flex items-center gap-1">
                            <Printer className="h-3.5 w-3.5" /> Reprint Label
                          </Button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: STOCK MANAGER
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "stock" && (
          <section className="space-y-4">
            {stockAlerts.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-800 inline-flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" /> {stockAlerts.length} item{stockAlerts.length > 1 ? "s" : ""} need attention
                </p>
                <div className="flex flex-wrap gap-2">
                  {stockAlerts.map((s) => (
                    <span key={s.id} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStockLevel(s) === "critical" ? "bg-rose-100 text-rose-700" : isExpiringSoon(s.expiryDate) ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>
                      {s.name} — {getStockLevel(s) !== "ok" ? `${getStockLevel(s)} stock (${s.qty} ${s.unit})` : `expires ${s.expiryDate}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add Medicine */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddStock((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-[#2c759f]/30 bg-[#2c759f]/5 px-4 py-2 text-xs font-semibold text-[#2c759f] hover:bg-[#2c759f]/10 transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> {showAddStock ? "Cancel" : "Add Medicine"}
              </button>
            </div>

            {showAddStock && (
              <div className="rounded-2xl border border-[#2c759f]/20 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2c759f] mb-4">New Stock Item</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Medicine Name *", field: "name" as const, placeholder: "e.g. Paracetamol 500mg" },
                    { label: "Category", field: "category" as const, placeholder: "e.g. Analgesic" },
                    { label: "Batch No", field: "batchNo" as const, placeholder: "e.g. B2024-09" },
                    { label: "Quantity *", field: "qty" as const, placeholder: "100", type: "number" },
                    { label: "Min Qty (alert threshold)", field: "minQty" as const, placeholder: "20", type: "number" },
                    { label: "Expiry Date *", field: "expiryDate" as const, type: "date" },
                  ].map(({ label, field, placeholder, type }) => (
                    <div key={field} className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{label}</label>
                      <input
                        type={type ?? "text"}
                        placeholder={placeholder}
                        value={addStockForm[field]}
                        onChange={(e) => setAddStockForm((prev) => ({ ...prev, [field]: e.target.value }))}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-[#2c759f] focus:outline-none"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Unit</label>
                    <select
                      value={addStockForm.unit}
                      onChange={(e) => setAddStockForm((prev) => ({ ...prev, unit: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:border-[#2c759f] focus:outline-none"
                    >
                      {["Tabs", "Caps", "Syrup", "Injection", "Drops", "Cream", "Sachet", "Units"].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={addStockItem} className="bg-[#2c759f] hover:bg-[#1a4d73] inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add to Inventory
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddStock(false)}>Cancel</Button>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl overflow-hidden shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 inline-flex items-center gap-2"><Package className="h-4 w-4 text-[#2c759f]" /> Inventory</h2>
                <span className="text-xs text-slate-500">{stock.length} items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-4 py-3 text-left">Medicine</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Batch</th>
                      <th className="px-4 py-3 text-left">Expiry</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((item) => {
                      const level = getStockLevel(item);
                      const expiring = isExpiringSoon(item.expiryDate);
                      return (
                        <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="px-4 py-3 text-slate-600">{item.category}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{item.batchNo}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${expiring ? "text-orange-600" : "text-slate-600"}`}>
                              {item.expiryDate}{expiring && " ⚠"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => updateStock(item.id, -1)} className="rounded-full border border-slate-200 p-1 hover:bg-slate-100 transition-colors">
                                <Minus className="h-3 w-3 text-slate-600" />
                              </button>
                              <span className={`w-10 text-center font-bold ${level === "critical" ? "text-rose-700" : level === "low" ? "text-amber-700" : "text-emerald-700"}`}>
                                {item.qty}
                              </span>
                              <button onClick={() => updateStock(item.id, 1)} className="rounded-full border border-slate-200 p-1 hover:bg-slate-100 transition-colors">
                                <Plus className="h-3 w-3 text-slate-600" />
                              </button>
                            </div>
                            <p className="text-center text-[10px] text-slate-400 mt-0.5">{item.unit} · min {item.minQty}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${level === "critical" ? "bg-rose-100 text-rose-700" : level === "low" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {level === "critical" ? "Critical" : level === "low" ? "Low" : "OK"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              disabled={item.restockRequested}
                              onClick={() => requestRestock(item.id)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${item.restockRequested ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed" : "border-[#2c759f]/30 bg-[#2c759f]/5 text-[#2c759f] hover:bg-[#2c759f]/10"}`}
                            >
                              {item.restockRequested ? "Requested" : "Request Restock"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: DISPENSE HISTORY
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 inline-flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#2c759f]" /> Dispense History
              </h2>
              <button
                onClick={exportDispenseLog}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2c759f]/30 bg-[#2c759f]/5 px-3.5 py-2 text-xs font-semibold text-[#2c759f] hover:bg-[#2c759f]/10 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>

            {dispenseLog.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-10 text-center text-sm text-slate-500">
                No dispense records yet. Dispense a prescription to see history here.
              </div>
            )}

            <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl overflow-hidden shadow-sm">
              {dispenseLog.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <th className="px-4 py-3 text-left">Log ID</th>
                        <th className="px-4 py-3 text-left">RX ID</th>
                        <th className="px-4 py-3 text-left">Patient</th>
                        <th className="px-4 py-3 text-left">Doctor</th>
                        <th className="px-4 py-3 text-left">Medicines</th>
                        <th className="px-4 py-3 text-left">Dispensed At</th>
                        <th className="px-4 py-3 text-left">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispenseLog.map((log) => (
                        <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-slate-500">{log.id}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-[#2c759f]">{log.rxId}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{log.patientName}</td>
                          <td className="px-4 py-3 text-slate-600">{log.doctor}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">{log.medicines.join(", ")}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{new Date(log.dispensedAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{log.dispensedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Rejection modal ── */}
        {rejectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl">
              <h3 className="text-base font-bold text-slate-800 mb-3">Reject Prescription</h3>
              <p className="text-xs text-slate-500 mb-3">RX: {rejectionModal.id}</p>
              <textarea
                rows={3}
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                placeholder="Reason for rejection (e.g. incomplete dosage info, drug interaction, out of stock)..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-rose-400 focus:outline-none"
              />
              <div className="mt-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRejectionModal(null)}>Cancel</Button>
                <Button onClick={() => rejectRx(rejectionModal.id, rejectionModal.reason)} className="bg-rose-600 hover:bg-rose-700">Confirm Reject</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Substitution modal ── */}
        {substitutionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white p-6 shadow-2xl">
              <h3 className="text-base font-bold text-slate-800 mb-3">Substitution Note</h3>
              <p className="text-xs text-slate-500 mb-3">RX: {substitutionModal.id}</p>
              <textarea
                rows={3}
                value={substitutionModal.note}
                onChange={(e) => setSubstitutionModal({ ...substitutionModal, note: e.target.value })}
                placeholder="e.g. Ibuprofen 400mg substituted with Paracetamol 500mg due to low stock..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#2c759f] focus:outline-none"
              />
              <div className="mt-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSubstitutionModal(null)}>Cancel</Button>
                <Button onClick={() => saveSubstitution(substitutionModal.id, substitutionModal.note)}>Save Note</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default PharmacyDashboard;
