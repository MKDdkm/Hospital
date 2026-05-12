import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { appointments, bills, doctors, prescriptions, receptionists } from "@/data/mockData";
import { getPatients, getAuditLogs, pushAuditLog } from "@/lib/storage";
import {
  AlertTriangle, CalendarCheck, CircleCheck,
  Clock3, DollarSign, FileText, Gauge,
  Hospital, Megaphone, ReceiptText, Shield,
  Stethoscope, Users, Download,
} from "lucide-react";
import { toast } from "sonner";

interface TaskItem { id: string; label: string; done: boolean }

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: "T-1", label: "Review pending payments > ₹1,000", done: false },
    { id: "T-2", label: "Verify emergency queue readiness", done: false },
    { id: "T-3", label: "Check bed occupancy alerts", done: false },
    { id: "T-4", label: "Validate doctor schedule conflicts", done: false },
    { id: "T-5", label: "Publish EOD operations memo", done: false },
  ]);

  const [announcement, setAnnouncement] = useState("");
  const [dailyRevenueTarget, setDailyRevenueTarget] = useState<number>(5000);

  // ── Live metrics from storage ──────────────────────────────────────────────
  const metrics = useMemo(() => {
    const allPatients = getPatients();
    const allAppointments = (() => {
      try {
        const raw = window.localStorage.getItem("medcore-receptionist-appointments");
        return raw ? (JSON.parse(raw) as typeof appointments) : appointments;
      } catch { return appointments; }
    })();

    const totalPatients = allPatients.length;
    const totalAppointments = allAppointments.length;
    const completedAppointments = allAppointments.filter((e) => e.status === "Completed").length;
    const scheduledAppointments = allAppointments.filter((e) => e.status === "Scheduled").length;
    const cancelledAppointments = allAppointments.filter((e) => e.status === "Cancelled").length;
    const today = new Date().toISOString().split("T")[0];
    const todayAppointments = allAppointments.filter((e) => e.date === today).length;

    const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
    const pendingPayments = bills.filter((b) => b.status === "Pending").reduce((sum, b) => sum + b.total, 0);
    const pendingBills = bills.filter((b) => b.status === "Pending").length;

    const localRxCount = (() => {
      try {
        const raw = window.localStorage.getItem("medcore-doctor-prescriptions");
        return raw ? (JSON.parse(raw) as unknown[]).length : 0;
      } catch { return 0; }
    })();
    const totalPrescriptions = prescriptions.length + localRxCount;

    const totalDoctors = doctors.length;
    const totalReceptionists = receptionists.length;
    const totalUsers = totalDoctors + totalReceptionists + 1;

    const completionRate = totalAppointments === 0 ? 0 : Math.round((completedAppointments / totalAppointments) * 100);
    const collectionRate = totalRevenue === 0 ? 0 : Math.round(((totalRevenue - pendingPayments) / totalRevenue) * 100);
    const revenueProgress = dailyRevenueTarget === 0 ? 0 : Math.min(100, Math.round((totalRevenue / dailyRevenueTarget) * 100));

    return {
      totalPatients, totalAppointments, completedAppointments, scheduledAppointments,
      cancelledAppointments, todayAppointments, totalRevenue, pendingPayments,
      pendingBills, totalDoctors, totalReceptionists, totalPrescriptions, totalUsers,
      completionRate, collectionRate, revenueProgress,
    };
  }, [dailyRevenueTarget]);

  const doctorLoad = useMemo(() => {
    const allAppointments = (() => {
      try {
        const raw = window.localStorage.getItem("medcore-receptionist-appointments");
        return raw ? (JSON.parse(raw) as typeof appointments) : appointments;
      } catch { return appointments; }
    })();
    return doctors.map((doctor) => {
      const load = allAppointments.filter((e) => e.doctor === doctor).length;
      return { doctor, load, loadPct: Math.min(100, load * 22) };
    });
  }, []);

  const riskAlerts = useMemo(() => {
    const items: { severity: "high" | "medium" | "info"; message: string }[] = [];
    if (metrics.pendingPayments >= 1000) items.push({ severity: "high", message: `Pending collections: ₹${metrics.pendingPayments.toLocaleString()} — follow up required.` });
    if (metrics.cancelledAppointments >= 1) items.push({ severity: "medium", message: `${metrics.cancelledAppointments} cancelled appointments need review.` });
    if (metrics.todayAppointments === 0) items.push({ severity: "info", message: "No appointments scheduled for today." });
    if (items.length === 0) items.push({ severity: "info", message: "No critical operational risk right now." });
    return items;
  }, [metrics]);

  const recentActivity = useMemo(() => getAuditLogs().slice(0, 8), []);

  const operationsSla = [
    { label: "Queue Response SLA", value: `${Math.max(88, 100 - metrics.cancelledAppointments * 7)}%`, note: "Target ≥ 92%", tone: "text-indigo-700 bg-indigo-100" },
    { label: "Billing Closure SLA", value: `${Math.max(80, 100 - metrics.pendingBills * 8)}%`, note: "Target ≥ 90%", tone: "text-amber-700 bg-amber-100" },
    { label: "Rx Dispatch Rate", value: `${metrics.totalPrescriptions > 0 ? Math.min(100, Math.round((metrics.totalPrescriptions / Math.max(metrics.totalAppointments, 1)) * 100)) : 0}%`, note: "Prescriptions per appointment", tone: "text-emerald-700 bg-emerald-100" },
  ];

  const stats = [
    { label: "Total Patients", value: metrics.totalPatients, note: "Registered records", icon: <Users className="w-5 h-5" />, tone: "bg-blue-50 text-blue-700 ring-blue-200" },
    { label: "Appointments", value: metrics.totalAppointments, note: `${metrics.completionRate}% completion`, icon: <CalendarCheck className="w-5 h-5" />, tone: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
    { label: "Today", value: metrics.todayAppointments, note: `${metrics.scheduledAppointments} scheduled`, icon: <Clock3 className="w-5 h-5" />, tone: "bg-sky-50 text-sky-700 ring-sky-200" },
    { label: "Doctors", value: metrics.totalDoctors, note: "Active practitioners", icon: <Stethoscope className="w-5 h-5" />, tone: "bg-blue-50 text-blue-700 ring-blue-200" },
    { label: "Receptionists", value: metrics.totalReceptionists, note: "Front desk team", icon: <Users className="w-5 h-5" />, tone: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
    { label: "Revenue", value: `₹${metrics.totalRevenue.toLocaleString()}`, note: `${metrics.collectionRate}% collected`, icon: <DollarSign className="w-5 h-5" />, tone: "bg-blue-50 text-blue-700 ring-blue-200" },
    { label: "Pending Payments", value: `₹${metrics.pendingPayments.toLocaleString()}`, note: `${metrics.pendingBills} bills`, icon: <AlertTriangle className="w-5 h-5" />, tone: "bg-amber-50 text-amber-700 ring-amber-200" },
    { label: "Prescriptions", value: metrics.totalPrescriptions, note: "Mock + live records", icon: <FileText className="w-5 h-5" />, tone: "bg-sky-50 text-sky-700 ring-sky-200" },
    { label: "System Users", value: metrics.totalUsers, note: "Admin + staff", icon: <Shield className="w-5 h-5" />, tone: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
  ];

  const toggleTask = (id: string) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));

  const publishAnnouncement = () => {
    if (!announcement.trim()) { toast.error("Enter announcement text first."); return; }
    pushAuditLog("admin.announcement", announcement.trim());
    toast.success("Announcement published to audit log.");
    setAnnouncement("");
  };

  const exportExecutiveSnapshot = () => {
    const payload = { generatedAt: new Date().toISOString(), metrics, riskAlerts, doctorLoad, taskCompletion: { done: tasks.filter((t) => t.done).length, total: tasks.length } };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `medcore-admin-snapshot-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success("Executive snapshot exported.");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1450px] space-y-6 animate-fade-in-up">

        {/* Header */}
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-5 text-slate-900 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.35)] sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="dashboard-title text-slate-900">Admin Command Center</h1>
              <p className="text-sm text-slate-600">Live operational metrics, staff workload, financial oversight, and activity feed.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportExecutiveSnapshot} className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                <Download className="h-3.5 w-3.5" /> Export Snapshot
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CircleCheck className="h-3.5 w-3.5" /> {metrics.completionRate}% completion
              </span>
            </div>
          </div>
        </section>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                </div>
                <div className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${item.tone}`}>{item.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SLA monitors */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {operationsSla.map((sla) => (
            <article key={sla.label} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(37,99,235,0.4)] transition-all duration-300 hover:-translate-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{sla.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{sla.value}</p>
              <p className="mt-1 text-xs text-slate-500">{sla.note}</p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${sla.tone}`}>Live</span>
            </article>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">

            {/* Doctor workload */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Doctor Workload</h3>
                <Stethoscope className="h-4 w-4 text-blue-700" />
              </div>
              <div className="space-y-3">
                {doctorLoad.map((entry) => (
                  <div key={entry.doctor}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{entry.doctor}</span>
                      <span className={entry.load >= 3 ? "text-amber-600" : "text-emerald-600"}>{entry.load} appointments</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full transition-all ${entry.loadPct >= 80 ? "bg-amber-400" : "bg-[#2563eb]"}`} style={{ width: `${entry.loadPct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent financial activity */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Recent Financial Activity</h3>
                <ReceiptText className="h-4 w-4 text-blue-700" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-3 py-2 text-left">Bill ID</th>
                      <th className="px-3 py-2 text-left">Patient</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{bill.id}</td>
                        <td className="px-3 py-2.5 text-slate-700">{bill.patientName}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">₹{bill.total.toLocaleString()}</td>
                        <td className="px-3 py-2.5">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bill.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {bill.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Live activity feed */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Live Activity Feed</h3>
                <span className="text-xs text-slate-500">{recentActivity.length} recent</span>
              </div>
              {recentActivity.length === 0 && <p className="text-xs text-slate-500">No activity yet. Actions across all panels appear here.</p>}
              <div className="space-y-2">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{log.type.replace(/\./g, " › ")}</p>
                      <p className="text-[11px] text-slate-500 truncate">{log.details}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400">{new Date(log.at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">

            {/* Risk alerts */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Risk Alerts</h3>
                <AlertTriangle className="h-4 w-4 text-blue-700" />
              </div>
              <div className="space-y-2">
                {riskAlerts.map((alert, idx) => (
                  <div key={idx} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${alert.severity === "high" ? "border-rose-200 bg-rose-50 text-rose-700" : alert.severity === "medium" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
                    {alert.message}
                  </div>
                ))}
              </div>
            </section>

            {/* Revenue target */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Revenue Target</h3>
                <DollarSign className="h-4 w-4 text-blue-700" />
              </div>
              <label className="text-xs font-semibold text-slate-600">Daily Target (₹)</label>
              <input
                type="number" min={1000} value={dailyRevenueTarget}
                onChange={(e) => setDailyRevenueTarget(Math.max(1000, Number(e.target.value) || 1000))}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              />
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${metrics.revenueProgress}%` }} />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600">{metrics.revenueProgress}% — ₹{metrics.totalRevenue.toLocaleString()} / ₹{dailyRevenueTarget.toLocaleString()}</p>
            </section>

            {/* Admin taskboard */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Admin Taskboard</h3>
                <Gauge className="h-4 w-4 text-blue-700" />
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <label key={task.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} className="rounded" />
                    <span className={task.done ? "line-through text-slate-400" : ""}>{task.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">{tasks.filter((t) => t.done).length}/{tasks.length} completed</p>
            </section>

            {/* Broadcast announcement */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Broadcast Announcement</h3>
                <Megaphone className="h-4 w-4 text-blue-700" />
              </div>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                rows={3}
                placeholder="Type operations message for doctors/reception..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
              <button onClick={publishAnnouncement} className="mt-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                Publish to Audit Log
              </button>
            </section>

            {/* Quick links */}
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Quick Links</h3>
                <Hospital className="h-4 w-4 text-blue-700" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate("/admin/users")} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">User Management</button>
                <button onClick={() => navigate("/admin/reports")} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 transition-colors">Reports</button>
                <button onClick={() => navigate("/receptionist/billing")} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">Billing</button>
                <button onClick={() => navigate("/receptionist/rooms")} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">Bed Monitor</button>
                <button onClick={() => navigate("/receptionist/closing-report")} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">Closing Report</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
