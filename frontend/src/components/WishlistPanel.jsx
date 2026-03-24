import { X, Heart, ExternalLink, Star } from './Icons';
import { getPlatformConfig } from './PlatformBadge';

function formatPrice(price) {
  if (!price) return 'N/A';
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function WishlistPanel({ wishlist, onRemove, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" filled />
            <h2 className="text-lg font-bold text-slate-900">Wishlist</h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-sm rounded-full font-medium">
              {wishlist.length}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {wishlist.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Your wishlist is empty</p>
              <p className="text-slate-400 text-sm mt-1">Add products to track price drops</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlist.map((item) => (
                <div key={item.productId} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg border border-slate-200 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-contain p-1" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                        {item.productName}
                      </p>
                      <p className="text-base font-bold text-green-700 mt-1">
                        {formatPrice(item.minPrice)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Added {new Date(item.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => onRemove(item.productId)}
                      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Platform links */}
                  {item.platforms && item.platforms.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.platforms.map((p) => {
                        const config = getPlatformConfig(p.name);
                        return (
                          <a
                            key={p.name}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${config.color} ${config.textColor} opacity-90 hover:opacity-100 transition-opacity`}
                          >
                            {p.name} — {formatPrice(p.price)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
