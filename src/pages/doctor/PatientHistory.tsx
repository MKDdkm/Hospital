import DashboardLayout from "@/components/DashboardLayout";
import { patients, appointments, prescriptions } from "@/data/mockData";

const PatientHistory = () => (
  <DashboardLayout>
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="dashboard-title">Patient History</h1>

      <div className="space-y-6">
        {patients.slice(0, 3).map((p) => {
          const patientAppts = appointments.filter(a => a.patientId === p.id);
          const patientRx = prescriptions.filter(rx => rx.patientId === p.id);

          return (
            <div key={p.id} className="bg-card rounded-xl border">
              <div className="px-4 sm:px-6 py-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.id} • {p.age}y • {p.gender}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Symptoms: {p.symptoms}</span>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {patientAppts.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Appointments</p>
                    {patientAppts.map((a) => (
                      <div key={a.id} className="flex items-center gap-4 text-sm py-1">
                        <span className="text-muted-foreground">{a.date}</span>
                        <span>{a.doctor}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          a.status === "Completed" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                        }`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                {patientRx.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Prescriptions</p>
                    {patientRx.map((rx) => (
                      <div key={rx.id} className="text-sm py-1">
                        <span className="text-muted-foreground">{rx.date}</span> — {rx.medicines.map(m => m.name).join(", ")}
                      </div>
                    ))}
                  </div>
                )}
                {patientAppts.length === 0 && patientRx.length === 0 && (
                  <p className="text-sm text-muted-foreground">No history available.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </DashboardLayout>
);

export default PatientHistory;
