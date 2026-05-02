/**
 * Shared localStorage keys and typed helpers used across all four panels.
 * All cross-panel data flows through these keys so every module reads the
 * same source of truth.
 */

import type { Patient, Appointment } from "@/data/mockData";

// ─── Storage keys ────────────────────────────────────────────────────────────
export const KEYS = {
  PATIENTS: "medcore-patients",
  APPOINTMENTS: "medcore-receptionist-appointments",
  PRESCRIPTIONS: "medcore-doctor-prescriptions",
  PHARMACY_DISPATCH: "medcore-pharmacy-dispatch",
  PHARMACY_WORKFLOW: "medcore-pharmacy-workflow",
  ROOM_OCCUPANCY: "medcore-room-occupancy",
  BILLING_PAYMENT_DRAFTS: "medcore-billing-payment-drafts",
  BILLING_ROOM_DRAFTS: "medcore-billing-room-drafts",
  BILLING_DISCHARGE_DRAFTS: "medcore-billing-discharge-drafts",
  BILLING_CASE: "medcore-billing-case-by-bill",
  AUDIT_LOGS: "medcore-receptionist-audit-logs",
  SHIFT_NOTES: "medcore-receptionist-shift-notes",
  DASHBOARD_PREFS: "medcore-receptionist-dashboard-prefs",
} as const;

// ─── Generic helpers ──────────────────────────────────────────────────────────
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded – silently ignore
  }
}

// ─── Patients ─────────────────────────────────────────────────────────────────
import { patients as mockPatients } from "@/data/mockData";

export function getPatients(): Patient[] {
  const stored = read<Patient[]>(KEYS.PATIENTS, []);
  // Merge: stored overrides mock by id, then append new ones
  const storedIds = new Set(stored.map((p) => p.id));
  const merged = [...mockPatients.filter((p) => !storedIds.has(p.id)), ...stored];
  return merged;
}

export function savePatient(patient: Patient): void {
  const current = read<Patient[]>(KEYS.PATIENTS, []);
  const exists = current.findIndex((p) => p.id === patient.id);
  if (exists >= 0) {
    current[exists] = patient;
  } else {
    current.push(patient);
  }
  write(KEYS.PATIENTS, current);
}

export function generatePatientId(): string {
  const all = getPatients();
  const maxNum = all.reduce((max, p) => {
    const num = parseInt(p.id.replace("P-", ""), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 1000);
  return `P-${maxNum + 1}`;
}

// ─── Global token counter (never repeats across any doctor/date) ──────────────
const TOKEN_COUNTER_KEY = "medcore-global-token-counter";

export function getNextToken(): number {
  const current = read<number>(TOKEN_COUNTER_KEY, 0);
  const next = current + 1;
  write(TOKEN_COUNTER_KEY, next);
  return next;
}

export function peekNextToken(): number {
  return read<number>(TOKEN_COUNTER_KEY, 0) + 1;
}

// ─── Appointments ─────────────────────────────────────────────────────────────
import { appointments as mockAppointments } from "@/data/mockData";

export type LocalAppointmentStatus = Appointment["status"] | "Checked In" | "No Show";

export interface LocalAppointment extends Omit<Appointment, "status"> {
  status: LocalAppointmentStatus;
  priority?: "Normal" | "Emergency" | "Senior" | "Follow-up";
}

export function getAppointments(): LocalAppointment[] {
  return read<LocalAppointment[]>(KEYS.APPOINTMENTS, mockAppointments.map((a) => ({ ...a })));
}

export function saveAppointments(appointments: LocalAppointment[]): void {
  write(KEYS.APPOINTMENTS, appointments);
}

// ─── Prescriptions ────────────────────────────────────────────────────────────
export interface StoredPrescription {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  medicines: { name: string; dosage: string; timing: string; duration: string }[];
  notes: string;
  date: string;
}

export function getPrescriptions(): StoredPrescription[] {
  return read<StoredPrescription[]>(KEYS.PRESCRIPTIONS, []);
}

export function sendPrescriptionToPharmacy(prescriptionId: string): void {
  const dispatch = read<Record<string, { sent: boolean; sentAt?: string }>>(KEYS.PHARMACY_DISPATCH, {});
  dispatch[prescriptionId] = { sent: true, sentAt: new Date().toISOString() };
  write(KEYS.PHARMACY_DISPATCH, dispatch);
  pushAuditLog("pharmacy.dispatch", `RX ${prescriptionId} sent to pharmacy`);
}

// ─── Vitals ───────────────────────────────────────────────────────────────────
export interface VitalsRecord {
  id: string;
  patientId: string;
  appointmentId?: string;
  recordedAt: string;
  bp: string;        // e.g. "120/80"
  pulse: string;     // bpm
  temp: string;      // °C
  weight: string;    // kg
  spo2: string;      // %
  notes: string;
}

const VITALS_KEY = "medcore-patient-vitals";

export function getVitals(patientId?: string): VitalsRecord[] {
  const all = read<VitalsRecord[]>(VITALS_KEY, []);
  return patientId ? all.filter((v) => v.patientId === patientId) : all;
}

export function saveVitals(record: VitalsRecord): void {
  const all = read<VitalsRecord[]>(VITALS_KEY, []);
  const idx = all.findIndex((v) => v.id === record.id);
  if (idx >= 0) all[idx] = record;
  else all.unshift(record);
  write(VITALS_KEY, all.slice(0, 500));
}
export interface AuditLog {
  id: string;
  type: string;
  at: string;
  details: string;
}

export function getAuditLogs(): AuditLog[] {
  return read<AuditLog[]>(KEYS.AUDIT_LOGS, []);
}

export function pushAuditLog(type: string, details: string): void {
  const logs = getAuditLogs();
  logs.unshift({ id: `AL-${Date.now()}`, type, at: new Date().toISOString(), details });
  write(KEYS.AUDIT_LOGS, logs.slice(0, 80));
}

// ─── Bills (live) ─────────────────────────────────────────────────────────────
export interface LiveBill {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  doctor?: string;
  items: { description: string; amount: number }[];
  total: number;
  date: string;
  status: "Paid" | "Pending" | "Draft";
  createdAt: string;
}

const LIVE_BILLS_KEY = "medcore-live-bills";

export function getLiveBills(): LiveBill[] {
  return read<LiveBill[]>(LIVE_BILLS_KEY, []);
}

export function saveLiveBill(bill: LiveBill): void {
  const current = getLiveBills();
  const idx = current.findIndex((b) => b.id === bill.id);
  if (idx >= 0) current[idx] = bill;
  else current.unshift(bill);
  write(LIVE_BILLS_KEY, current.slice(0, 200));
}

export function createBillDraftFromAppointment(params: {
  patientId: string;
  patientName: string;
  appointmentId: string;
  doctor: string;
  date: string;
}): LiveBill {
  const bill: LiveBill = {
    id: `LB-${Date.now().toString().slice(-7)}`,
    patientId: params.patientId,
    patientName: params.patientName,
    appointmentId: params.appointmentId,
    doctor: params.doctor,
    items: [{ description: "Consultation Fee", amount: 500 }],
    total: 500,
    date: params.date,
    status: "Draft",
    createdAt: new Date().toISOString(),
  };
  saveLiveBill(bill);
  pushAuditLog("billing.draft.created", `${bill.id} | ${params.patientName} | ${params.doctor}`);
  return bill;
}
