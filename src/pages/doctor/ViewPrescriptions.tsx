import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { doctors, prescriptions } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface StoredPrescription {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  medicines: { name: string; dosage: string; timing: string; duration: string }[];
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

const ViewPrescriptions = () => {
  const { email } = useAuth();
  const activeDoctor = useMemo(() => resolveDoctorFromEmail(email), [email]);

  const [localPrescriptions] = useState<StoredPrescription[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredPrescription[]) : [];
    } catch {
      return [];
    }
  });

  const [dispatchMap, setDispatchMap] = useState<Record<string, PharmacyDispatch>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(PHARMACY_DISPATCH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, PharmacyDispatch>) : {};
    } catch {
      return {};
    }
  });

  const myPrescriptions = useMemo(
    () => [...localPrescriptions, ...prescriptions]
      .filter((entry) => entry.doctor === activeDoctor)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [activeDoctor, localPrescriptions],
  );

  const sendToPharmacy = (prescriptionId: string) => {
    const updated = {
      ...dispatchMap,
      [prescriptionId]: { sent: true, sentAt: new Date().toISOString() },
    };

    setDispatchMap(updated);
    window.localStorage.setItem(PHARMACY_DISPATCH_STORAGE_KEY, JSON.stringify(updated));
    toast.success("Prescription forwarded to pharmacy.");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        <h1 className="dashboard-title">Prescriptions</h1>

        {myPrescriptions.length === 0 && (
          <div className="bg-card rounded-xl border p-5 text-sm text-muted-foreground">
            No prescriptions found for {activeDoctor}.
          </div>
        )}

        {myPrescriptions.map((rx) => {
          const pharmacyStatus = dispatchMap[rx.id];

          return (
            <div key={rx.id} className="bg-card rounded-xl border">
              <div className="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-semibold">{rx.patientName} ({rx.patientId})</p>
                  <p className="text-sm text-muted-foreground">By {rx.doctor} • {rx.date}</p>
                </div>
                <span className="text-xs font-medium text-primary">{rx.id}</span>
              </div>
              <div className="p-4 sm:p-6">
                <div className="responsive-table-wrap">
                  <table className="responsive-table responsive-table--compact mb-4">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-muted-foreground font-medium">Medicine</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Dosage</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Timing</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rx.medicines.map((m, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{m.name}</td>
                          <td className="py-2">{m.dosage}</td>
                          <td className="py-2">{m.timing}</td>
                          <td className="py-2">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {rx.notes && (
                  <p className="text-sm text-muted-foreground mb-3"><strong>Notes:</strong> {rx.notes}</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${pharmacyStatus?.sent ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {pharmacyStatus?.sent ? "Sent to Pharmacy" : "Not Sent to Pharmacy"}
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => sendToPharmacy(rx.id)}
                    disabled={Boolean(pharmacyStatus?.sent)}
                  >
                    {pharmacyStatus?.sent ? "Already Sent" : "Send to Pharmacy"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default ViewPrescriptions;
