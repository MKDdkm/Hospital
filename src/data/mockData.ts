export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  symptoms: string;
  registeredAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  date: string;
  time: string;
  token: number;
  status: "Scheduled" | "Completed" | "Cancelled";
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctor: string;
  medicines: { name: string; dosage: string; timing: string; duration: string }[];
  notes: string;
  date: string;
}

export interface Bill {
  id: string;
  patientId: string;
  patientName: string;
  items: { description: string; amount: number }[];
  total: number;
  date: string;
  status: "Paid" | "Pending";
}

export type RoomType = "General Ward" | "Semi-Private Room" | "Private Room" | "ICU";

export interface RoomServiceRate {
  roomType: RoomType;
  pricePerDay: number;
  availability: "Available" | "Limited" | "Full";
  defaultExtraCareCharge?: number;
}

export const patients: Patient[] = [
  { id: "P-1001", name: "Rahul Sharma", phone: "9876543210", age: 34, gender: "Male", symptoms: "Fever, Headache", registeredAt: "2026-03-25" },
  { id: "P-1002", name: "Priya Patel", phone: "9876543211", age: 28, gender: "Female", symptoms: "Cough, Cold", registeredAt: "2026-03-26" },
  { id: "P-1003", name: "Amit Kumar", phone: "9876543212", age: 45, gender: "Male", symptoms: "Back Pain", registeredAt: "2026-03-27" },
  { id: "P-1004", name: "Sneha Reddy", phone: "9876543213", age: 22, gender: "Female", symptoms: "Skin Rash", registeredAt: "2026-03-27" },
  { id: "P-1005", name: "Vikram Singh", phone: "9876543214", age: 55, gender: "Male", symptoms: "Chest Pain, Breathlessness", registeredAt: "2026-03-28" },
];

export const appointments: Appointment[] = [
  { id: "A-2001", patientId: "P-1001", patientName: "Rahul Sharma", doctor: "Dr. Ananya Gupta", date: "2026-03-28", time: "10:00 AM", token: 1, status: "Scheduled" },
  { id: "A-2002", patientId: "P-1002", patientName: "Priya Patel", doctor: "Dr. Rajesh Iyer", date: "2026-03-28", time: "10:30 AM", token: 2, status: "Scheduled" },
  { id: "A-2003", patientId: "P-1003", patientName: "Amit Kumar", doctor: "Dr. Ananya Gupta", date: "2026-03-28", time: "11:00 AM", token: 3, status: "Completed" },
  { id: "A-2004", patientId: "P-1004", patientName: "Sneha Reddy", doctor: "Dr. Meena Nair", date: "2026-03-28", time: "11:30 AM", token: 4, status: "Scheduled" },
];

export const prescriptions: Prescription[] = [
  {
    id: "RX-3001", patientId: "P-1003", patientName: "Amit Kumar", doctor: "Dr. Ananya Gupta",
    medicines: [
      { name: "Ibuprofen 400mg", dosage: "1 tablet", timing: "After meals", duration: "5 days" },
      { name: "Muscle Relaxant", dosage: "1 tablet", timing: "Before bed", duration: "7 days" },
    ],
    notes: "Avoid heavy lifting. Follow up in 1 week.", date: "2026-03-27",
  },
];

export const bills: Bill[] = [
  {
    id: "B-4001", patientId: "P-1003", patientName: "Amit Kumar",
    items: [
      { description: "Consultation Fee", amount: 500 },
      { description: "X-Ray", amount: 800 },
      { description: "Medicines", amount: 350 },
    ],
    total: 1650, date: "2026-03-27", status: "Paid",
  },
  {
    id: "B-4002", patientId: "P-1001", patientName: "Rahul Sharma",
    items: [
      { description: "Consultation Fee", amount: 500 },
      { description: "Blood Test", amount: 600 },
    ],
    total: 1100, date: "2026-03-28", status: "Pending",
  },
];

export const roomServiceRates: RoomServiceRate[] = [
  { roomType: "General Ward", pricePerDay: 1200, availability: "Available" },
  { roomType: "Semi-Private Room", pricePerDay: 2500, availability: "Limited" },
  { roomType: "Private Room", pricePerDay: 4200, availability: "Available" },
  { roomType: "ICU", pricePerDay: 8500, availability: "Limited", defaultExtraCareCharge: 2000 },
];

export const doctors = [
  "Dr. Ananya Gupta",
  "Dr. Rajesh Iyer",
  "Dr. Meena Nair",
  "Dr. Sanjay Verma",
];

export const receptionists = [
  "Neha Singh",
  "Pooja Desai",
  "Kavya Sharma",
];
