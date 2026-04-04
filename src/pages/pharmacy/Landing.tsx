import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { prescriptions } from "@/data/mockData";
import { Pill, ClipboardList, ShieldCheck, Boxes, TrendingUp } from "lucide-react";

interface PharmacyDispatch {
  sent: boolean;
  sentAt?: string;
}

const PHARMACY_DISPATCH_STORAGE_KEY = "medcore-pharmacy-dispatch";
const PRESCRIPTIONS_STORAGE_KEY = "medcore-doctor-prescriptions";

const PharmacyLanding = () => {
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        sentToPharmacy: 0,
        totalPrescriptions: prescriptions.length,
        localAdded: 0,
      };
    }

    try {
      const dispatchRaw = window.localStorage.getItem(PHARMACY_DISPATCH_STORAGE_KEY);
      const dispatchMap = dispatchRaw ? (JSON.parse(dispatchRaw) as Record<string, PharmacyDispatch>) : {};
      const sentToPharmacy = Object.values(dispatchMap).filter((entry) => entry.sent).length;

      const localRaw = window.localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
      const localAdded = localRaw ? (JSON.parse(localRaw) as unknown[]).length : 0;

      return {
        sentToPharmacy,
        totalPrescriptions: prescriptions.length + localAdded,
        localAdded,
      };
    } catch {
      return {
        sentToPharmacy: 0,
        totalPrescriptions: prescriptions.length,
        localAdded: 0,
      };
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1280px] space-y-5 animate-fade-in-up">
        <section className="rounded-3xl border border-white/70 bg-gradient-to-r from-[#1e5a80] via-[#2a6f99] to-[#3c88b5] p-6 text-white shadow-[0_25px_60px_-35px_rgba(18,53,78,0.75)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">Pharmacy Workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Medicine fulfillment command center</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/85">
            Track doctor-sent prescriptions, run dispense workflows, and keep handover clean in one dedicated pharmacy module.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button className="bg-white text-[#205e86] hover:bg-white/90" onClick={() => navigate("/pharmacy/dashboard")}>
              Open Pharmacy Dashboard
            </Button>
            <Button variant="outline" className="border-white/45 text-white hover:bg-white/15" onClick={() => navigate("/doctor/prescriptions")}>
              Review Doctor Prescriptions
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold text-slate-500">Sent To Pharmacy</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.sentToPharmacy}</p>
            <p className="mt-1 text-xs text-slate-600">Live intake count</p>
          </article>
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold text-slate-500">Total Prescriptions</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.totalPrescriptions}</p>
            <p className="mt-1 text-xs text-slate-600">Mock + live records</p>
          </article>
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold text-slate-500">Locally Added</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.localAdded}</p>
            <p className="mt-1 text-xs text-slate-600">Created by doctors in app</p>
          </article>
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold text-slate-500">Operational Readiness</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">98%</p>
            <p className="mt-1 text-xs text-slate-600">Dispense desk uptime</p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><ClipboardList className="h-4 w-4 text-[#2a6f99]" /> Intake and verification</p>
            <p className="mt-2 text-xs text-slate-600">Verify doctor note, dosage, and patient mapping before dispensing.</p>
          </article>
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><Boxes className="h-4 w-4 text-[#2a6f99]" /> Batch and stock checks</p>
            <p className="mt-2 text-xs text-slate-600">Flag low stock substitutions and maintain pharmacy-safe substitutions.</p>
          </article>
          <article className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><ShieldCheck className="h-4 w-4 text-[#2a6f99]" /> Audit and compliance</p>
            <p className="mt-2 text-xs text-slate-600">Track accepted and dispensed timestamps for internal audits.</p>
          </article>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur-md">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><TrendingUp className="h-4 w-4 text-[#2a6f99]" /> What this module includes</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">Doctor-to-pharmacy prescription inbox</p>
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">Search by patient, doctor, or RX ID</p>
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">Mark accepted and mark dispensed actions</p>
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">Status board for pending/accepted/dispensed</p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default PharmacyLanding;
