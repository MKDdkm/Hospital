import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { patients } from "@/data/mockData";
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";

interface MedicineRow { name: string; dosage: string; timing: string; duration: string }

const AddPrescription = () => {
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { name: "", dosage: "", timing: "", duration: "" }
  ]);

  const addRow = () => setMedicines([...medicines, { name: "", dosage: "", timing: "", duration: "" }]);
  const removeRow = (i: number) => setMedicines(medicines.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof MedicineRow, value: string) => {
    const updated = [...medicines];
    updated[i][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Prescription saved successfully!");
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6 animate-fade-in-up">
        <h1 className="dashboard-title">Add Prescription</h1>

        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 max-w-xs">
              <Label>Patient</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Medicines</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                  <PlusCircle className="w-4 h-4 mr-1" /> Add Medicine
                </Button>
              </div>

              {medicines.map((med, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end">
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Medicine</Label>}
                    <Input placeholder="Name" value={med.name} onChange={(e) => updateRow(i, "name", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Dosage</Label>}
                    <Input placeholder="e.g. 1 tablet" value={med.dosage} onChange={(e) => updateRow(i, "dosage", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Timing</Label>}
                    <Input placeholder="After meals" value={med.timing} onChange={(e) => updateRow(i, "timing", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Duration</Label>}
                    <Input placeholder="5 days" value={med.duration} onChange={(e) => updateRow(i, "duration", e.target.value)} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="w-full sm:w-auto" onClick={() => removeRow(i)} disabled={medicines.length === 1}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <Button type="submit" className="w-full sm:w-auto px-8">Save Prescription</Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddPrescription;
