import DashboardLayout from "@/components/DashboardLayout";
import { appointments, bills } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const appointmentsByDoctor = [
  { name: "Dr. Ananya Gupta", count: appointments.filter(a => a.doctor === "Dr. Ananya Gupta").length },
  { name: "Dr. Rajesh Iyer", count: appointments.filter(a => a.doctor === "Dr. Rajesh Iyer").length },
  { name: "Dr. Meena Nair", count: appointments.filter(a => a.doctor === "Dr. Meena Nair").length },
  { name: "Dr. Sanjay Verma", count: 0 },
];

const billingData = [
  { name: "Paid", value: bills.filter(b => b.status === "Paid").length },
  { name: "Pending", value: bills.filter(b => b.status === "Pending").length },
];

const COLORS = ["hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)"];

const Reports = () => (
  <DashboardLayout>
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="dashboard-title">Reports & Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <h3 className="font-semibold mb-4">Appointments by Doctor</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={appointmentsByDoctor}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="name" interval={0} height={60} tick={{ fontSize: 10 }} angle={-18} textAnchor="end" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(211, 84%, 45%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <h3 className="font-semibold mb-4">Billing Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={billingData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                {billingData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center flex-wrap gap-4 sm:gap-6 mt-2">
            {billingData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border">
        <div className="px-4 sm:px-6 py-4 border-b"><h3 className="font-semibold">Activity Log</h3></div>
        <div className="p-4 sm:p-6 space-y-3">
          {[
            { action: "Patient Amit Kumar registered", time: "10:15 AM", user: "Receptionist" },
            { action: "Appointment booked for Priya Patel", time: "10:30 AM", user: "Receptionist" },
            { action: "Prescription created for Amit Kumar", time: "11:05 AM", user: "Dr. Ananya Gupta" },
            { action: "Bill generated for Amit Kumar — ₹1,650", time: "11:20 AM", user: "Receptionist" },
            { action: "New Doctor Dr. Sanjay Verma added", time: "02:00 PM", user: "Admin" },
          ].map((log, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{log.action}</p>
                <p className="text-xs text-muted-foreground">by {log.user}</p>
              </div>
              <span className="text-xs text-muted-foreground">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default Reports;
