const SkeletonText = ({ className = "" }: { className?: string }) => (
  <div className={`h-3 rounded-full bg-slate-200 animate-pulse ${className}`} />
);

const SkeletonCard = () => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-1/2" />
        <SkeletonText className="w-1/3 h-2" />
      </div>
    </div>
    <SkeletonText className="w-full" />
    <SkeletonText className="w-4/5" />
    <SkeletonText className="w-2/3" />
  </div>
);

const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
      <SkeletonText className="w-32" />
    </div>
    <div className="divide-y divide-slate-50">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
          <SkeletonText className="w-20 shrink-0" />
          <SkeletonText className="flex-1" />
          <SkeletonText className="w-24 shrink-0" />
          <SkeletonText className="w-16 shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

export { SkeletonCard, SkeletonTable, SkeletonText };
