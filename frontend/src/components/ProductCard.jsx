import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Star, Heart, Zap } from './Icons';
import { getPlatformConfig } from './PlatformBadge';

function formatPrice(price) {
  if (price === null || price === undefined) return 'N/A';
  return `₹${price.toLocaleString('en-IN')}`;
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
    <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
      {label}
    </span>
  );
}

function PlatformRow({ platform, isLowest, isHighestRated, index }) {
  const config = getPlatformConfig(platform.name);
  const isValidUrl = platform.urlValid !== false && platform.url?.startsWith('http');

  const handleBuy = () => {
    if (!isValidUrl) return;
    window.open(platform.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
        isLowest ? 'bg-green-50 border border-green-200' : 'hover:bg-slate-50'
      }`}
    >
      {/* Platform name */}
      <div className="w-24 flex-shrink-0">
        <span
          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${config.color} ${config.textColor}`}
        >
          {platform.name}
        </span>
      </div>

      {/* Price */}
      <div className="flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-base font-bold ${isLowest ? 'text-green-700' : 'text-slate-800'}`}>
            {formatPrice(platform.price)}
          </span>
          {isLowest && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              <Zap className="w-3 h-3" />
              Best Deal
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {platform.availability === 'In Stock' ? (
            <span className="text-emerald-600 font-medium">● In Stock</span>
          ) : (
            <span className="text-red-500 font-medium">● Out of Stock</span>
          )}
          {platform.delivery && platform.delivery !== 'Check site' && (
            <span className="ml-2 text-slate-400">{platform.delivery}</span>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="w-20 text-right flex-shrink-0">
        <StarRating rating={platform.rating} />
        {platform.reviews > 0 && (
          <div className="text-xs text-slate-400 mt-0.5">
            {platform.reviews.toLocaleString('en-IN')}
          </div>
        )}
      </div>

      {/* Buy button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleBuy}
          disabled={!isValidUrl || platform.availability === 'Out of Stock'}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
            isValidUrl && platform.availability !== 'Out of Stock'
              ? `${config.btnBg} text-white shadow-sm hover:shadow-md active:scale-95`
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          title={!isValidUrl ? 'Link not available' : undefined}
        >
          {isValidUrl && platform.availability !== 'Out of Stock' ? (
            <>Buy Now <ExternalLink className="w-3 h-3" /></>
          ) : (
            platform.availability === 'Out of Stock' ? 'Sold Out' : 'Unavailable'
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProductCard({ product, onWishlistToggle, isWishlisted }) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasMultiplePlatforms = product.platforms.length > 1;
  const lowestPrice = product.minPrice;
  const visiblePlatforms = expanded ? product.platforms : product.platforms.slice(0, 2);

  const specs = product.specs || {};
  const specTags = Object.entries(specs)
    .filter(([k]) => k !== 'model')
    .map(([k, v]) => v)
    .filter(Boolean);

  return (
    <div className="fade-in-up bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Image section */}
      <div className="relative overflow-hidden bg-slate-50">
        {/* Multi-platform indicator */}
        {hasMultiplePlatforms && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md">
              {product.platforms.length} Platforms
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={() => onWishlistToggle?.(product)}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-current' : ''}`} filled={isWishlisted} />
        </button>

        {!imgError && product.image ? (
          <img
            src={product.image}
            alt={product.productName}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-44 object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-5xl">📦</span>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="p-4">
        {/* Product title */}
        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2 leading-snug">
          {product.productName}
        </h3>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-blue-600 font-medium mb-2 capitalize">{product.brand}</p>
        )}

        {/* Spec tags */}
        {specTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specTags.slice(0, 4).map((tag, i) => (
              <SpecTag key={i} label={tag} />
            ))}
          </div>
        )}

        {/* Price range summary */}
        {hasMultiplePlatforms && product.minPrice && (
          <div className="mb-3 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Best price</span>
                <p className="text-lg font-bold text-green-700">{formatPrice(product.minPrice)}</p>
              </div>
              {product.minPrice !== product.maxPrice && (
                <div className="text-right">
                  <span className="text-xs text-slate-500">Up to</span>
                  <p className="text-sm font-semibold text-slate-500">{formatPrice(product.maxPrice)}</p>
                </div>
              )}
              {product.avgRating && (
                <div className="text-right">
                  <span className="text-xs text-slate-500">Avg rating</span>
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="w-3.5 h-3.5 text-amber-400" filled />
                    <span className="text-sm font-bold text-slate-700">{product.avgRating}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Platform rows */}
        <div className="border-t border-slate-100 pt-3 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Compare on platforms
          </div>
          {visiblePlatforms.map((platform, idx) => (
            <PlatformRow
              key={platform.name}
              platform={platform}
              index={idx}
              isLowest={platform.price !== null && platform.price === lowestPrice}
              isHighestRated={
                platform.rating !== null &&
                platform.rating === Math.max(...product.platforms.map((p) => p.rating || 0))
              }
            />
          ))}

          {/* Expand/Collapse button */}
          {product.platforms.length > 2 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors mt-1"
            >
              {expanded ? (
                <><ChevronUp className="w-4 h-4" />Show less</>
              ) : (
                <><ChevronDown className="w-4 h-4" />+{product.platforms.length - 2} more platform{product.platforms.length - 2 > 1 ? 's' : ''}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
