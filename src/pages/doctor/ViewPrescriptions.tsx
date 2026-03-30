import DashboardLayout from "@/components/DashboardLayout";
import { prescriptions } from "@/data/mockData";

const ViewPrescriptions = () => (
  <DashboardLayout>
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="dashboard-title">Prescriptions</h1>

      {prescriptions.map((rx) => (
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
              <p className="text-sm text-muted-foreground"><strong>Notes:</strong> {rx.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  </DashboardLayout>
);

export default ViewPrescriptions;
