import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { bills, roomServiceRates, type RoomType } from "@/data/mockData";
import { BedDouble, ReceiptText } from "lucide-react";

interface RoomServiceDraft {
  roomType: RoomType;
  pricePerDay: number;
  numberOfDays: number;
  admissionDate: string;
  dischargeDate: string;
  includeInBill: boolean;
  extraCareCharge: number;
}

interface PaymentDraft {
  paidAmount: number;
  currentPaymentAmount: number;
  paymentMode: "Cash" | "Card" | "UPI";
}

interface PaymentEntry {
  at: string;
  amount: number;
  mode: PaymentDraft["paymentMode"];
  note: string;
}

interface DischargeDraft {
  doctorApproved: boolean;
  pharmacyCleared: boolean;
  documentsReady: boolean;
}

interface NormalVisitService {
  id: string;
  label: string;
  amount: number;
}

type BillingCase = "Normal Visit" | "Hospital Stay";

const dayMs = 24 * 60 * 60 * 1000;

const calculateStayDays = (admissionDate: string, dischargeDate: string) => {
  if (!admissionDate || !dischargeDate) return 1;
  const admission = new Date(admissionDate);
  const discharge = new Date(dischargeDate);
  if (Number.isNaN(admission.getTime()) || Number.isNaN(discharge.getTime())) return 1;

  const diff = Math.ceil((discharge.getTime() - admission.getTime()) / dayMs);
  return Math.max(1, diff);
};

const addDaysToDate = (dateStr: string, days: number) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + Math.max(1, days));
  return date.toISOString().split("T")[0];
};

const defaultRoomRate = roomServiceRates[0];
const ROOM_DRAFTS_STORAGE_KEY = "medcore-billing-room-drafts";
const PAYMENT_DRAFTS_STORAGE_KEY = "medcore-billing-payment-drafts";
const PAYMENT_HISTORY_STORAGE_KEY = "medcore-billing-payment-history";
const DISCHARGE_DRAFTS_STORAGE_KEY = "medcore-billing-discharge-drafts";
const BILLING_CASE_STORAGE_KEY = "medcore-billing-case-by-bill";
const AUDIT_LOGS_STORAGE_KEY = "medcore-receptionist-audit-logs";

const NORMAL_VISIT_SERVICE_OPTIONS: NormalVisitService[] = [
  { id: "xray", label: "X-Ray", amount: 800 },
  { id: "scan", label: "Scanning", amount: 1500 },
  { id: "medicine", label: "Medicines", amount: 350 },
  { id: "blood-test", label: "Blood Test", amount: 600 },
  { id: "ecg", label: "ECG", amount: 500 },
];

const buildDefaultRoomDrafts = () => {
  return bills.reduce<Record<string, RoomServiceDraft>>((acc, bill) => {
    acc[bill.id] = {
      roomType: defaultRoomRate.roomType,
      pricePerDay: defaultRoomRate.pricePerDay,
      numberOfDays: 1,
      admissionDate: bill.date,
      dischargeDate: addDaysToDate(bill.date, 1),
      includeInBill: false,
      extraCareCharge: 0,
    };
    return acc;
  }, {});
};

const buildDefaultPaymentDrafts = () => {
  return bills.reduce<Record<string, PaymentDraft>>((acc, bill) => {
    const baseTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
    acc[bill.id] = {
      paidAmount: bill.status === "Paid" ? baseTotal : 0,
      currentPaymentAmount: 0,
      paymentMode: "Cash",
    };
    return acc;
  }, {});
};

const buildDefaultDischargeDrafts = () => {
  return bills.reduce<Record<string, DischargeDraft>>((acc, bill) => {
    acc[bill.id] = { doctorApproved: false, pharmacyCleared: false, documentsReady: false };
    return acc;
  }, {});
};

const buildDefaultBillingCases = () => {
  return bills.reduce<Record<string, BillingCase>>((acc, bill) => {
    acc[bill.id] = "Normal Visit";
    return acc;
  }, {});
};

const getConsultationAmount = (items: { description: string; amount: number }[]) => {
  const consultationItem = items.find((item) => item.description.toLowerCase().includes("consultation"));
  return consultationItem?.amount ?? 500;
};

