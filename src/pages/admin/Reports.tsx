import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { bills, doctors } from "@/data/mockData";import { getAuditLogs, getAppointments } from "@/lib/storage";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Download } from "lucide-react";

const COLORS = ["hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)"];

const formatLogType = (type: string) => {
  const map: Record<string, string> = {
    "patient.registered": "Patient registered",
    "appointment.booked": "Appointment booked",
    "appointment.status.updated": "Appointment status updated",
    "queue.call_next": "Queue: next patient called",
    "queue.recall": "Queue: token recalled",
    "queue.no_show": "Queue: no-show marked",
    "queue.complete": "Queue: visit completed",
    "walkin.added": "Walk-in patient added",
    "admit.initiated": "Admission initiated",
    "billing.payment.recorded": "Payment recorded",
    "billing.invoice.print": "Invoice printed",
    "billing.export.csv": "Billing CSV exported",
    "billing.draft.created": "Bill draft created",
    "admin.announcement": "Announcement published",
    "admin.user.added": "Staff member added",
    "admin.user.removed": "Staff member removed",
  };
  return map[type] ?? type;
};

const Reports = () => {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [logFilter, setLogFilter] = useState("All");

  const allAuditLogs = useMemo(() => getAuditLogs(), []);
  const allAppointments = useMemo(() => getAppointments(), []);

  // Filter audit logs by date range
  const filteredLogs = useMemo(() => {
    return allAuditLogs.filter((log) => {
      const logDate = log.at.split("T")[0];
      const matchDate = logDate >= dateFrom && logDate <= dateTo;
      const matchType = logFilter === "All" || log.type.startsWith(logFilter);
      return matchDate && matchType;
    });
  }, [allAuditLogs, dateFrom, dateTo, logFilter]);

  // Appointments by doctor (live)
  const appointmentsByDoctor = useMemo(() =>
    doctors.map((name) => ({
      name: name.replace("Dr. ", ""),
      count: allAppointments.filter((a) => a.doctor === name).length,
    })),
    [allAppointments],
  );

  // Billing data
  const billingData = [
    { name: "Paid", value: bills.filter((b) => b.status === "Paid").length },
    { name: "Pending", value: bills.filter((b) => b.status === "Pending").length },
  ];

  // Revenue over last 7 days (from audit logs)
  const revenueChart = useMemo(() => {
    const days: { date: string; payments: number; appointments: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const payments = allAuditLogs.filter((l) => l.type === "billing.payment.recorded" && l.at.startsWith(d)).length;
      const appts = allAppointments.filter((a) => a.date === d).length;
      days.push({ date: d.slice(5), payments, appointments: appts });
    }
    return days;
  }, [allAuditLogs, allAppointments]);

  // Log type options
  const logTypes = ["All", "patient", "appointment", "queue", "billing", "admin", "walkin"];

  const exportLogs = () => {
    const csv = [
      ["ID", "Type", "Details", "Timestamp"],
      ...filteredLogs.map((l) => [l.id, l.type, l.details, new Date(l.at).toLocaleString()]),
    ].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `medcore-activity-log-${today}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1300px] space-y-6 animate-fade-in-up">
        <h1 className="dashboard-title">Reports & Analytics</h1>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-slate-800">Appointments by Doctor</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={appointmentsByDoctor}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="name" interval={0} height={50} tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(211, 84%, 45%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-slate-800">Billing Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={billingData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label>
                  {billingData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              {billingData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {d.name}: {d.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue + activity trend */}
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-slate-800">7-Day Activity Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 92%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="appointments" stroke="hsl(211, 84%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="Appointments" />
              <Line type="monotone" dataKey="payments" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} name="Payments recorded" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity log with filters */}
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Activity Log</h3>
              <p className="text-xs text-slate-500">{filteredLogs.length} entries in range</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Date range */}
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:border-[#2872a1]" />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:border-[#2872a1]" />
              {/* Type filter */}
              <select value={logFilter} onChange={(e) => setLogFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none">
                {logTypes.map((t) => <option key={t} value={t}>{t === "All" ? "All types" : t}</option>)}
              </select>
              <button onClick={exportLogs}
                className="inline-flex items-center gap-1 rounded-full border border-[#2872a1]/30 bg-[#2872a1]/5 px-3 py-1.5 text-xs font-semibold text-[#2872a1] hover:bg-[#2872a1]/10 transition-colors">
                <Download className="h-3 w-3" /> Export CSV
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No activity in this date range.</p>
            )}
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex flex-col gap-1 px-4 py-2.5 hover:bg-blue-50/20 transition-colors sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{formatLogType(log.type)}</p>
                  <p className="text-xs text-slate-500 truncate max-w-lg">{log.details}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap">{new Date(log.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
