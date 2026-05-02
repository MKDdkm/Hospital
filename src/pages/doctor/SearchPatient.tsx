import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPatients } from "@/lib/storage";
import { Search, FileText, FilePlus } from "lucide-react";

const SearchPatient = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReturnType<typeof getPatients>>([]);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = () => {
    setSearched(true);
    const all = getPatients();
    setResults(
      all.filter(
        (p) =>
          p.id.toLowerCase().includes(query.toLowerCase()) ||
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.phone.includes(query),
      ),
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[900px] space-y-6 animate-fade-in-up">
        <h1 className="dashboard-title">Search Patient</h1>

        <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Patient ID, name, or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} className="w-full sm:w-auto">Search</Button>
        </div>

        {searched && (
          <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-sm overflow-hidden">
            {results.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">No patients found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Age</th>
                      <th className="px-4 py-3 text-left">Gender</th>
                      <th className="px-4 py-3 text-left">Symptoms</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[#2872a1]">{p.id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                        <td className="px-4 py-3 text-slate-600">{p.age}y</td>
                        <td className="px-4 py-3 text-slate-600">{p.gender}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{p.symptoms}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/doctor/prescriptions?patient=${p.id}`)}
                              className="inline-flex items-center gap-1 text-xs"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Rx
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => navigate(`/doctor/write-rx?patientId=${p.id}&patientName=${encodeURIComponent(p.name)}`)}
                              className="inline-flex items-center gap-1 text-xs bg-[#2872a1] hover:bg-[#1a4d73]"
                            >
                              <FilePlus className="w-3.5 h-3.5" /> Write Rx
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SearchPatient;
