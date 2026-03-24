import { AlertCircle, Wifi } from './Icons';

export function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <div>
        <p className="font-semibold text-sm">Something went wrong</p>
        <p className="text-sm mt-0.5 text-red-600">{message}</p>
      </div>
    </div>
  );
}

export function PlatformWarning({ platformStatus }) {
  const failedPlatforms = Object.entries(platformStatus || {})
    .filter(([, status]) => status === 'error')
    .map(([name]) => name);

  if (failedPlatforms.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm mb-4">
      <Wifi className="w-4 h-4 flex-shrink-0" />
      <p>
        <span className="font-semibold">Some platforms unavailable: </span>
        {failedPlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}.
        Results shown from available sources.
      </p>
    </div>
  );
}

export function EmptyState({ query }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">No products found</h3>
      <p className="text-slate-500 max-w-md mx-auto">
        We couldn't find any products for <span className="font-semibold text-slate-700">"{query}"</span>.
        Try a different search term or check your spelling.
      </p>
    </div>
  );
}
