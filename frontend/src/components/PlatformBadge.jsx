const PLATFORM_CONFIG = {
  Amazon: {
    color: 'bg-orange-500',
    textColor: 'text-white',
    lightBg: 'bg-orange-50',
    lightText: 'text-orange-700',
    border: 'border-orange-200',
    btnBg: 'bg-orange-500 hover:bg-orange-600',
    logo: (
      <svg viewBox="0 0 100 30" className="h-4 fill-current">
        <text x="0" y="22" fontSize="22" fontWeight="bold" fontFamily="Arial">amazon</text>
      </svg>
    ),
  },
  Flipkart: {
    color: 'bg-blue-600',
    textColor: 'text-white',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    border: 'border-blue-200',
    btnBg: 'bg-blue-600 hover:bg-blue-700',
    logo: null,
  },
};

export function PlatformBadge({ name, size = 'sm' }) {
  const config = PLATFORM_CONFIG[name] || { color: 'bg-slate-500', textColor: 'text-white' };
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1 ${padding} rounded-full font-semibold ${config.color} ${config.textColor}`}>
      {name}
    </span>
  );
}

export function getPlatformConfig(name) {
  return PLATFORM_CONFIG[name] || {
    color: 'bg-slate-500',
    textColor: 'text-white',
    lightBg: 'bg-slate-50',
    lightText: 'text-slate-700',
    border: 'border-slate-200',
    btnBg: 'bg-slate-500 hover:bg-slate-600',
  };
}
