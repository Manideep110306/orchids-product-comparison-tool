import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Star, Heart, Zap } from './Icons';
import { getPlatformConfig } from './PlatformBadge';

function formatPrice(price) {
  if (price === null || price === undefined) return 'N/A';
  return `Rs ${price.toLocaleString('en-IN')}`;
}

function StarRating({ rating }) {
  if (!rating) return <span className="text-xs text-slate-400">No rating</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="w-3.5 h-3.5 text-amber-400" filled />
      <span className="text-sm font-semibold text-slate-700">{rating.toFixed(1)}</span>
    </span>
  );
}

function SpecTag({ label }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
      {label}
    </span>
  );
}

function PlatformOffer({ platform, isLowest }) {
  const config = getPlatformConfig(platform.name);
  const isValidUrl =
    platform.urlValid !== false &&
    platform.isProductUrl !== false &&
    platform.url?.startsWith('http');

  const handleOpen = () => {
    if (!isValidUrl) return;
    window.open(platform.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isLowest ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${config.color} ${config.textColor}`}>
            {platform.name}
          </span>
          {isLowest && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[11px] font-bold rounded-full">
              <Zap className="w-3 h-3" />
              Best Price
            </span>
          )}
        </div>

        <button
          onClick={handleOpen}
          disabled={!isValidUrl}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
            isValidUrl
              ? `${config.btnBg} text-white shadow-sm hover:shadow-md active:scale-95`
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          title={!isValidUrl ? 'Direct product link not available' : undefined}
        >
          {isValidUrl ? (
            <>Open Link <ExternalLink className="w-3 h-3" /></>
          ) : (
            'Unavailable'
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Price</div>
          <div className={`mt-1 text-sm font-bold ${isLowest ? 'text-green-700' : 'text-slate-800'}`}>
            {formatPrice(platform.price)}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rating</div>
          <div className="mt-1">
            <StarRating rating={platform.rating} />
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Availability</div>
          <div className={`mt-1 text-sm font-semibold ${
            platform.availability === 'Out of Stock' ? 'text-red-600' : 'text-emerald-600'
          }`}>
            {platform.availability || 'Check site'}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Delivery</div>
          <div className="mt-1 text-sm text-slate-700">
            {platform.delivery || 'Check site'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product, onWishlistToggle, isWishlisted }) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const lowestPrice = product.minPrice;
  const visiblePlatforms = expanded ? product.platforms : product.platforms.slice(0, 3);

  const specs = product.specs || {};
  const specTags = Object.entries(specs)
    .map(([, value]) => value)
    .filter(Boolean);

  return (
    <div className="fade-in-up bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="relative border-b xl:border-b-0 xl:border-r border-slate-100 bg-slate-50">
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md">
              {product.platforms.length} Platforms
            </span>
          </div>

          <button
            onClick={() => onWishlistToggle?.(product)}
            className="absolute top-4 right-4 z-10 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-current' : ''}`} filled={isWishlisted} />
          </button>

          <div className="p-5 pt-16">
            {!imgError && product.image ? (
              <img
                src={product.image}
                alt={product.productName}
                loading="lazy"
                onError={() => setImgError(true)}
                className="w-full h-52 object-contain"
              />
            ) : (
              <div className="w-full h-52 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl">
                <span className="text-2xl font-semibold text-slate-400">Product</span>
              </div>
            )}

            <div className="mt-5">
              <h3 className="text-lg font-bold text-slate-800 leading-snug">
                {product.productName}
              </h3>

              {product.brand && (
                <p className="text-sm text-blue-600 font-medium mt-2 capitalize">{product.brand}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Best price</div>
                  <div className="mt-1 text-lg font-bold text-green-700">{formatPrice(product.minPrice)}</div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avg rating</div>
                  <div className="mt-1 text-lg font-bold text-slate-800">{product.avgRating || 'N/A'}</div>
                </div>
              </div>

              {specTags.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Product specs
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {specTags.slice(0, 8).map((tag, index) => (
                      <SpecTag key={`${product.id}_spec_${index}`} label={tag} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Platform links
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Rating, availability, delivery, price, and direct link for each platform
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {visiblePlatforms.map((platform) => (
              <PlatformOffer
                key={`${product.id}_${platform.name}`}
                platform={platform}
                isLowest={platform.price !== null && platform.price === lowestPrice}
              />
            ))}
          </div>

          {product.platforms.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-4 h-4" />Show fewer platforms</>
              ) : (
                <><ChevronDown className="w-4 h-4" />Show {product.platforms.length - 3} more platforms</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
