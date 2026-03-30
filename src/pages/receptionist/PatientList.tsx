import DashboardLayout from "@/components/DashboardLayout";
import { patients } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";

const PatientList = () => {
  const [search, setSearch] = useState("");
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="dashboard-title">Patient Records</h1>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="bg-card rounded-xl border">
          <div className="responsive-table-wrap">
            <table className="responsive-table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Patient ID</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Phone</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Age</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Gender</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Symptoms</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 sm:px-6 py-3 font-medium text-primary">{p.id}</td>
                  <td className="px-4 sm:px-6 py-3">{p.name}</td>
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
