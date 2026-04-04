import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { appointments, bills, patients, type Appointment } from "@/data/mockData";

type LocalAppointmentStatus = Appointment["status"] | "Checked In" | "No Show";

interface LocalAppointment extends Omit<Appointment, "status"> {
  status: LocalAppointmentStatus;
}

interface PaymentDraft {
  paidAmount: number;
  paymentMode: "Cash" | "Card" | "UPI" | "Insurance";
}

interface RoomServiceDraft {
  includeInBill: boolean;
  pricePerDay: number;
  numberOfDays: number;
  roomType: string;
  extraCareCharge: number;
}

const APPOINTMENTS_STORAGE_KEY = "medcore-receptionist-appointments";
const PAYMENT_DRAFTS_STORAGE_KEY = "medcore-billing-payment-drafts";
const ROOM_DRAFTS_STORAGE_KEY = "medcore-billing-room-drafts";

const getStoredAppointments = (): LocalAppointment[] => {
  if (typeof window === "undefined") return appointments.map((entry) => ({ ...entry }));
  try {
    const raw = window.localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!raw) return appointments.map((entry) => ({ ...entry }));
    const parsed = JSON.parse(raw) as LocalAppointment[];
    return Array.isArray(parsed) ? parsed : appointments.map((entry) => ({ ...entry }));
  } catch {
    return appointments.map((entry) => ({ ...entry }));
  }
};

const getStoredPaymentDrafts = (): Record<string, PaymentDraft> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PAYMENT_DRAFTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PaymentDraft>;
  } catch {
    return {};
  }
};

const getStoredRoomDrafts = (): Record<string, RoomServiceDraft> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROOM_DRAFTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, RoomServiceDraft>;
  } catch {
    return {};
  }
};

