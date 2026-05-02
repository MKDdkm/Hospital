import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Search, UserPlus, CalendarPlus, Receipt, Users, UserCheck, UserX } from "lucide-react";
import { getPatients, getAppointments } from "@/lib/storage";

type Segment = "All" | "New" | "Returning" | "Frequent";
type GenderFilter = "All" | "Male" | "Female" | "Other";

const PatientList = () => {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<Segment>("All");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("All");
  const navigate = useNavigate();

  const appointmentSource = useMemo(() => getAppointments(), []);
  const allPatients = useMemo(() => getPatients(), []);

  const patientVisitCount = useMemo(() => {
    return appointmentSource.reduce<Record<string, number>>((acc, a) => {
      acc[a.patientId] = (acc[a.patientId] ?? 0) + 1;
      return acc;
    }, {});
  }, [appointmentSource]);

  const getSegment = (patientId: string) => {
    const visits = patientVisitCount[patientId] ?? 0;
    if (visits >= 3) return "Frequent";
    if (visits >= 1) return "Returning";
    return "New";
  };

  const stats = useMemo(() => {
    const total = allPatients.length;
    const newCount = allPatients.filter((p) => getSegment(p.id) === "New").length;
    const returning = allPatients.filter((p) => getSegment(p.id) === "Returning").length;
    const frequent = allPatients.filter((p) => getSegment(p.id) === "Frequent").length;
    return { total, newCount, returning, frequent };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPatients, patientVisitCount]);

  const filtered = useMemo(() => {
    return allPatients.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search);
      const matchSegment = segmentFilter === "All" || getSegment(p.id) === segmentFilter;
      const matchGender = genderFilter === "All" || p.gender === genderFilter;
      return matchSearch && matchSegment && matchGender;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPatients, search, segmentFilter, genderFilter, patientVisitCount]);

  const exportPatientCsv = () => {
    const rows = filtered.map((p) => {
      const visits = patientVisitCount[p.id] ?? 0;
      const segment = getSegment(p.id);
      return [p.id, p.name, p.phone, p.age, p.gender, p.symptoms, p.registeredAt, visits, segment];
    });
    const csv = [
      ["Patient ID", "Name", "Phone", "Age", "Gender", "Symptoms", "Registered Date", "Visits", "Segment"],
      ...rows,
    ]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medcore-patients-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const segmentClass: Record<string, string> = {
    Frequent: "bg-blue-100 text-blue-700",
    Returning: "bg-emerald-100 text-emerald-700",
    New: "bg-slate-100 text-slate-700",
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1320px] space-y-5 animate-fade-in-up">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="dashboard-title text-[#2872a1]">Patient Records</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/receptionist/register")}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2872a1] to-[#1a4d73] px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" /> Register Patient
            </button>
            <button
              onClick={exportPatientCsv}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Patients", value: stats.total, icon: <Users className="h-4 w-4" />, color: "text-[#2872a1]", bg: "bg-blue-50", active: segmentFilter === "All", seg: "All" as Segment },
            { label: "New", value: stats.newCount, icon: <UserPlus className="h-4 w-4" />, color: "text-slate-700", bg: "bg-slate-50", active: segmentFilter === "New", seg: "New" as Segment },
            { label: "Returning", value: stats.returning, icon: <UserCheck className="h-4 w-4" />, color: "text-emerald-700", bg: "bg-emerald-50", active: segmentFilter === "Returning", seg: "Returning" as Segment },
            { label: "Frequent", value: stats.frequent, icon: <UserX className="h-4 w-4" />, color: "text-blue-700", bg: "bg-blue-50", active: segmentFilter === "Frequent", seg: "Frequent" as Segment },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setSegmentFilter(s.seg)}
              className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                s.active
                  ? "border-[#2872a1]/30 bg-[#2872a1]/5 shadow-md"
                  : "border-white/60 bg-white/80 hover:shadow-sm"
              }`}
            >
              <div className={`inline-flex items-center gap-1.5 ${s.color}`}>
                {s.icon}
                <span className="text-xs font-semibold uppercase tracking-[0.08em]">{s.label}</span>
              </div>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5">
            {(["All", "Male", "Female", "Other"] as GenderFilter[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenderFilter(g)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  genderFilter === g
                    ? "border-[#2872a1] bg-[#2872a1] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {(search || segmentFilter !== "All" || genderFilter !== "All") && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSegmentFilter("All"); setGenderFilter("All"); }}
              className="text-xs font-semibold text-[#2872a1] hover:underline"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-slate-500">{filtered.length} of {allPatients.length} patients</span>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_18px_45px_-20px_rgba(40,114,161,0.2)] overflow-hidden">
          <div className="responsive-table-wrap">
            <table className="responsive-table w-full">
              <thead>
                <tr className="border-b bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Patient ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Symptoms</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Registered</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                      No patients match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((p) => {
                  const seg = getSegment(p.id);
                  return (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/receptionist/patient/${encodeURIComponent(p.id)}`)}
                    >
                      <td className="px-4 py-3 font-medium text-[#2872a1] text-sm">{p.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 text-sm">{p.name}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${segmentClass[seg]}`}>{seg}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{p.phone}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{p.age}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{p.gender}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[160px] truncate">{p.symptoms}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.registeredAt}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            title="Book Appointment"
                            onClick={() => navigate(`/receptionist/appointment?patientId=${p.id}`)}
                            className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Billing"
                            onClick={() => navigate("/receptionist/billing")}
                            className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientList;
