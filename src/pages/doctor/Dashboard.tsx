import DashboardLayout from "@/components/DashboardLayout";
import { patients, appointments, prescriptions } from "@/data/mockData";
import { Users, CalendarCheck, FileText, Clock } from "lucide-react";

const stats = [
  { label: "My Patients Today", value: appointments.filter(a => a.date === "2026-03-28" && a.doctor === "Dr. Ananya Gupta").length, icon: <Users className="w-6 h-6" />, color: "text-primary" },
  { label: "Total Appointments", value: appointments.length, icon: <CalendarCheck className="w-6 h-6" />, color: "text-success" },
  { label: "Prescriptions Written", value: prescriptions.length, icon: <FileText className="w-6 h-6" />, color: "text-accent" },
  { label: "Pending Reviews", value: 2, icon: <Clock className="w-6 h-6" />, color: "text-warning" },
];

const DoctorDashboard = () => (
  <DashboardLayout>
    <div className="mx-auto w-full max-w-[1400px] space-y-8 animate-fade-in-up">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-5 text-slate-900 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.35)] sm:p-7">
        <h1 className="dashboard-title text-slate-900">Doctor Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Track your patient flow, appointments, and prescription workload.</p>
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-6 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
            <div className={`rounded-xl bg-blue-50 p-3 ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-600">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
        <div className="border-b border-blue-100 bg-blue-50/60 px-4 py-4 sm:px-6">
          <h3 className="font-semibold text-slate-800">Today's Schedule</h3>
        </div>
        <div className="responsive-table-wrap">
          <table className="responsive-table responsive-table--compact">
            <thead>
              <tr className="border-b bg-blue-50/40">
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Token</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Patient</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Time</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.filter(a => a.date === "2026-03-28").map((a) => (
                <tr key={a.id} className="border-b border-blue-50 last:border-0 hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 sm:px-6 py-3 font-medium text-slate-800">{a.token}</td>
                  <td className="px-4 sm:px-6 py-3 text-slate-700">{a.patientName}</td>
                  <td className="px-4 sm:px-6 py-3 text-slate-700">{a.time}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      a.status === "Completed" ? "bg-cyan-100 text-cyan-700" : "bg-blue-100 text-blue-700"
                    }`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default DoctorDashboard;