const buildDefaultNormalVisitServices = () => {
  return bills.reduce<Record<string, string[]>>((acc, bill) => {
    acc[bill.id] = [];
    return acc;
  }, {});
};

const Billing = () => {
  const [roomDraftByBill, setRoomDraftByBill] = useState<Record<string, RoomServiceDraft>>(() => {
    if (typeof window === "undefined") return buildDefaultRoomDrafts();

    try {
      const raw = window.localStorage.getItem(ROOM_DRAFTS_STORAGE_KEY);
      if (!raw) return buildDefaultRoomDrafts();
      return { ...buildDefaultRoomDrafts(), ...JSON.parse(raw) } as Record<string, RoomServiceDraft>;
    } catch {
      return buildDefaultRoomDrafts();
    }
  });
  const [paymentDraftByBill, setPaymentDraftByBill] = useState<Record<string, PaymentDraft>>(() => {
    if (typeof window === "undefined") return buildDefaultPaymentDrafts();

    try {
      const raw = window.localStorage.getItem(PAYMENT_DRAFTS_STORAGE_KEY);
      if (!raw) return buildDefaultPaymentDrafts();
      return { ...buildDefaultPaymentDrafts(), ...JSON.parse(raw) } as Record<string, PaymentDraft>;
    } catch {
      return buildDefaultPaymentDrafts();
    }
  });
  const [paymentHistoryByBill, setPaymentHistoryByBill] = useState<Record<string, PaymentEntry[]>>(() => {
    if (typeof window === "undefined") return {};

    try {
      const raw = window.localStorage.getItem(PAYMENT_HISTORY_STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, PaymentEntry[]>;
    } catch {
      return {};
    }
  });
  const [dischargeDraftByBill, setDischargeDraftByBill] = useState<Record<string, DischargeDraft>>(() => {
    if (typeof window === "undefined") return buildDefaultDischargeDrafts();

    try {
      const raw = window.localStorage.getItem(DISCHARGE_DRAFTS_STORAGE_KEY);
      if (!raw) return buildDefaultDischargeDrafts();
      return { ...buildDefaultDischargeDrafts(), ...JSON.parse(raw) } as Record<string, DischargeDraft>;
    } catch {
      return buildDefaultDischargeDrafts();
    }
  });
  const [billingCaseByBill, setBillingCaseByBill] = useState<Record<string, BillingCase>>(() => {
    if (typeof window === "undefined") return buildDefaultBillingCases();

    try {
      const raw = window.localStorage.getItem(BILLING_CASE_STORAGE_KEY);
      if (!raw) return buildDefaultBillingCases();
      return { ...buildDefaultBillingCases(), ...JSON.parse(raw) } as Record<string, BillingCase>;
    } catch {
      return buildDefaultBillingCases();
    }
  });
  const [normalVisitServicesByBill, setNormalVisitServicesByBill] = useState<Record<string, string[]>>(buildDefaultNormalVisitServices);

  useEffect(() => {
    window.localStorage.setItem(ROOM_DRAFTS_STORAGE_KEY, JSON.stringify(roomDraftByBill));
  }, [roomDraftByBill]);

  useEffect(() => {
    window.localStorage.setItem(PAYMENT_DRAFTS_STORAGE_KEY, JSON.stringify(paymentDraftByBill));
  }, [paymentDraftByBill]);

  useEffect(() => {
    window.localStorage.setItem(PAYMENT_HISTORY_STORAGE_KEY, JSON.stringify(paymentHistoryByBill));
  }, [paymentHistoryByBill]);

  useEffect(() => {
    window.localStorage.setItem(DISCHARGE_DRAFTS_STORAGE_KEY, JSON.stringify(dischargeDraftByBill));
  }, [dischargeDraftByBill]);

  useEffect(() => {
    window.localStorage.setItem(BILLING_CASE_STORAGE_KEY, JSON.stringify(billingCaseByBill));
  }, [billingCaseByBill]);

  const updateDraft = (billId: string, updater: (prev: RoomServiceDraft) => RoomServiceDraft) => {
    setRoomDraftByBill((prev) => ({ ...prev, [billId]: updater(prev[billId]) }));
  };

  const updateBillingCase = (billId: string, billingCase: BillingCase) => {
    setBillingCaseByBill((prev) => ({ ...prev, [billId]: billingCase }));
    updateDraft(billId, (prev) => ({ ...prev, includeInBill: billingCase === "Hospital Stay" }));
    if (billingCase === "Normal Visit") {
      setNormalVisitServicesByBill((prev) => ({ ...prev, [billId]: [] }));
    }
  };

  const toggleNormalVisitService = (billId: string, serviceId: string) => {
    setNormalVisitServicesByBill((prev) => {
      const selected = prev[billId] ?? [];
      const exists = selected.includes(serviceId);
      const next = exists ? selected.filter((id) => id !== serviceId) : [...selected, serviceId];
      return { ...prev, [billId]: next };
    });
  };

  const pushAuditLog = (type: string, details: string) => {
    try {
      const previous = JSON.parse(window.localStorage.getItem(AUDIT_LOGS_STORAGE_KEY) ?? "[]") as Array<Record<string, string>>;
      previous.unshift({ id: `AL-${Date.now()}`, type, at: new Date().toISOString(), details });
      window.localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(previous.slice(0, 80)));
    } catch {
      // Ignore audit storage errors.
    }
  };

  const exportBillingSummaryCsv = () => {
    const rows = bills.map((bill) => {
      const roomDraft = roomDraftByBill[bill.id];
      const paymentDraft = paymentDraftByBill[bill.id];
      const billingCase = billingCaseByBill[bill.id] ?? "Normal Visit";
      const consultationAmount = getConsultationAmount(bill.items);
      const selectedServices = (normalVisitServicesByBill[bill.id] ?? [])
        .map((id) => NORMAL_VISIT_SERVICE_OPTIONS.find((service) => service.id === id))
        .filter((service): service is NormalVisitService => Boolean(service));
      const normalVisitServiceTotal = billingCase === "Normal Visit"
        ? selectedServices.reduce((sum, service) => sum + service.amount, 0)
        : 0;
      const serviceTotal = billingCase === "Normal Visit"
        ? consultationAmount + normalVisitServiceTotal
        : bill.items.reduce((sum, item) => sum + item.amount, 0);
      const roomTotal = billingCase === "Hospital Stay"
        ? (roomDraft.pricePerDay * roomDraft.numberOfDays) + (roomDraft.roomType === "ICU" ? roomDraft.extraCareCharge : 0)
        : 0;
      const subtotal = serviceTotal + roomTotal;
      const patientPayable = subtotal;
      const paidAmount = Math.max(0, Math.min(paymentDraft.paidAmount, patientPayable));
      const dueAmount = Math.max(0, patientPayable - paidAmount);
      const paymentStatus = dueAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending";

      return [
        bill.id,
        bill.patientName,
        bill.date,
        billingCase,
        serviceTotal,
        roomTotal,
        patientPayable,
        paidAmount,
        dueAmount,
        paymentDraft.paymentMode,
        paymentStatus,
      ];
    });

    const csv = [
      ["Bill ID", "Patient", "Bill Date", "Case Type", "Service Total", "Room Charges", "Patient Payable", "Paid Amount", "Due Amount", "Payment Mode", "Payment Status"],
      ...rows,
    ]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medcore-billing-summary-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    pushAuditLog("billing.export.csv", `Exported billing summary for ${rows.length} invoice(s)`);
  };

  const printInvoice = (params: {
    billId: string;
    patientName: string;
    date: string;
    items: { description: string; amount: number }[];
    paymentMode: PaymentDraft["paymentMode"];
    paidAmount: number;
    dueAmount: number;
    total: number;
  }) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const rows = params.items
      .map((item) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${item.description}</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">Rs ${item.amount.toLocaleString()}</td></tr>`)
      .join("");

    const html = `
      <html>
        <head>
          <title>Invoice ${params.billId}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
            .header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 18px; }
            .title { font-size: 22px; font-weight: 700; }
            .meta { font-size: 13px; color:#475569; }
            table { width:100%; border-collapse: collapse; margin-top: 16px; }
            th { text-align:left; border-bottom:2px solid #cbd5e1; padding:8px 0; }
            .summary { margin-top: 16px; font-size: 14px; }
            .summary p { margin: 6px 0; }
            .grand { font-size: 16px; font-weight: 700; color:#1d4ed8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">MedCore HMS Invoice</div>
              <div class="meta">Bill ID: ${params.billId}</div>
            </div>
            <div class="meta">Date: ${params.date}</div>
          </div>
          <div class="meta">Patient: ${params.patientName}</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="summary">
            <p class="grand">Patient Payable: Rs ${params.total.toLocaleString()}</p>
            <p>Amount Paid: Rs ${params.paidAmount.toLocaleString()}</p>
            <p>Balance Due: Rs ${params.dueAmount.toLocaleString()}</p>
            <p>Payment Mode: ${params.paymentMode}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    pushAuditLog("billing.invoice.print", `Printed invoice ${params.billId} for ${params.patientName}`);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1200px] space-y-6 animate-fade-in-up">
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-5 text-slate-900 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.35)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dashboard-title text-slate-900">Billing & Invoices</h1>
              <p className="mt-1 text-sm text-slate-600">Track bill line items, payment status, and totals at the front desk.</p>
            </div>
            <button
              type="button"
              onClick={exportBillingSummaryCsv}
              className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              Export Billing CSV
            </button>
          </div>
        </section>

        <div className="space-y-5">
          {bills.map((bill) => {
            const draft = roomDraftByBill[bill.id];
            const payment = paymentDraftByBill[bill.id];
            const paymentHistory = paymentHistoryByBill[bill.id] ?? [];
            const discharge = dischargeDraftByBill[bill.id];
            const billingCase = billingCaseByBill[bill.id] ?? "Normal Visit";
            const isHospitalStay = billingCase === "Hospital Stay";
            const consultationAmount = getConsultationAmount(bill.items);
            const selectedNormalVisitServices = (normalVisitServicesByBill[bill.id] ?? [])
              .map((id) => NORMAL_VISIT_SERVICE_OPTIONS.find((service) => service.id === id))
              .filter((service): service is NormalVisitService => Boolean(service));
            const normalVisitServiceTotal = !isHospitalStay
              ? selectedNormalVisitServices.reduce((sum, service) => sum + service.amount, 0)
              : 0;
            const selectedRoomMeta = roomServiceRates.find((room) => room.roomType === draft.roomType) ?? defaultRoomRate;

            const roomCharge = (draft.pricePerDay * draft.numberOfDays) + (draft.roomType === "ICU" ? draft.extraCareCharge : 0);
            const baseSubtotal = isHospitalStay
              ? bill.items.reduce((sum, item) => sum + item.amount, 0)
              : consultationAmount + normalVisitServiceTotal;
            const subtotal = baseSubtotal + (isHospitalStay ? roomCharge : 0);
            const grandTotal = subtotal;
            const paidAmount = Math.max(0, Math.min(payment.paidAmount, grandTotal));
            const dueAmount = Math.max(0, grandTotal - paidAmount);
            const paymentStatus = dueAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending";
            const dischargeReady = discharge.doctorApproved && discharge.pharmacyCleared && discharge.documentsReady && dueAmount === 0;

            const recordPayment = () => {
              const amount = Math.max(0, Math.min(payment.currentPaymentAmount, dueAmount));
              if (amount <= 0) return;

              setPaymentDraftByBill((prev) => ({
                ...prev,
                [bill.id]: {
                  ...prev[bill.id],
                  paidAmount: Math.min(grandTotal, prev[bill.id].paidAmount + amount),
                  currentPaymentAmount: 0,
                },
              }));

              setPaymentHistoryByBill((prev) => ({
                ...prev,
                [bill.id]: [
                  {
                    at: new Date().toISOString(),
                    amount,
                    mode: payment.paymentMode,
                    note: "Front desk payment",
                  },
                  ...(prev[bill.id] ?? []),
                ].slice(0, 10),
              }));

              pushAuditLog("billing.payment.recorded", `Recorded ₹${amount.toLocaleString()} for ${bill.id}`);
            };

            const normalVisitItems = !isHospitalStay
              ? [
                  { description: "Consultation Fee", amount: consultationAmount },
                  ...selectedNormalVisitServices.map((service) => ({ description: service.label, amount: service.amount })),
                ]
              : [];

            const lineItems = isHospitalStay
              ? [
                  ...bill.items,
                  {
                    description: `Room Services (${draft.roomType} - ${draft.numberOfDays} day${draft.numberOfDays > 1 ? "s" : ""})`,
                    amount: roomCharge,
                  },
                ]
              : [...bill.items, ...normalVisitItems];

            return (
              <div key={bill.id} className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
                <div className="flex flex-col gap-3 border-b border-blue-100 bg-blue-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="font-semibold text-slate-800">{bill.id} - {bill.patientName}</p>
                    <p className="text-sm text-slate-500">{bill.date}</p>
                    <p className="mt-1 text-xs font-semibold text-blue-700">Case: {billingCase}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-lg border border-blue-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => updateBillingCase(bill.id, "Normal Visit")}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                          !isHospitalStay ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50"
                        }`}
                      >
                        Normal Visit
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBillingCase(bill.id, "Hospital Stay")}
                        className={`ml-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                          isHospitalStay ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50"
                        }`}
                      >
                        Hospital Stay
                      </button>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      paymentStatus === "Paid"
                        ? "bg-cyan-100 text-cyan-700"
                        : paymentStatus === "Partial"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      <ReceiptText className="h-3.5 w-3.5" />
                      {paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-5 p-4 sm:p-6">
                  {!isHospitalStay && (
                    <section className="rounded-2xl border border-blue-100 bg-blue-50/45 p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-800">Normal Visit Services</h2>
                        <p className="text-xs font-semibold text-blue-700">Click to add</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {NORMAL_VISIT_SERVICE_OPTIONS.map((service) => {
                          const active = (normalVisitServicesByBill[bill.id] ?? []).includes(service.id);
                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => toggleNormalVisitService(bill.id, service.id)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                active
                                  ? "border-blue-300 bg-blue-100 text-blue-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50"
                              }`}
                            >
                              {service.label} - ₹{service.amount.toLocaleString()}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-600">Selected normal-visit add-ons: ₹{normalVisitServiceTotal.toLocaleString()}</p>
                    </section>
                  )}

                  <section className={`rounded-2xl border border-blue-100 bg-gradient-to-r from-slate-50 via-cyan-50/50 to-blue-50/60 p-4 sm:p-5 ${isHospitalStay ? "" : "opacity-60"}`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-blue-100 p-2 text-blue-700">
                          <BedDouble className="h-4 w-4" />
                        </span>
                        <h2 className="text-base font-bold text-slate-800">Room Services</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateDraft(bill.id, (prev) => ({ ...prev, includeInBill: !prev.includeInBill }))}
                        disabled={!isHospitalStay}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isHospitalStay
                            ? "border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {isHospitalStay ? "Room Charge Enabled" : "Only for Hospital Stay"}
                      </button>
                    </div>

                    {!isHospitalStay && (
                      <p className="mt-2 text-xs font-semibold text-slate-600">Switch to Hospital Stay to enable room, stay days, and discharge workflow.</p>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-slate-600">Room Type</span>
                        <select
                          value={draft.roomType}
                          disabled={!isHospitalStay}
                          onChange={(e) => {
                            const nextRoomType = e.target.value as RoomType;
                            const nextMeta = roomServiceRates.find((room) => room.roomType === nextRoomType);
                            if (!nextMeta) return;

                            updateDraft(bill.id, (prev) => ({
                              ...prev,
                              roomType: nextMeta.roomType,
                              pricePerDay: nextMeta.pricePerDay,
                              includeInBill: true,
                              extraCareCharge: nextRoomType === "ICU" ? (nextMeta.defaultExtraCareCharge ?? prev.extraCareCharge) : 0,
                            }));
                          }}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                        >
                          {roomServiceRates.map((room) => (
                            <option key={room.roomType} value={room.roomType}>
                              {room.roomType} (₹{room.pricePerDay.toLocaleString()}/day)
                            </option>
                          ))}
                        </select>
                        <p className={`text-[11px] font-medium ${
                          selectedRoomMeta.availability === "Available"
                            ? "text-emerald-600"
                            : selectedRoomMeta.availability === "Limited"
                              ? "text-amber-600"
                              : "text-rose-600"
                        }`}>
                          Availability: {selectedRoomMeta.availability}
                        </p>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-slate-600">Number of Days Stayed</span>
                        <input
                          type="number"
                          min={1}
                          disabled={!isHospitalStay}
                          value={draft.numberOfDays}
                          onChange={(e) => {
                            const days = Math.max(1, Number(e.target.value) || 1);
                            updateDraft(bill.id, (prev) => ({
                              ...prev,
                              numberOfDays: days,
                              includeInBill: true,
                              dischargeDate: addDaysToDate(prev.admissionDate, days),
                            }));
                          }}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-slate-600">Admission Date</span>
                        <input
                          type="date"
                          disabled={!isHospitalStay}
                          value={draft.admissionDate}
                          onChange={(e) => {
                            const admissionDate = e.target.value;
                            updateDraft(bill.id, (prev) => {
                              const adjustedDischarge = prev.dischargeDate && prev.dischargeDate < admissionDate
                                ? addDaysToDate(admissionDate, prev.numberOfDays)
                                : prev.dischargeDate;

                              return {
                                ...prev,
                                admissionDate,
                                includeInBill: true,
                                dischargeDate: adjustedDischarge,
                                numberOfDays: calculateStayDays(admissionDate, adjustedDischarge),
                              };
                            });
                          }}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-slate-600">Discharge Date</span>
                        <input
                          type="date"
                          disabled={!isHospitalStay}
                          value={draft.dischargeDate}
                          onChange={(e) => {
                            const dischargeDate = e.target.value;
                            updateDraft(bill.id, (prev) => ({
                              ...prev,
                              dischargeDate,
                              includeInBill: true,
                              numberOfDays: calculateStayDays(prev.admissionDate, dischargeDate),
                            }));
                          }}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                        />
                      </label>
                    </div>

                    {draft.roomType === "ICU" && (
                      <div className="mt-3 grid gap-2 sm:max-w-xs">
                        <label className="space-y-1">
                          <span className="text-xs font-semibold text-slate-600">ICU Extra Care Charges</span>
                          <input
                            type="number"
                            min={0}
                            disabled={!isHospitalStay}
                            value={draft.extraCareCharge}
                            onChange={(e) => {
                              const extra = Math.max(0, Number(e.target.value) || 0);
                              updateDraft(bill.id, (prev) => ({ ...prev, extraCareCharge: extra, includeInBill: true }));
                            }}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                          />
                        </label>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3">
                      <p className="text-sm font-medium text-slate-600">Room Charges = Price/Day x Days {draft.roomType === "ICU" ? "+ ICU Extra" : ""}</p>
                      <p className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                        ₹{roomCharge.toLocaleString()} ({draft.pricePerDay.toLocaleString()} x {draft.numberOfDays}{draft.roomType === "ICU" ? ` + ${draft.extraCareCharge.toLocaleString()}` : ""})
                      </p>
                    </div>
                  </section>

                  <div className="space-y-2 sm:hidden">
                    {lineItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/40 px-3 py-2.5">
                        <p className="pr-3 text-sm font-medium text-slate-700">{item.description}</p>
                        <p className="text-sm font-semibold text-slate-900">₹{item.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="responsive-table-wrap hidden sm:block">
                    <table className="responsive-table responsive-table--compact mb-4">
                      <thead>
                        <tr className="border-b border-blue-100 bg-blue-50/40">
                          <th className="py-2 text-left font-medium text-slate-500">Description</th>
                          <th className="py-2 text-right font-medium text-slate-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, i) => (
                          <tr key={i} className="border-b border-blue-50 last:border-0">
                            <td className="py-2.5 text-slate-700">{item.description}</td>
                            <td className="py-2.5 text-right font-medium text-slate-900">₹{item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex flex-col items-end gap-2">
                    <p className="text-sm font-medium text-slate-600">Subtotal (services): ₹{baseSubtotal.toLocaleString()}</p>
                    <p className="text-sm font-medium text-slate-600">
                      Room Charges: ₹{(isHospitalStay ? roomCharge : 0).toLocaleString()}
                    </p>
                    <div className="w-full rounded-xl border border-blue-100 bg-blue-50/40 p-3 sm:max-w-md">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <label className="space-y-1 sm:col-span-1">
                          <span className="text-xs font-semibold text-slate-600">Current Payment</span>
                          <input
                            type="number"
                            min={0}
                            max={grandTotal}
                            value={payment.currentPaymentAmount}
                            onChange={(e) => {
                              const next = Math.max(0, Number(e.target.value) || 0);
                              setPaymentDraftByBill((prev) => ({
                                ...prev,
                                [bill.id]: { ...prev[bill.id], currentPaymentAmount: next },
                              }));
                            }}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700"
                          />
                        </label>
                        <label className="space-y-1 sm:col-span-1">
                          <span className="text-xs font-semibold text-slate-600">Mode</span>
                          <select
                            value={payment.paymentMode}
                            onChange={(e) => {
                              const mode = e.target.value as PaymentDraft["paymentMode"];
                              setPaymentDraftByBill((prev) => ({
                                ...prev,
                                [bill.id]: { ...prev[bill.id], paymentMode: mode },
                              }));
                            }}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI</option>
                          </select>
                        </label>
                        <div className="flex items-end sm:col-span-1">
                          <button
                            type="button"
                            onClick={recordPayment}
                            className="h-9 w-full rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Record Payment
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const remaining = Math.max(0, grandTotal - paidAmount);
                            if (remaining === 0) return;
                            setPaymentDraftByBill((prev) => ({
                              ...prev,
                              [bill.id]: {
                                ...prev[bill.id],
                                paidAmount: grandTotal,
                                currentPaymentAmount: 0,
                              },
                            }));
                            setPaymentHistoryByBill((prev) => ({
                              ...prev,
                              [bill.id]: [
                                {
                                  at: new Date().toISOString(),
                                  amount: remaining,
                                  mode: payment.paymentMode,
                                  note: "Settled full",
                                },
                                ...(prev[bill.id] ?? []),
                              ].slice(0, 10),
                            }));
                            pushAuditLog("billing.payment.settle", `Settled full payment for ${bill.id}`);
                          }}
                          className="h-8 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Settle Full
                        </button>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-600">
                        Paid: ₹{paidAmount.toLocaleString()} | Due: ₹{dueAmount.toLocaleString()} | Mode: {payment.paymentMode}
                      </p>
                      {paymentHistory.length > 0 && (
                        <div className="mt-2 rounded-lg border border-blue-100 bg-white p-2">
                          <p className="text-[11px] font-semibold text-slate-600">Payment History</p>
                          <div className="mt-1 space-y-1">
                            {paymentHistory.slice(0, 3).map((entry, index) => (
                              <p key={`${entry.at}-${index}`} className="text-[11px] text-slate-600">
                                {new Date(entry.at).toLocaleString()} - ₹{entry.amount.toLocaleString()} ({entry.mode})
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="rounded-xl bg-blue-50 px-4 py-2 text-base font-bold text-blue-700 sm:text-lg">
                      Patient Payable: ₹{grandTotal.toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold text-rose-600">Balance Due: ₹{dueAmount.toLocaleString()}</p>
                    {isHospitalStay && (
                      <div className="w-full rounded-xl border border-blue-100 bg-blue-50/40 p-3 sm:max-w-md">
                        <p className="text-xs font-semibold text-slate-600">Discharge Checklist</p>
                        <div className="mt-2 space-y-1 text-xs text-slate-700">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={discharge.doctorApproved} onChange={(e) => setDischargeDraftByBill((prev) => ({ ...prev, [bill.id]: { ...prev[bill.id], doctorApproved: e.target.checked } }))} />
                            Doctor approved discharge
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={discharge.pharmacyCleared} onChange={(e) => setDischargeDraftByBill((prev) => ({ ...prev, [bill.id]: { ...prev[bill.id], pharmacyCleared: e.target.checked } }))} />
                            Pharmacy clearance done
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={discharge.documentsReady} onChange={(e) => setDischargeDraftByBill((prev) => ({ ...prev, [bill.id]: { ...prev[bill.id], documentsReady: e.target.checked } }))} />
                            Documents ready for handover
                          </label>
                        </div>
                        <button
                          type="button"
                          disabled={!dischargeReady}
                          onClick={() => pushAuditLog("billing.discharge.completed", `Discharge completed for ${bill.id}`)}
                          className="mt-2 h-8 w-full rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          Complete Discharge
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => printInvoice({
                        billId: bill.id,
                        patientName: bill.patientName,
                        date: bill.date,
                        items: lineItems,
                        paymentMode: payment.paymentMode,
                        paidAmount,
                        dueAmount,
                        total: grandTotal,
                      })}
                      className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      Print Invoice
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
