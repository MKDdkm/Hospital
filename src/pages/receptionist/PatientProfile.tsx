import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { appointments, bills, patients, prescriptions } from "@/data/mockData";
import { ArrowLeft, CalendarDays, Phone, Stethoscope, ReceiptText, Clock3, UserCircle2 } from "lucide-react";

const APPOINTMENTS_STORAGE_KEY = "medcore-receptionist-appointments";

const PatientProfile = () => {
  const navigate = useNavigate();
  const { patientId = "" } = useParams();

  const patient = useMemo(
    () => patients.find((entry) => entry.id === patientId),
    [patientId],
  );

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

  const appointmentHistory = useMemo(
    () => appointmentSource.filter((entry) => entry.patientId === patientId),
    [appointmentSource, patientId],
  );

  const latestPrescription = useMemo(
    () => prescriptions
      .filter((entry) => entry.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date))[0],
    [patientId],
  );

  const billHistory = useMemo(
    () => bills.filter((entry) => entry.patientId === patientId),
    [patientId],
  );

  const pendingBills = useMemo(
    () => billHistory.filter((entry) => entry.status === "Pending"),
    [billHistory],
  );

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1180px] animate-fade-in-up space-y-4">
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 sm:p-6 shadow-[0_18px_45px_-20px_rgba(40,114,161,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/50 pb-4">
            <div>
              <h1 className="dashboard-title text-[#2872a1]">Patient Profile</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">ID: {patientId || "Unknown"}</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/40 px-3.5 py-2 text-xs font-semibold text-[#2872a1] transition-all duration-300 hover:bg-white/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          </div>

          {!patient ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-700">
              Patient record not found for this ID.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
              <section className="space-y-4">
                <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                  <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#2872a1]">Basic Details</h2>
                  <div className="mt-3 flex items-center gap-4 rounded-xl border border-white/40 bg-white/50 p-3">
                    <div className="grid h-24 w-24 place-items-center rounded-xl border border-white/60 bg-gradient-to-b from-white/70 to-white/40 shadow-[0_12px_25px_-15px_rgba(40,114,161,0.45)]">
                      <UserCircle2 className="h-14 w-14 text-[#2872a1]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Patient Photo</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 truncate">{patient.name}</p>
                      <p className="text-[11px] text-slate-500">Image placeholder reserved for profile picture</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Name</p>
                      <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                    </div>
                    <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Phone</p>
                      <p className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-[#2872a1]" />{patient.phone}</p>
                    </div>
                    <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Age / Gender</p>
                      <p className="text-sm font-semibold text-slate-900">{patient.age} / {patient.gender}</p>
                    </div>
                    <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Registered On</p>
                      <p className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-[#2872a1]" />{patient.registeredAt}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Primary Symptoms</p>
                    <p className="text-sm font-semibold text-slate-900">{patient.symptoms}</p>
                  </div>
                </article>

                <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#2872a1]">Appointments</h2>
                    <span className="text-xs font-semibold text-slate-600">{appointmentHistory.length} visits</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {appointmentHistory.length === 0 && <p className="text-xs text-slate-500">No appointments recorded.</p>}
                    {appointmentHistory.map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-800">{entry.id} - {entry.doctor}</p>
                        <p className="mt-0.5 text-[11px] text-slate-600 inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-[#2872a1]" />{entry.date} at {entry.time} | Token {entry.token}</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-700">Status: {entry.status}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="space-y-4">
                <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#2872a1]">Billing</h2>
                    <ReceiptText className="h-4 w-4 text-[#2872a1]" />
                  </div>
                  <p className="mt-2 text-xs text-slate-600">Pending files: <span className="font-bold text-amber-700">{pendingBills.length}</span></p>
                  <div className="mt-3 space-y-2">
                    {billHistory.length === 0 && <p className="text-xs text-slate-500">No billing records.</p>}
                    {billHistory.map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-800">{entry.id}</p>
                        <p className="text-[11px] text-slate-600">{entry.date}</p>
                        <p className="mt-1 text-xs font-bold text-slate-900">Amount: Rs {entry.total.toLocaleString()}</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-700">Status: {entry.status}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#2872a1]">Latest Prescription</h2>
                    <Stethoscope className="h-4 w-4 text-[#2872a1]" />
                  </div>
                  {!latestPrescription ? (
                    <p className="mt-2 text-xs text-slate-500">No prescriptions available.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs font-semibold text-slate-800">{latestPrescription.id} - {latestPrescription.date}</p>
                      <p className="text-xs text-slate-600">Doctor: {latestPrescription.doctor}</p>
                      <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2 text-xs text-slate-700">
                        {latestPrescription.medicines.map((medicine) => (
                          <p key={medicine.name}>{medicine.name} ({medicine.dosage}) - {medicine.duration}</p>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-600">Notes: {latestPrescription.notes}</p>
                    </div>
                  )}
                </article>
              </section>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientProfile;
