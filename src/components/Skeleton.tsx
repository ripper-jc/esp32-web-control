export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-surface-300" />
        <div className="h-4 bg-surface-300 rounded w-32" />
      </div>
      <div className="flex gap-4">
        <div className="h-8 bg-surface-300 rounded-lg w-20" />
        <div className="h-8 bg-surface-300 rounded-lg w-20" />
        <div className="h-8 bg-surface-300 rounded-lg w-20" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card animate-pulse">
      <div className="h-3 bg-surface-300 rounded w-16 mb-2" />
      <div className="h-7 bg-surface-300 rounded w-10" />
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card p-0 divide-y divide-white/5 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-3.5 flex items-center gap-3">
          <div className="h-4 bg-surface-300 rounded flex-1" />
          <div className="h-4 bg-surface-300 rounded w-16" />
        </div>
      ))}
    </div>
  );
}
