import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { patients } from "@/data/mockData";
import { Search } from "lucide-react";

const SearchPatient = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<typeof patients>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    setSearched(true);
    setResults(patients.filter(p => p.id.toLowerCase().includes(query.toLowerCase()) || p.name.toLowerCase().includes(query.toLowerCase())));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        <h1 className="dashboard-title">Search Patient</h1>

        <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter Patient ID or Name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} className="w-full sm:w-auto">Search</Button>
        </div>

        {searched && (
          <div className="bg-card rounded-xl border">
            {results.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">No patients found.</p>
            ) : (
              <div className="responsive-table-wrap">
                <table className="responsive-table">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">ID</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Age</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Gender</th>
                    <th className="px-4 sm:px-6 py-3 text-left font-medium text-muted-foreground">Symptoms</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 sm:px-6 py-3 font-medium text-primary">{p.id}</td>
                      <td className="px-4 sm:px-6 py-3">{p.name}</td>
                      <td className="px-4 sm:px-6 py-3">{p.age}</td>
                      <td className="px-4 sm:px-6 py-3">{p.gender}</td>
                      <td className="px-4 sm:px-6 py-3">{p.symptoms}</td>
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
