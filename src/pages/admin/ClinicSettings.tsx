import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pushAuditLog } from "@/lib/storage";
import { toast } from "sonner";
import {
  Building2, Phone, MapPin, Clock3, IndianRupee,
  Save, CheckCircle2, Stethoscope,
} from "lucide-react";

const CLINIC_SETTINGS_KEY = "medcore-clinic-settings";

export interface ClinicSettings {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  openTime: string;
  closeTime: string;
  workingDays: string;
  consultationFee: string;
  emergencyFee: string;
  followUpFee: string;
  currency: string;
  gstNumber: string;
  registrationNumber: string;
}

const DEFAULT_SETTINGS: ClinicSettings = {
  name: "MedCore Clinic",
  tagline: "Your health, our priority",
  phone: "+91 98765 43210",
  email: "info@medcore.com",
  address: "123, Health Street",
  city: "Hyderabad",
  pincode: "500001",
  openTime: "09:00",
  closeTime: "20:00",
  workingDays: "Mon – Sat",
  consultationFee: "500",
  emergencyFee: "1000",
  followUpFee: "300",
  currency: "INR",
  gstNumber: "",
  registrationNumber: "",
};

export function getClinicSettings(): ClinicSettings {
  try {
    const raw = window.localStorage.getItem(CLINIC_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ClinicSettings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const ClinicSettings = () => {
  const [form, setForm] = useState<ClinicSettings>(() => getClinicSettings());
  const [saved, setSaved] = useState(false);

  const set = (field: keyof ClinicSettings, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    window.localStorage.setItem(CLINIC_SETTINGS_KEY, JSON.stringify(form));
    pushAuditLog("admin.clinic.settings.updated", `Clinic settings updated — ${form.name}`);
    setSaved(true);
    toast.success("Clinic settings saved.");
    setTimeout(() => setSaved(false), 2500);
  };

  const sections = [
    {
      title: "Clinic Identity",
      icon: <Building2 className="h-4 w-4" />,
      fields: [
        { label: "Clinic Name", field: "name" as const, placeholder: "MedCore Clinic", required: true },
        { label: "Tagline", field: "tagline" as const, placeholder: "Your health, our priority" },
        { label: "Registration Number", field: "registrationNumber" as const, placeholder: "MH/2024/XXXX" },
        { label: "GST Number", field: "gstNumber" as const, placeholder: "27XXXXX" },
      ],
    },
    {
      title: "Contact Details",
      icon: <Phone className="h-4 w-4" />,
      fields: [
        { label: "Phone", field: "phone" as const, placeholder: "+91 98765 43210", required: true },
        { label: "Email", field: "email" as const, placeholder: "info@clinic.com" },
      ],
    },
    {
      title: "Address",
      icon: <MapPin className="h-4 w-4" />,
      fields: [
        { label: "Street Address", field: "address" as const, placeholder: "123, Health Street" },
        { label: "City", field: "city" as const, placeholder: "Hyderabad" },
        { label: "Pincode", field: "pincode" as const, placeholder: "500001" },
      ],
    },
    {
      title: "Working Hours",
      icon: <Clock3 className="h-4 w-4" />,
      fields: [
        { label: "Opening Time", field: "openTime" as const, type: "time" },
        { label: "Closing Time", field: "closeTime" as const, type: "time" },
        { label: "Working Days", field: "workingDays" as const, placeholder: "Mon – Sat" },
      ],
    },
    {
      title: "Consultation Fees",
      icon: <IndianRupee className="h-4 w-4" />,
      fields: [
        { label: "Consultation Fee (₹)", field: "consultationFee" as const, placeholder: "500", type: "number" },
        { label: "Emergency Fee (₹)", field: "emergencyFee" as const, placeholder: "1000", type: "number" },
        { label: "Follow-up Fee (₹)", field: "followUpFee" as const, placeholder: "300", type: "number" },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[900px] space-y-6 animate-fade-in-up">

        {/* Header */}
        <section className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">Admin</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Clinic Settings</h1>
              <p className="mt-1 text-sm text-slate-500">Used in print slips, prescription headers, and billing</p>
            </div>
            <div className="hidden sm:grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-700">
              <Stethoscope className="h-7 w-7" />
            </div>
          </div>
        </section>

        {/* Live preview card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Preview — Prescription Header</p>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-[#1e5a80]">{form.name || "Clinic Name"}</p>
                <p className="text-xs text-slate-500">{form.tagline}</p>
                <p className="text-xs text-slate-500 mt-1">{form.address}{form.city ? `, ${form.city}` : ""}{form.pincode ? ` — ${form.pincode}` : ""}</p>
                <p className="text-xs text-slate-500">{form.phone}{form.email ? ` · ${form.email}` : ""}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>{form.workingDays}</p>
                <p>{form.openTime} – {form.closeTime}</p>
                {form.registrationNumber && <p>Reg: {form.registrationNumber}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Settings sections */}
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl p-5 shadow-sm">
              <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#2872a1]">
                {section.icon} {section.title}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {section.fields.map(({ label, field, placeholder, required, type }) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-xs">
                      {label} {required && <span className="text-rose-500">*</span>}
                    </Label>
                    <Input
                      type={type ?? "text"}
                      placeholder={placeholder}
                      value={form[field]}
                      onChange={(e) => set(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pb-4">
          <Button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2872a1] to-[#1a4d73] px-8"
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved!" : "Save Settings"}
          </Button>
          <p className="text-xs text-slate-400">Changes apply to all print slips and billing documents</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClinicSettings;
