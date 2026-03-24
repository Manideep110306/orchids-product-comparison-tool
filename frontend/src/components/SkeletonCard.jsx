export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-hidden">
      {/* Image skeleton */}
      <div className="skeleton h-44 rounded-xl mb-4" />

      {/* Title skeleton */}
      <div className="space-y-2 mb-4">
        <div className="skeleton h-4 rounded-lg w-full" />
        <div className="skeleton h-4 rounded-lg w-4/5" />
      </div>

      {/* Specs skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="skeleton h-6 rounded-full w-16" />
        <div className="skeleton h-6 rounded-full w-20" />
        <div className="skeleton h-6 rounded-full w-14" />
      </div>

      {/* Platform rows skeleton */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="skeleton h-5 rounded w-20" />
            <div className="skeleton h-5 rounded w-16" />
            <div className="skeleton h-5 rounded w-12" />
            <div className="skeleton h-8 rounded-lg w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
