import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export const ProjectDocumentSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <Card className="group rounded-2xl border border-slate-200/80 bg-[linear-gradient(170deg,rgba(255,255,255,0.92),rgba(247,251,255,0.84))] backdrop-blur-md shadow-[0_14px_40px_-30px_rgba(24,63,110,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-35px_rgba(24,63,110,0.8)]">
      <div className="border-b border-slate-200/80 px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{title}</h2>
      </div>
      <div className="space-y-3 px-5 py-5 sm:px-6">{children}</div>
    </Card>
  );
};

export const ProjectDocumentTable = ({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) => {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 md:block">
        <div className="responsive-table-wrap">
          <table className="responsive-table min-w-full">
            <thead>
              <tr className="bg-[linear-gradient(130deg,#eff6ff,#e5f3ff)]">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-700"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${row[0]}-${rowIndex}`} className="border-t border-slate-200/70 align-top even:bg-slate-50/45">
                  {row.map((cell, cellIndex) => (
                    <td key={`${cellIndex}-${cell.slice(0, 18)}`} className="px-4 py-3 text-sm leading-6 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {rows.map((row, rowIndex) => (
          <div key={`${row[0]}-${rowIndex}`} className="rounded-xl border border-slate-200/80 bg-[linear-gradient(160deg,#ffffff,#f8fbff)] p-4 shadow-[0_10px_24px_-20px_rgba(25,59,104,0.8)]">
            {row.map((cell, cellIndex) => (
              <div key={`${cellIndex}-${cell.slice(0, 18)}`} className="py-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{columns[cellIndex]}</p>
                <p className="text-sm leading-6 text-slate-700">{cell}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};
