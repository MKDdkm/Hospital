import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { appointments, bills, doctors, patients, prescriptions, receptionists } from "@/data/mockData";
import {
  AlertTriangle,
  BellRing,
  CalendarCheck,
  CircleCheck,
  Clock3,
  Cpu,
  DollarSign,
  FileText,
  Gauge,
  Hospital,
  Megaphone,
  ReceiptText,
  Shield,
  Stethoscope,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

const AUDIT_LOGS_STORAGE_KEY = "medcore-receptionist-audit-logs";

type ApprovalType = "User Access" | "High Bill" | "Discharge Override" | "Refund";

interface ApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  priority: "High" | "Medium" | "Low";
  requestedBy: string;
}

interface TaskItem {
  id: string;
  label: string;
  done: boolean;
}

const AdminDashboard = () => {
  const [systemControls, setSystemControls] = useState({
    maintenanceMode: false,
    registrationOpen: true,
    billingLock: false,
    emergencyBroadcast: false,
  });

  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    { id: "AP-101", type: "User Access", title: "Enable doctor account for Dr. Sanjay Verma", priority: "High", requestedBy: "IT Desk" },
    { id: "AP-102", type: "High Bill", title: "Approve >₹50,000 ICU billing exception", priority: "Medium", requestedBy: "Billing Desk" },
    { id: "AP-103", type: "Discharge Override", title: "Manual discharge approval for bed ICU-04", priority: "High", requestedBy: "Ward Supervisor" },
    { id: "AP-104", type: "Refund", title: "Partial refund for cancelled scan", priority: "Low", requestedBy: "Reception" },
  ]);

  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: "T-1", label: "Review pending payments > ₹1,000", done: false },
    { id: "T-2", label: "Verify emergency queue readiness", done: false },
    { id: "T-3", label: "Check bed occupancy alerts", done: false },
    { id: "T-4", label: "Validate doctor schedule conflicts", done: false },
    { id: "T-5", label: "Publish EOD operations memo", done: false },
  ]);

  const [announcement, setAnnouncement] = useState("");
  const [dailyRevenueTarget, setDailyRevenueTarget] = useState<number>(5000);

  const metrics = useMemo(() => {
    const totalPatients = patients.length;
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter((entry) => entry.status === "Completed").length;
    const scheduledAppointments = appointments.filter((entry) => entry.status === "Scheduled").length;
    const cancelledAppointments = appointments.filter((entry) => entry.status === "Cancelled").length;
    const todayAppointments = appointments.filter((entry) => entry.date === "2026-03-28").length;

    const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
    const pendingPayments = bills.filter((bill) => bill.status === "Pending").reduce((sum, bill) => sum + bill.total, 0);
    const paidBills = bills.filter((bill) => bill.status === "Paid").length;
    const pendingBills = bills.filter((bill) => bill.status === "Pending").length;

    const totalDoctors = doctors.length;
    const totalReceptionists = receptionists.length;
    const totalPrescriptions = prescriptions.length;
    const totalUsers = totalDoctors + totalReceptionists + 1;

    const completionRate = totalAppointments === 0 ? 0 : Math.round((completedAppointments / totalAppointments) * 100);
    const collectionRate = totalRevenue === 0 ? 0 : Math.round(((totalRevenue - pendingPayments) / totalRevenue) * 100);
    const revenueProgress = dailyRevenueTarget === 0 ? 0 : Math.min(100, Math.round((totalRevenue / dailyRevenueTarget) * 100));

    return {
      totalPatients,
      totalAppointments,
      completedAppointments,
      scheduledAppointments,
      cancelledAppointments,
      todayAppointments,
      totalRevenue,
      pendingPayments,
      paidBills,
      pendingBills,
      totalDoctors,
      totalReceptionists,
      totalPrescriptions,
      totalUsers,
      completionRate,
      collectionRate,
      revenueProgress,
    };
  }, [dailyRevenueTarget]);

  const doctorLoad = useMemo(
    () => doctors.map((doctor) => {
      const load = appointments.filter((entry) => entry.doctor === doctor).length;
      return { doctor, load, loadPct: Math.min(100, load * 22) };
    }),
    [],
  );

  const riskAlerts = useMemo(() => {
    const items: { severity: "high" | "medium" | "info"; message: string }[] = [];
    if (metrics.pendingPayments >= 1000) items.push({ severity: "high", message: `Pending collections high: ₹${metrics.pendingPayments.toLocaleString()}` });
    if (metrics.cancelledAppointments >= 1) items.push({ severity: "medium", message: `${metrics.cancelledAppointments} cancelled appointments need review.` });
    if (approvals.length >= 3) items.push({ severity: "medium", message: `${approvals.length} approvals pending admin action.` });
    if (items.length === 0) items.push({ severity: "info", message: "No critical operational risk right now." });
    return items;
  }, [approvals.length, metrics.cancelledAppointments, metrics.pendingPayments]);

  const stats = [
    { label: "Total Patients", value: metrics.totalPatients, note: "Registered records", icon: <Users className="w-5 h-5" />, tone: "bg-blue-50 text-blue-700 ring-blue-200" },
    { label: "Appointments", value: metrics.totalAppointments, note: `${metrics.completionRate}% completion`, icon: <CalendarCheck className="w-5 h-5" />, tone: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
    { label: "Today's Appointments", value: metrics.todayAppointments, note: `${metrics.scheduledAppointments} scheduled`, icon: <Clock3 className="w-5 h-5" />, tone: "bg-sky-50 text-sky-700 ring-sky-200" },
    { label: "Doctors", value: metrics.totalDoctors, note: "Active practitioners", icon: <Stethoscope className="w-5 h-5" />, tone: "bg-blue-50 text-blue-700 ring-blue-200" },
    { label: "Receptionists", value: metrics.totalReceptionists, note: "Front desk team", icon: <Users className="w-5 h-5" />, tone: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
    { label: "Revenue", value: `₹${metrics.totalRevenue.toLocaleString()}`, note: `${metrics.collectionRate}% collected`, icon: <DollarSign className="w-5 h-5" />, tone: "bg-blue-50 text-blue-700 ring-blue-200" },
    { label: "Pending Payments", value: `₹${metrics.pendingPayments.toLocaleString()}`, note: `${metrics.pendingBills} pending bills`, icon: <AlertTriangle className="w-5 h-5" />, tone: "bg-amber-50 text-amber-700 ring-amber-200" },
    { label: "Prescriptions", value: metrics.totalPrescriptions, note: "Active records", icon: <FileText className="w-5 h-5" />, tone: "bg-sky-50 text-sky-700 ring-sky-200" },
    { label: "System Users", value: metrics.totalUsers, note: "Admin + staff", icon: <Shield className="w-5 h-5" />, tone: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
  ];

  const operationsSla = [
    {
      label: "Queue Response SLA",
      value: `${Math.max(88, 100 - metrics.cancelledAppointments * 7)}%`,
      note: "Target >= 92%",
      tone: "text-indigo-700 bg-indigo-100",
    },
    {
      label: "Billing Closure SLA",
      value: `${Math.max(80, 100 - metrics.pendingBills * 8)}%`,
      note: "Target >= 90%",
      tone: "text-amber-700 bg-amber-100",
    },
    {
      label: "Approval Turnaround",
      value: `${Math.max(75, 100 - approvals.length * 6)}%`,
      note: "Target >= 88%",
      tone: "text-emerald-700 bg-emerald-100",
    },
  ];

  const toggleControl = (key: keyof typeof systemControls) => {
    setSystemControls((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success(`${key} ${next[key] ? "enabled" : "disabled"}.`);
      return next;
    });
  };

  const handleApprovalAction = (id: string, decision: "approved" | "rejected") => {
    const item = approvals.find((entry) => entry.id === id);
    setApprovals((prev) => prev.filter((entry) => entry.id !== id));
    if (item) {
      try {
        const previous = JSON.parse(window.localStorage.getItem(AUDIT_LOGS_STORAGE_KEY) ?? "[]") as Array<Record<string, string>>;
        previous.unshift({
          id: `AL-${Date.now()}`,
          type: `admin.approval.${decision}`,
          at: new Date().toISOString(),
          details: `${item.id} | ${item.type} | ${item.title}`,
        });
        window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(previous.slice(0, 80)));
      } catch {
        // Ignore audit log serialization issues.
      }
    }
    toast.success(`Request ${id} ${decision}.`);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  const publishAnnouncement = () => {
    if (!announcement.trim()) {
      toast.error("Enter announcement text first.");
      return;
    }
    try {
      const previous = JSON.parse(window.localStorage.getItem(AUDIT_LOGS_STORAGE_KEY) ?? "[]") as Array<Record<string, string>>;
      previous.unshift({
        id: `AL-${Date.now()}`,
        type: "admin.announcement",
        at: new Date().toISOString(),
        details: announcement.trim(),
      });
      window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(previous.slice(0, 80)));
    } catch {
      // Ignore audit log serialization issues.
    }
    toast.success("Announcement published.");
    setAnnouncement("");
  };

  const exportExecutiveSnapshot = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      metrics,
      systemControls,
      pendingApprovals: approvals,
      riskAlerts,
      doctorLoad,
      taskCompletion: {
        done: tasks.filter((task) => task.done).length,
        total: tasks.length,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medcore-admin-snapshot-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Executive snapshot exported.");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1450px] space-y-8 animate-fade-in-up">
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-5 text-slate-900 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.35)] sm:p-7 transition-all duration-300 hover:shadow-[0_24px_50px_-30px_rgba(37,99,235,0.45)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="dashboard-title text-slate-900">Admin Command Center</h1>
              <p className="text-sm text-slate-600">Operational governance, approvals, controls, and financial oversight in one view.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportExecutiveSnapshot} className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                Export Snapshot
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CircleCheck className="h-3.5 w-3.5" /> {metrics.completionRate}% completion
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-26px_rgba(37,99,235,0.45)]">
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

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {operationsSla.map((sla) => (
            <article key={sla.label} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_16px_34px_-28px_rgba(37,99,235,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-24px_rgba(37,99,235,0.45)]">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{sla.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{sla.value}</p>
              <p className="mt-1 text-xs text-slate-500">{sla.note}</p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${sla.tone}`}>Live monitor</span>
            </article>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-7">
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">System Controls</h3>
                <Wrench className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { key: "maintenanceMode", label: "Maintenance Mode" },
                  { key: "registrationOpen", label: "Registration Open" },
                  { key: "billingLock", label: "Billing Lock" },
                  { key: "emergencyBroadcast", label: "Emergency Broadcast" },
                ].map((control) => {
                  const enabled = systemControls[control.key as keyof typeof systemControls];
                  return (
                    <button
                      key={control.key}
                      onClick={() => toggleControl(control.key as keyof typeof systemControls)}
                      className={`rounded-xl border px-3 py-3 text-left transition-colors ${enabled ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
                    >
                      <p className="text-sm font-semibold text-slate-800">{control.label}</p>
                      <p className={`text-xs font-semibold ${enabled ? "text-blue-700" : "text-slate-500"}`}>{enabled ? "Enabled" : "Disabled"}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Approval Queue</h3>
                <Shield className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-3 space-y-2">
                {approvals.length === 0 && <p className="text-xs text-slate-500">No pending approvals.</p>}
                {approvals.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.id} • {item.type}</p>
                        <p className="text-xs text-slate-600">{item.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Requested by: {item.requestedBy}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.priority === "High" ? "bg-rose-100 text-rose-700" : item.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => handleApprovalAction(item.id, "approved")} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">Approve</button>
                      <button onClick={() => handleApprovalAction(item.id, "rejected")} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Doctor Workload Heat</h3>
                <Stethoscope className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-3 space-y-2">
                {doctorLoad.map((entry) => (
                  <div key={entry.doctor} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{entry.doctor}</span>
                      <span>{entry.load} appointments</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-[#2872a1]" style={{ width: `${entry.loadPct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-7">
            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Risk Alerts</h3>
                <AlertTriangle className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-3 space-y-2">
                {riskAlerts.map((alert, idx) => (
                  <div key={`${alert.message}-${idx}`} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${alert.severity === "high" ? "border-rose-200 bg-rose-50 text-rose-700" : alert.severity === "medium" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>
                    {alert.message}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Revenue Target</h3>
                <DollarSign className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-3 space-y-2">
                <label className="text-xs font-semibold text-slate-600">Daily Target (₹)</label>
                <input
                  type="number"
                  min={1000}
                  value={dailyRevenueTarget}
                  onChange={(e) => setDailyRevenueTarget(Math.max(1000, Number(e.target.value) || 1000))}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
                />
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${metrics.revenueProgress}%` }} />
                </div>
                <p className="text-xs font-semibold text-slate-600">Progress: {metrics.revenueProgress}% (₹{metrics.totalRevenue.toLocaleString()} / ₹{dailyRevenueTarget.toLocaleString()})</p>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Admin Taskboard</h3>
                <Gauge className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-3 space-y-2">
                {tasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-sm text-slate-700">
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                    <span className={task.done ? "line-through text-slate-400" : ""}>{task.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Broadcast Announcement</h3>
                <Megaphone className="h-4 w-4 text-blue-700" />
              </div>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                rows={3}
                placeholder="Type operations message for doctors/reception..."
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
              <button onClick={publishAnnouncement} className="mt-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                Publish Announcement
              </button>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">System Health</h3>
                <Cpu className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-3 space-y-2 text-xs font-semibold text-slate-700">
                <p className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">API latency: 128 ms (stable)</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">Queue processor: Healthy</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">DB write backlog: 0</p>
                <p className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">Uptime: 99.94%</p>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Quick Links</h3>
                <Hospital className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">User Management</button>
                <button className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">Reports</button>
                <button className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Billing Review</button>
                <button className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Bed Monitor</button>
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Financial Activity</h3>
            <ReceiptText className="h-4 w-4 text-blue-700" />
          </div>
          <div className="responsive-table-wrap mt-3">
            <table className="responsive-table responsive-table--compact w-full">
              <thead>
                <tr className="border-b bg-slate-50/80">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Bill ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Patient</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{bill.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{bill.patientName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">₹{bill.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
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

        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Notification Center</h3>
            <BellRing className="h-4 w-4 text-blue-700" />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Critical: Pending payments require escalation.</div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Notice: Approval queue contains high-priority requests.</div>
            <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">Info: System health remains within safe operating thresholds.</div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
