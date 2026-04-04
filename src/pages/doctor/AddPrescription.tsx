import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { doctors, patients } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";

interface MedicineRow { name: string; dosage: string; timing: string; duration: string }

interface StoredPrescription {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  medicines: MedicineRow[];
  notes: string;
  date: string;
}

interface PharmacyDispatch {
  sent: boolean;
  sentAt?: string;
}

const PRESCRIPTIONS_STORAGE_KEY = "medcore-doctor-prescriptions";
const PHARMACY_DISPATCH_STORAGE_KEY = "medcore-pharmacy-dispatch";

const resolveDoctorFromEmail = (email: string | null) => {
  if (!email) return doctors[0];
  const localPart = email.split("@")[0].toLowerCase();

  const matched = doctors.find((doctor) => {
    const normalized = doctor.replace("Dr. ", "").toLowerCase();
    return normalized.split(" ").some((token) => localPart.includes(token));
  });

  return matched ?? doctors[0];
};

const AddPrescription = () => {
  const { email } = useAuth();
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [sendToPharmacyNow, setSendToPharmacyNow] = useState(true);
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

  const resetForm = () => {
    setPatientId("");
    setNotes("");
    setMedicines([{ name: "", dosage: "", timing: "", duration: "" }]);
    setSendToPharmacyNow(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPatient = patients.find((patient) => patient.id === patientId);
    if (!selectedPatient) {
      toast.error("Please select a patient.");
      return;
    }

    const cleanedMedicines = medicines.filter(
      (medicine) => medicine.name.trim() && medicine.dosage.trim() && medicine.timing.trim() && medicine.duration.trim(),
    );

    if (cleanedMedicines.length === 0) {
      toast.error("Add at least one complete medicine row.");
      return;
    }

    const timestamp = Date.now();
    const prescriptionId = `RX-${timestamp}`;
    const currentDoctor = resolveDoctorFromEmail(email);

    const newPrescription: StoredPrescription = {
      id: prescriptionId,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctor: currentDoctor,
      medicines: cleanedMedicines,
      notes: notes.trim(),
      date: new Date().toISOString().split("T")[0],
    };

    try {
      const existingRaw = window.localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
      const existing = existingRaw ? (JSON.parse(existingRaw) as StoredPrescription[]) : [];
      const updated = [newPrescription, ...existing];
      window.localStorage.setItem(PRESCRIPTIONS_STORAGE_KEY, JSON.stringify(updated));

      if (sendToPharmacyNow) {
        const dispatchRaw = window.localStorage.getItem(PHARMACY_DISPATCH_STORAGE_KEY);
        const dispatchMap = dispatchRaw ? (JSON.parse(dispatchRaw) as Record<string, PharmacyDispatch>) : {};
        dispatchMap[prescriptionId] = { sent: true, sentAt: new Date().toISOString() };
        window.localStorage.setItem(PHARMACY_DISPATCH_STORAGE_KEY, JSON.stringify(dispatchMap));
      }

      toast.success(sendToPharmacyNow ? "Prescription saved and sent to pharmacy." : "Prescription saved successfully!");
      resetForm();
    } catch {
      toast.error("Unable to save prescription. Please try again.");
    }
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

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={sendToPharmacyNow}
                onChange={(e) => setSendToPharmacyNow(e.target.checked)}
              />
              Send this prescription to pharmacy immediately
            </label>

            <Button type="submit" className="w-full sm:w-auto px-8">
              {sendToPharmacyNow ? "Save & Send to Pharmacy" : "Save Prescription"}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddPrescription;
