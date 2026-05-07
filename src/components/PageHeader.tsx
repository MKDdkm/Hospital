import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  gradient?: string;
}

const PageHeader = ({
  title,
  subtitle,
  icon,
  actions,
  gradient = "from-slate-800 to-slate-700",
}: PageHeaderProps) => {
  return (
    <section className={`rounded-2xl bg-gradient-to-r ${gradient} p-5 text-white shadow-sm`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
              {icon}
            </div>
          )}
          <div>
            <h1
              className="text-xl font-bold tracking-tight text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              {title}
            </h1>
            {subtitle && <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
};

export default PageHeader;
