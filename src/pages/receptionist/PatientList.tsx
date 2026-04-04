import DashboardLayout from "@/components/DashboardLayout";
import { appointments, patients } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Search } from "lucide-react";

const APPOINTMENTS_STORAGE_KEY = "medcore-receptionist-appointments";

const PatientList = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const appointmentSource = useMemo(() => {
    if (typeof window === "undefined") return appointments;
    try {
      const raw = window.localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (!raw) return appointments;
      const parsed = JSON.parse(raw) as typeof appointments;
      return Array.isArray(parsed) ? parsed : appointments;
    } catch {
      return appointments;
    }
  }, []);

  const patientVisitCount = useMemo(() => {
    return appointmentSource.reduce<Record<string, number>>((acc, appointment) => {
      acc[appointment.patientId] = (acc[appointment.patientId] ?? 0) + 1;
      return acc;
    }, {});
  }, [appointmentSource]);

  const filtered = patients.filter((patient) =>
    patient.name.toLowerCase().includes(search.toLowerCase())
    || patient.id.toLowerCase().includes(search.toLowerCase())
    || patient.phone.includes(search)
  );

  const exportPatientCsv = () => {
    const rows = filtered.map((patient) => {
      const visits = patientVisitCount[patient.id] ?? 0;
      const segment = visits >= 3 ? "Frequent" : visits >= 1 ? "Returning" : "New";
      return [patient.id, patient.name, patient.phone, patient.age, patient.gender, patient.symptoms, patient.registeredAt, visits, segment];
    });

    const csv = [
      ["Patient ID", "Name", "Phone", "Age", "Gender", "Symptoms", "Registered Date", "Visits", "Segment"],
      ...rows,
    ]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medcore-patient-records-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="dashboard-title">Patient Records</h1>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, ID, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <button onClick={exportPatientCsv} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-muted/40">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border">
          <div className="responsive-table-wrap">
            <table className="responsive-table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Patient ID</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Segment</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Phone</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Age</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Gender</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Symptoms</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/receptionist/patient/${encodeURIComponent(p.id)}`)}
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-primary">{p.id}</td>
                  <td className="px-4 sm:px-6 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 sm:px-6 py-3">
                    {(() => {
                      const visits = patientVisitCount[p.id] ?? 0;
                      const segment = visits >= 3 ? "Frequent" : visits >= 1 ? "Returning" : "New";
                      const segmentClass = segment === "Frequent" ? "bg-blue-100 text-blue-700" : segment === "Returning" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700";
                      return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${segmentClass}`}>{segment}</span>;
                    })()}
                  </td>
                  <td className="px-4 sm:px-6 py-3">{p.phone}</td>
                  <td className="px-4 sm:px-6 py-3">{p.age}</td>
                  <td className="px-4 sm:px-6 py-3">{p.gender}</td>
                  <td className="px-4 sm:px-6 py-3">{p.symptoms}</td>
                  <td className="px-4 sm:px-6 py-3 text-muted-foreground">{p.registeredAt}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientList;
