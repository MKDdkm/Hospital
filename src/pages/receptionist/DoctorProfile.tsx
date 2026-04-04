import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { appointments, doctors, patients } from "@/data/mockData";
import { ArrowLeft, Building2, CalendarDays, Phone, Stethoscope, UserRound } from "lucide-react";

const APPOINTMENTS_STORAGE_KEY = "medcore-receptionist-appointments";

const specializations = [
  "General Medicine",
  "Internal Medicine",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Pulmonology",
];

const departments = [
  "OPD",
  "Emergency",
  "Ward Care",
  "Diagnostics",
  "Specialty Care",
];

const hashName = (name: string) => Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { doctorName = "" } = useParams();
  const decodedDoctorName = decodeURIComponent(doctorName || "");

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

  const knownDoctors = useMemo(() => {
    const fromAppointments = appointmentSource.map((entry) => entry.doctor);
    return [...new Set([...doctors, ...fromAppointments])];
  }, [appointmentSource]);

  const exists = knownDoctors.includes(decodedDoctorName);
  const profileSeed = hashName(decodedDoctorName || "Doctor");

  const specialization = specializations[profileSeed % specializations.length];
  const department = departments[profileSeed % departments.length];
  const yearsExperience = 4 + (profileSeed % 18);
  const room = `R-${100 + (profileSeed % 40)}`;
  const contact = `+91 98${String(70000000 + (profileSeed % 9999999)).padStart(8, "0")}`;

  const appointmentsForDoctor = useMemo(
    () => appointmentSource.filter((entry) => entry.doctor === decodedDoctorName),
    [appointmentSource, decodedDoctorName],
  );

  const uniquePatients = useMemo(() => {
    const ids = new Set(appointmentsForDoctor.map((entry) => entry.patientId));
    return patients.filter((patient) => ids.has(patient.id));
  }, [appointmentsForDoctor]);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1180px] animate-fade-in-up space-y-4">
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-4 sm:p-6 shadow-[0_18px_45px_-20px_rgba(40,114,161,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/50 pb-4">
            <div>
              <h1 className="dashboard-title text-[#2872a1]">Doctor Profile</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Name: {decodedDoctorName || "Unknown"}</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/40 px-3.5 py-2 text-xs font-semibold text-[#2872a1] transition-all duration-300 hover:bg-white/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          </div>

          {!exists ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-700">
              Doctor record not found.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
              <section className="space-y-4">
                <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="grid h-16 w-16 place-items-center rounded-xl bg-gradient-to-b from-[#5f9cc0] to-[#2872a1] text-white shadow-lg">
                      <Stethoscope className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{decodedDoctorName}</p>
                      <p className="text-sm font-semibold text-[#2872a1]">{specialization}</p>
                      <p className="text-xs text-slate-500">{department} department</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Experience</p>
                      <p className="text-sm font-semibold text-slate-900">{yearsExperience} years</p>
                    </div>
                    <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Consultation Room</p>
                      <p className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-[#2872a1]" />{room}</p>
                    </div>
                    <div className="rounded-lg border border-white/40 bg-white/45 px-3 py-2 sm:col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Contact</p>
                      <p className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-[#2872a1]" />{contact}</p>
                    </div>
                  </div>
                </article>

                <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#2872a1]">Assigned Patients</h2>
                    <span className="text-xs font-semibold text-slate-600">{uniquePatients.length} patients</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {uniquePatients.length === 0 && <p className="text-xs text-slate-500">No patients linked.</p>}
                    {uniquePatients.map((patient) => (
                      <div key={patient.id} className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-800 inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5 text-[#2872a1]" />{patient.name} ({patient.id})</p>
                        <p className="text-[11px] text-slate-600">{patient.phone} | {patient.symptoms}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="space-y-4">
                <article className="rounded-xl border border-white/50 bg-white/45 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#2872a1]">Recent Appointments</h2>
                    <CalendarDays className="h-4 w-4 text-[#2872a1]" />
                  </div>
                  <div className="mt-3 space-y-2">
                    {appointmentsForDoctor.length === 0 && <p className="text-xs text-slate-500">No appointments found.</p>}
                    {appointmentsForDoctor.slice(0, 8).map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-white/40 bg-white/45 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-800">{entry.patientName}</p>
                        <p className="text-[11px] text-slate-600">{entry.date} at {entry.time} | Token {entry.token}</p>
                        <p className="text-[11px] font-semibold text-slate-700">Status: {entry.status}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorProfile;