const ClosingReport = () => {
  const reportDate = new Date().toISOString().split("T")[0];

  const metrics = useMemo(() => {
    const allAppointments = getStoredAppointments();
    const paymentDrafts = getStoredPaymentDrafts();
    const roomDrafts = getStoredRoomDrafts();

    const todayAppointments = allAppointments.filter((appointment) => appointment.date === reportDate);
    const scheduled = todayAppointments.filter((appointment) => appointment.status === "Scheduled").length;
    const checkedIn = todayAppointments.filter((appointment) => appointment.status === "Checked In").length;
    const completed = todayAppointments.filter((appointment) => appointment.status === "Completed").length;
    const noShow = todayAppointments.filter((appointment) => appointment.status === "No Show").length;
    const cancelled = todayAppointments.filter((appointment) => appointment.status === "Cancelled").length;

    const totalPatientsToday = new Set(todayAppointments.map((appointment) => appointment.patientId)).size;

    const billRows = bills.map((bill) => {
      const serviceTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
      const room = roomDrafts[bill.id];
      const roomTotal = room?.includeInBill
        ? (room.pricePerDay * room.numberOfDays) + (room.roomType === "ICU" ? room.extraCareCharge : 0)
        : 0;
      const total = serviceTotal + roomTotal;
      const paid = Math.max(0, Math.min(paymentDrafts[bill.id]?.paidAmount ?? 0, total));
      const due = Math.max(0, total - paid);
      return { billId: bill.id, patient: bill.patientName, total, paid, due };
    });

    const grossRevenue = billRows.reduce((sum, row) => sum + row.total, 0);
    const collected = billRows.reduce((sum, row) => sum + row.paid, 0);
    const outstanding = billRows.reduce((sum, row) => sum + row.due, 0);

    const collectionRate = grossRevenue === 0 ? 0 : Math.round((collected / grossRevenue) * 100);
    const noShowRate = todayAppointments.length === 0 ? 0 : Math.round((noShow / todayAppointments.length) * 100);

    return {
      scheduled,
      checkedIn,
      completed,
      noShow,
      cancelled,
      totalPatientsToday,
      grossRevenue,
      collected,
      outstanding,
      collectionRate,
      noShowRate,
      billRows,
    };
  }, [reportDate]);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1200px] space-y-6 animate-fade-in-up">
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-5 text-slate-900 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.35)] sm:p-7">
          <h1 className="dashboard-title text-slate-900">Daily Closing Report</h1>
          <p className="mt-1 text-sm text-slate-600">Operational and financial closing snapshot for {reportDate}.</p>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-xs text-slate-500">Appointments Today</p><p className="text-xl font-bold text-slate-900">{metrics.scheduled + metrics.checkedIn + metrics.completed + metrics.noShow + metrics.cancelled}</p></div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-xs text-slate-500">Completed</p><p className="text-xl font-bold text-emerald-700">{metrics.completed}</p></div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-xs text-slate-500">No Show Rate</p><p className="text-xl font-bold text-amber-700">{metrics.noShowRate}%</p></div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-xs text-slate-500">Unique Patients</p><p className="text-xl font-bold text-slate-900">{metrics.totalPatientsToday}</p></div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-5">
            <p className="text-xs text-slate-500">Gross Revenue</p>
            <p className="text-2xl font-bold text-blue-700">₹{metrics.grossRevenue.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white p-5">
            <p className="text-xs text-slate-500">Collected</p>
            <p className="text-2xl font-bold text-emerald-700">₹{metrics.collected.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white p-5">
            <p className="text-xs text-slate-500">Outstanding</p>
            <p className="text-2xl font-bold text-rose-700">₹{metrics.outstanding.toLocaleString()}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Collection rate: {metrics.collectionRate}%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)] sm:p-6">
          <h2 className="text-sm font-semibold text-slate-700">Billing Reconciliation</h2>
          <div className="responsive-table-wrap mt-3">
            <table className="responsive-table responsive-table--compact">
              <thead>
                <tr className="border-b border-blue-100 bg-blue-50/40">
                  <th className="py-2 text-left text-xs font-semibold text-slate-500">Bill ID</th>
                  <th className="py-2 text-left text-xs font-semibold text-slate-500">Patient</th>
                  <th className="py-2 text-right text-xs font-semibold text-slate-500">Total</th>
                  <th className="py-2 text-right text-xs font-semibold text-slate-500">Collected</th>
                  <th className="py-2 text-right text-xs font-semibold text-slate-500">Due</th>
                </tr>
              </thead>
              <tbody>
                {metrics.billRows.map((row) => (
                  <tr key={row.billId} className="border-b border-blue-50 last:border-0">
                    <td className="py-2.5 text-sm text-slate-700">{row.billId}</td>
                    <td className="py-2.5 text-sm text-slate-700">{row.patient}</td>
                    <td className="py-2.5 text-right text-sm font-semibold text-slate-900">₹{row.total.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-sm font-semibold text-emerald-700">₹{row.paid.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-sm font-semibold text-rose-700">₹{row.due.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-700">Operational Summary</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="rounded-xl bg-blue-50/60 p-3"><p className="text-xs text-slate-500">Scheduled</p><p className="text-lg font-bold text-slate-900">{metrics.scheduled}</p></div>
            <div className="rounded-xl bg-blue-50/60 p-3"><p className="text-xs text-slate-500">Checked In</p><p className="text-lg font-bold text-indigo-700">{metrics.checkedIn}</p></div>
            <div className="rounded-xl bg-blue-50/60 p-3"><p className="text-xs text-slate-500">Completed</p><p className="text-lg font-bold text-emerald-700">{metrics.completed}</p></div>
            <div className="rounded-xl bg-blue-50/60 p-3"><p className="text-xs text-slate-500">No Show</p><p className="text-lg font-bold text-amber-700">{metrics.noShow}</p></div>
            <div className="rounded-xl bg-blue-50/60 p-3"><p className="text-xs text-slate-500">Cancelled</p><p className="text-lg font-bold text-rose-700">{metrics.cancelled}</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-700">Reference Totals</h2>
          <p className="mt-1 text-sm text-slate-600">Registered Patients: {patients.length} | Open Bills: {bills.length}</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClosingReport;
