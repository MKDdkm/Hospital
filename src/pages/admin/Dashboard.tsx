import DashboardLayout from "@/components/DashboardLayout";
import { patients, appointments, bills, prescriptions, doctors, receptionists } from "@/data/mockData";
import { Users, CalendarCheck, DollarSign, CircleCheck, Clock3, ReceiptText, Stethoscope, AlertCircle, FileText } from "lucide-react";

// Calculate all metrics
const totalPatients = patients.length;
const totalAppointments = appointments.length;
const todayAppointments = appointments.filter((a) => a.date === "2026-03-28").length;
const totalDoctors = doctors.length;
const totalReceptionists = receptionists.length;
const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
const pendingPayments = bills.filter((b) => b.status === "Pending").reduce((sum, b) => sum + b.total, 0);
const totalPrescriptions = prescriptions.length;
const totalUsers = totalDoctors + totalReceptionists + 1; // +1 for admin

const completedAppointments = appointments.filter((a) => a.status === "Completed").length;
const scheduledAppointments = appointments.filter((a) => a.status === "Scheduled").length;
const paidBills = bills.filter((b) => b.status === "Paid").length;
const pendingBillsCount = bills.filter((b) => b.status === "Pending").length;

const stats = [
  {
    label: "Total Patients",
    value: totalPatients,
    note: "Registered records",
    icon: <Users className="w-5 h-5" />,
    tone: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  {
    label: "Total Appointments",
    value: totalAppointments,
    note: `${completedAppointments} completed`,
    icon: <CalendarCheck className="w-5 h-5" />,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  {
    label: "Today's Appointments",
    value: todayAppointments,
    note: "Scheduled for today",
    icon: <Clock3 className="w-5 h-5" />,
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    label: "Total Doctors",
    value: totalDoctors,
    note: "Active practitioners",
    icon: <Stethoscope className="w-5 h-5" />,
    tone: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  {
    label: "Total Receptionists",
    value: totalReceptionists,
    note: "Patient coordinators",
    icon: <Users className="w-5 h-5" />,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  {
    label: "Total Revenue",
    value: `₹${totalRevenue.toLocaleString()}`,
    note: `${paidBills} bills paid`,
    icon: <DollarSign className="w-5 h-5" />,
    tone: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  {
    label: "Pending Payments",
    value: `₹${pendingPayments.toLocaleString()}`,
    note: `${pendingBillsCount} pending bills`,
    icon: <AlertCircle className="w-5 h-5" />,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  {
    label: "Total Prescriptions",
    value: totalPrescriptions,
    note: "Active prescriptions",
    icon: <FileText className="w-5 h-5" />,
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    label: "System Users",
    value: totalUsers,
    note: `${totalDoctors} doctors, ${totalReceptionists} receptionists`,
    icon: <Users className="w-5 h-5" />,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
];

const AdminDashboard = () => (
  <DashboardLayout>
    <div className="mx-auto w-full max-w-[1400px] space-y-8 animate-fade-in-up">
      {/* Header Hero Section */}
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-5 text-slate-900 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.35)] sm:p-7">
        <div className="space-y-4">
          <div>
            <h1 className="dashboard-title text-slate-900">System Summary</h1>
            <p className="text-sm text-slate-600">
              Complete overview of hospital operations, patient management, and financial performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700">
              <CircleCheck className="h-3.5 w-3.5" />
              {completedAppointments} completed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
              <AlertCircle className="h-3.5 w-3.5" />
              {pendingBillsCount} pending bills
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
              <Clock3 className="h-3.5 w-3.5" />
              {todayAppointments} today
            </span>
          </div>
        </div>
      </section>

      {/* Dashboard Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-6 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-600">{s.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500">{s.note}</p>
              </div>
              <div className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${s.tone}`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Data Lists - 2 Column */}
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
        {/* Recent Patients */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
          <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/60 px-4 py-4 sm:px-6">
            <h3 className="font-semibold text-slate-800">Recent Patients</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
              <Users className="h-3.5 w-3.5" />
              {patients.length} total
            </span>
          </div>
          <div className="space-y-3 p-4 sm:hidden">
            {patients.slice().reverse().slice(0, 5).map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{p.phone}</p>
                  </div>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">{p.age}y</span>
                </div>
              </div>
            ))}
          </div>
          <div className="responsive-table-wrap hidden sm:block">
            <table className="responsive-table responsive-table--compact w-full">
              <thead>
                <tr className="border-b bg-slate-50/80">
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Name</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Phone</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Age</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Registered</th>
                </tr>
              </thead>
              <tbody>
                {patients.slice().reverse().slice(0, 5).map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 sm:px-6 py-3 text-slate-600">{p.phone}</td>
                    <td className="px-4 sm:px-6 py-3 text-slate-600">{p.age}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-slate-500">{p.registeredAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
          <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/60 px-4 py-4 sm:px-6">
            <h3 className="font-semibold text-slate-800">Recent Appointments</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
              <CalendarCheck className="h-3.5 w-3.5" />
              {scheduledAppointments} scheduled
            </span>
          </div>
          <div className="space-y-3 p-4 sm:hidden">
            {appointments.slice().reverse().slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.patientName}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{a.doctor}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{a.date} at {a.time}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    a.status === "Completed" ? "bg-emerald-100 text-emerald-700" : 
                    a.status === "Scheduled" ? "bg-slate-100 text-slate-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="responsive-table-wrap hidden sm:block">
            <table className="responsive-table responsive-table--compact w-full">
              <thead>
                <tr className="border-b bg-slate-50/80">
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Patient</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Doctor</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Date & Time</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice().reverse().slice(0, 5).map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-800">{a.patientName}</td>
                    <td className="px-4 sm:px-6 py-3 text-slate-600">{a.doctor}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-slate-600">{a.date} {a.time}</td>
                    <td className="px-4 sm:px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        a.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                        a.status === "Scheduled" ? "bg-slate-100 text-slate-700" : "bg-rose-100 text-rose-700"
                      }`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Bills & Prescriptions - 2 Column */}
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
        {/* Recent Bills */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
          <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/60 px-4 py-4 sm:px-6">
            <h3 className="font-semibold text-slate-800">Recent Bills</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
              <ReceiptText className="h-3.5 w-3.5" />
              {bills.length} invoices
            </span>
          </div>
          <div className="space-y-3 p-4 sm:hidden">
            {bills.slice().reverse().slice(0, 5).map((b) => (
              <div key={b.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{b.patientName}</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-700">₹{b.total.toLocaleString()}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{b.date}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    b.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="responsive-table-wrap hidden sm:block">
            <table className="responsive-table responsive-table--compact w-full">
              <thead>
                <tr className="border-b bg-slate-50/80">
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Patient</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.slice().reverse().slice(0, 5).map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-800">{b.patientName}</td>
                    <td className="px-4 sm:px-6 py-3 font-semibold text-slate-700">₹{b.total.toLocaleString()}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-slate-600">{b.date}</td>
                    <td className="px-4 sm:px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        b.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
          <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/60 px-4 py-4 sm:px-6">
            <h3 className="font-semibold text-slate-800">Recent Prescriptions</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
              <FileText className="h-3.5 w-3.5" />
              {prescriptions.length} prescriptions
            </span>
          </div>
          <div className="space-y-3 p-4 sm:hidden">
            {prescriptions.slice().reverse().slice(0, 5).map((rx) => (
              <div key={rx.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{rx.patientName}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{rx.doctor}</p>
                  <p className="mt-1 text-xs text-slate-500">{rx.medicines.length} medicine{rx.medicines.length > 1 ? 's' : ''}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{rx.date}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="responsive-table-wrap hidden sm:block">
            <table className="responsive-table responsive-table--compact w-full">
              <thead>
                <tr className="border-b bg-slate-50/80">
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Patient</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Doctor</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Medicines</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.slice().reverse().slice(0, 5).map((rx) => (
                  <tr key={rx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-800">{rx.patientName}</td>
                    <td className="px-4 sm:px-6 py-3 text-slate-600">{rx.doctor}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-slate-600">{rx.medicines.length} medicine{rx.medicines.length > 1 ? 's' : ''}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-slate-600">{rx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default AdminDashboard;
