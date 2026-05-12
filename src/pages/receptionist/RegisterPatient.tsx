import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { generatePatientId, getPatients, pushAuditLog, savePatient } from "@/lib/storage";
import {
  UserPlus, CheckCircle2, Printer, CalendarPlus,
  User, Phone, HeartPulse, AlertCircle, ClipboardList,
} from "lucide-react";

const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "Unknown"];

interface RegisteredResult {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  bloodGroup: string;
  symptoms: string;
  registeredAt: string;
}

const printPatientCard = (patient: RegisteredResult) => {
  const win = window.open("", "_blank", "width=480,height=340");
  if (!win) return;
  win.document.write(`
    <html><head><title>Patient Card</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#0f172a;}
      .card{border:2px solid #2563eb;border-radius:12px;padding:20px;max-width:400px;}
      .title{font-size:18px;font-weight:700;color:#2563eb;margin-bottom:4px;}
      .id{font-size:13px;color:#64748b;margin-bottom:12px;}
      .row{display:flex;gap:8px;margin-bottom:6px;font-size:13px;}
      .label{color:#64748b;min-width:110px;}
      .value{font-weight:600;}
      .footer{margin-top:14px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px;}
    </style></head>
    <body>
      <div class="card">
        <div class="title">MedCore HMS — Patient Card</div>
        <div class="id">ID: ${patient.id} &nbsp;|&nbsp; Registered: ${patient.registeredAt}</div>
        <div class="row"><span class="label">Name</span><span class="value">${patient.name}</span></div>
        <div class="row"><span class="label">Phone</span><span class="value">${patient.phone}</span></div>
        <div class="row"><span class="label">Age / Gender</span><span class="value">${patient.age} / ${patient.gender}</span></div>
        <div class="row"><span class="label">Blood Group</span><span class="value">${patient.bloodGroup}</span></div>
        <div class="row"><span class="label">Symptoms</span><span class="value">${patient.symptoms}</span></div>
        <div class="footer">MedCore Hospital Management System &copy; 2026</div>
      </div>
      <script>window.onload=()=>{window.print();}</script>
    </body></html>
  `);
  win.document.close();
};

