import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { getPrescriptions } from "@/lib/storage";
import { prescriptions as mockPrescriptions } from "@/data/mockData";
import { Pill, CheckCircle2, Clock3, XCircle, AlertTriangle, Package, Truck } from "lucide-react";

interface StockItem { id: string; name: string; qty: number; minQty: number; unit: string; expiryDate: string; category: string }

function isExpiringSoon(expiryDate: string): boolean {
  const diff = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff <= 90;
}

const PharmacyOverview = () => {
  const dispatchMap = useMemo<Record<string, { sent: boolean; sentAt?: string }>>(() => {
    try { return JSON.parse(window.localStorage.getItem("medcore-pharmacy-dispatch") ?? "{}"); }
    catch { return {}; }
  }, []);

  const workflow = useMemo<Record<string, { acceptedAt?: string; dispensedAt?: string; rejectedAt?: string }>>(() => {
    try { return JSON.parse(window.localStorage.getItem("medcore-pharmacy-workflow") ?? "{}"); }
    catch { return {}; }
  }, []);

  const stock = useMemo<StockItem[]>(() => {
    try { return JSON.parse(window.localStorage.getItem("medcore-pharmacy-stock") ?? "[]"); }
    catch { return []; }
  }, []);

  const allRx = useMemo(() => {
    const local = getPrescriptions();
    return [...mockPrescriptions, ...local].filter((rx) => dispatchMap[rx.id]?.sent);
  }, [dispatchMap]);

  const pending = allRx.filter((rx) => !workflow[rx.id]?.acceptedAt && !workflow[rx.id]?.rejectedAt).length;
  const accepted = allRx.filter((rx) => workflow[rx.id]?.acceptedAt && !workflow[rx.id]?.dispensedAt).length;
  const dispensed = allRx.filter((rx) => workflow[rx.id]?.dispensedAt).length;
  const rejected = allRx.filter((rx) => workflow[rx.id]?.rejectedAt).length;

  const lowStock = stock.filter((s) => s.qty < s.minQty);
  const expiringSoon = stock.filter((s) => isExpiringSoon(s.expiryDate));

  const recentDispensed = allRx
    .filter((rx) => workflow[rx.id]?.dispensedAt)
    .sort((a, b) => (workflow[b.id]?.dispensedAt ?? "").localeCompare(workflow[a.id]?.dispensedAt ?? ""))
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1100px] space-y-5 animate-fade-in-up">

        {/* Header */}
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500 text-white">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Pharmacy Overview</h1>
              <p className="text-sm text-slate-500">Read-only view — prescription status & stock alerts</p>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Pending", value: pending, icon: <Clock3 className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            { label: "Accepted", value: accepted, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
            { label: "Dispensed", value: dispensed, icon: <Truck className="h-5 w-5" />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
            { label: "Rejected", value: rejected, icon: <XCircle className="h-5 w-5" />, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
          ].map((m) => (
            <div key={m.label} className={`rounded-2xl border ${m.bg} p-4 flex items-center gap-3`}>
              <span className={m.color}>{m.icon}</span>
              <div>
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Stock Alerts */}
          <div className="rounded-2xl border border-white/60 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <Package className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-800">Stock Alerts</h2>
              {(lowStock.length + expiringSoon.length) > 0 && (
                <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                  {lowStock.length + expiringSoon.length} issues
                </span>
              )}
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {lowStock.length === 0 && expiringSoon.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">All stock levels OK</p>
              )}
              {lowStock.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{s.name}</p>
                    <p className="text-[11px] text-amber-700">Low stock — {s.qty} {s.unit} remaining</p>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                </div>
              ))}
              {expiringSoon.map((s) => (
                <div key={`exp-${s.id}`} className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{s.name}</p>
                    <p className="text-[11px] text-orange-700">Expiring soon — {s.expiryDate}</p>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Dispensed */}
          <div className="rounded-2xl border border-white/60 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <Truck className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-800">Recently Dispensed</h2>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {recentDispensed.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No dispensed prescriptions yet</p>
              )}
              {recentDispensed.map((rx) => (
                <div key={rx.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{rx.patientName}</p>
                    <p className="text-[11px] text-slate-500">{rx.id} · {rx.doctor}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                    Dispensed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All sent prescriptions */}
        <div className="rounded-2xl border border-white/60 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-800">All Prescriptions Sent to Pharmacy</h2>
          </div>
          {allRx.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No prescriptions sent to pharmacy yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-4 py-3 text-left">RX ID</th>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Doctor</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allRx.map((rx) => {
                    const w = workflow[rx.id];
                    const status = w?.dispensedAt ? "Dispensed" : w?.rejectedAt ? "Rejected" : w?.acceptedAt ? "Accepted" : "Pending";
                    const statusClass = status === "Dispensed" ? "bg-emerald-100 text-emerald-700" : status === "Rejected" ? "bg-rose-100 text-rose-700" : status === "Accepted" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700";
                    return (
                      <tr key={rx.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{rx.id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{rx.patientName}</td>
                        <td className="px-4 py-3 text-slate-600">{rx.doctor}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{rx.date}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PharmacyOverview;
