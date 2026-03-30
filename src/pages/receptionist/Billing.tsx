import DashboardLayout from "@/components/DashboardLayout";
import { bills } from "@/data/mockData";
import { ReceiptText } from "lucide-react";

const Billing = () => (
  <DashboardLayout>
    <div className="mx-auto w-full max-w-[1200px] space-y-6 animate-fade-in-up">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 p-5 text-slate-900 shadow-[0_18px_45px_-34px_rgba(37,99,235,0.35)] sm:p-7">
        <h1 className="dashboard-title text-slate-900">Billing & Invoices</h1>
        <p className="mt-1 text-sm text-slate-600">Track bill line items, payment status, and totals at the front desk.</p>
      </section>

      <div className="space-y-5">
        {bills.map((bill) => (
          <div key={bill.id} className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_40px_-30px_rgba(37,99,235,0.35)]">
            <div className="flex flex-col gap-3 border-b border-blue-100 bg-blue-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="font-semibold text-slate-800">{bill.id} - {bill.patientName}</p>
                <p className="text-sm text-slate-500">{bill.date}</p>
              </div>
              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                bill.status === "Paid" ? "bg-cyan-100 text-cyan-700" : "bg-amber-100 text-amber-700"
              }`}>
                <ReceiptText className="h-3.5 w-3.5" />
                {bill.status}
              </span>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-2 sm:hidden">
                {bill.items.map((item, i) => (
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
                    {bill.items.map((item, i) => (
                      <tr key={i} className="border-b border-blue-50 last:border-0">
                        <td className="py-2.5 text-slate-700">{item.description}</td>
                        <td className="py-2.5 text-right font-medium text-slate-900">₹{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <p className="rounded-xl bg-blue-50 px-4 py-2 text-base font-bold text-blue-700 sm:text-lg">
                  Total: ₹{bill.total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default Billing;