const RegisterPatient = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    dob: "",
    age: "",
    gender: "",
    bloodGroup: "Unknown",
    symptoms: "",
    emergencyContact: "",
    address: "",
    allergies: "",
    whatsapp: false,
  });

  // Auto-calculate age from DOB
  const handleDobChange = (dob: string) => {
    setForm((prev) => {
      if (!dob) return { ...prev, dob, age: "" };
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return { ...prev, dob, age: age >= 0 ? String(age) : "" };
    });
  };
  const [lastRegistered, setLastRegistered] = useState<RegisteredResult | null>(null);
  const [step, setStep] = useState<"form" | "success">("form");

  const normalizedPhone = form.phone.replace(/\D/g, "");
  const normalizedName = form.name.trim().toLowerCase();

  const duplicateMatches = useMemo(() => {
    if (!normalizedPhone && !normalizedName) return [];
    const all = getPatients();
    return all.filter((patient) => {
      const samePhone = normalizedPhone.length >= 10 && patient.phone.replace(/\D/g, "") === normalizedPhone;
      const sameName = normalizedName.length >= 3 && patient.name.trim().toLowerCase() === normalizedName;
      return samePhone || sameName;
    });
  }, [normalizedPhone, normalizedName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (normalizedPhone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    const age = Number(form.age);
    if (!Number.isFinite(age) || age < 0 || age > 120) {
      toast.error("Age must be between 0 and 120.");
      return;
    }
    const emergencyDigits = form.emergencyContact.replace(/\D/g, "");
    if (form.emergencyContact && emergencyDigits.length !== 10) {
      toast.error("Emergency contact must be a valid 10-digit number.");
      return;
    }
    if (duplicateMatches.length > 0) {
      toast.error("Possible duplicate patient found. Please verify before registering.");
      return;
    }

    const newPatient = {
      id: generatePatientId(),
      name: form.name.trim(),
      phone: normalizedPhone,
      age,
      gender: form.gender as "Male" | "Female" | "Other",
      symptoms: form.symptoms.trim(),
      registeredAt: new Date().toISOString().split("T")[0],
    };

    savePatient(newPatient);
    pushAuditLog(
      "patient.registered",
      `${newPatient.id} | ${newPatient.name} | ${newPatient.phone}${form.whatsapp ? " (WhatsApp)" : ""} | ${form.bloodGroup}`,
    );

    const result: RegisteredResult = {
      ...newPatient,
      bloodGroup: form.bloodGroup,
    };

    setLastRegistered(result);
    setStep("success");
    toast.success(`Patient ${newPatient.name} registered! ID: ${newPatient.id}`);
  };

  const resetForm = () => {
    setForm({
      name: "", phone: "", dob: "", age: "", gender: "", bloodGroup: "Unknown",
      symptoms: "", emergencyContact: "", address: "", allergies: "", whatsapp: false,
    });
    setLastRegistered(null);
    setStep("form");
  };

  if (step === "success" && lastRegistered) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-5 animate-fade-in-up">
          <h1 className="dashboard-title text-[#2563eb]">Register New Patient</h1>

          {/* Success card */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 p-6 shadow-[0_18px_45px_-20px_rgba(16,185,129,0.3)]">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-800">Patient Registered Successfully</p>
                <p className="text-sm text-emerald-600">ID assigned: <span className="font-bold">{lastRegistered.id}</span></p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Name", value: lastRegistered.name },
                { label: "Phone", value: lastRegistered.phone },
                { label: "Age / Gender", value: `${lastRegistered.age} / ${lastRegistered.gender}` },
                { label: "Blood Group", value: lastRegistered.bloodGroup },
                { label: "Registered", value: lastRegistered.registeredAt },
                { label: "Symptoms", value: lastRegistered.symptoms },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-emerald-200/60 bg-white/70 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={() => navigate(`/receptionist/appointment?patientId=${lastRegistered.id}`)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8]"
              >
                <CalendarPlus className="h-4 w-4" /> Book Appointment Now
              </Button>
              <Button
                variant="outline"
                onClick={() => printPatientCard(lastRegistered)}
                className="inline-flex items-center gap-2"
              >
                <Printer className="h-4 w-4" /> Print Patient Card
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/receptionist/patient/${lastRegistered.id}`)}
                className="inline-flex items-center gap-2"
              >
                <ClipboardList className="h-4 w-4" /> View Profile
              </Button>
              <Button variant="ghost" onClick={resetForm} className="inline-flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Register Another
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h1 className="dashboard-title text-[#2563eb]">Register New Patient</h1>
          <span className="rounded-full border border-[#2563eb]/20 bg-[#2563eb]/5 px-3 py-1 text-xs font-semibold text-[#2563eb]">
            {getPatients().length} patients on record
          </span>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-5 shadow-[0_18px_45px_-20px_rgba(40,114,161,0.25)] sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Personal info */}
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2563eb]">
                <User className="h-3.5 w-3.5" /> Personal Information
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Full Name <span className="text-rose-500">*</span></Label>
                  <Input
                    placeholder="Patient full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.dob}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => handleDobChange(e.target.value)}
                  />
                  {form.dob && form.age && (
                    <p className="text-xs text-emerald-600">Age: {form.age} years</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Age <span className="text-rose-500">*</span></Label>
                  <Input
                    type="number"
                    placeholder="Or enter age manually"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value, dob: "" })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender <span className="text-rose-500">*</span></Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Blood Group</Label>
                  <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((bg) => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input
                    placeholder="City / Area (optional)"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2563eb]">
                <Phone className="h-3.5 w-3.5" /> Contact Details
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Phone Number <span className="text-rose-500">*</span></Label>
                  <Input
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                  {normalizedPhone.length > 0 && normalizedPhone.length < 10 && (
                    <p className="text-xs text-amber-600">{10 - normalizedPhone.length} more digits needed</p>
                  )}
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={form.whatsapp}
                      onChange={(e) => setForm({ ...form, whatsapp: e.target.checked })}
                      className="rounded"
                    />
                    This number is on WhatsApp
                  </label>
                </div>
                <div className="space-y-1.5">
                  <Label>Emergency Contact <span className="text-slate-400 text-xs font-normal">(optional)</span></Label>
                  <Input
                    placeholder="Optional 10-digit number"
                    value={form.emergencyContact}
                    onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Medical */}
            <div>
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2563eb]">
                <HeartPulse className="h-3.5 w-3.5" /> Medical Information
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Presenting Symptoms <span className="text-rose-500">*</span></Label>
                  <Input
                    placeholder="Describe chief complaints / symptoms"
                    value={form.symptoms}
                    onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Known Allergies</Label>
                  <Input
                    placeholder="Drug / food allergies (optional)"
                    value={form.allergies}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Duplicate warning */}
            {duplicateMatches.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                  <AlertCircle className="h-4 w-4" /> Possible duplicate patient records
                </p>
                <div className="mt-2 space-y-1">
                  {duplicateMatches.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => navigate(`/receptionist/patient/${patient.id}`)}
                      className="block text-xs text-amber-700 hover:underline"
                    >
                      {patient.id} — {patient.name} ({patient.phone}) → View profile
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                type="submit"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-8"
              >
                <UserPlus className="h-4 w-4" /> Register Patient
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RegisterPatient;
