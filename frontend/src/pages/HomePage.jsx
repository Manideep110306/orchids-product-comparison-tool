import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';
import { SkeletonGrid } from '../components/SkeletonCard';
import { ErrorBanner, PlatformWarning, EmptyState } from '../components/ErrorBanner';
import WishlistPanel from '../components/WishlistPanel';
import Header from '../components/Header';
import { useSearch } from '../hooks/useSearch';
import { useWishlist } from '../hooks/useWishlist';
import { TrendingUp, Zap } from '../components/Icons';

const TRENDING = [
  'Wireless Earbuds', 'Gaming Laptop', 'iPhone 15 Pro', 'Smart Watch',
  'Robot Vacuum', 'Samsung S24', 'OLED TV', 'Mechanical Keyboard',
];

function HeroSection({ query, onChange, onSubmit, loading }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 pt-16 pb-20 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/80 text-sm mb-6">
          <Zap className="w-4 h-4 text-amber-400" />
          Compare prices across all major platforms instantly
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight">
          Find the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            Best Deal
          </span>
          <br />across every platform
        </h1>
        <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
          Search once, compare prices from Amazon, Flipkart and more — all in one place.
        </p>

        {/* Search bar */}
        <SearchBar
          query={query}
          onChange={onChange}
          onSubmit={onSubmit}
          loading={loading}
        />

        {/* Trending */}
        <div className="mt-6 flex items-center justify-center flex-wrap gap-2">
          <span className="text-xs text-white/50 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Trending:
          </span>
          {TRENDING.map((t) => (
            <button
              key={t}
              onClick={() => { onChange(t); setTimeout(onSubmit, 100); }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 text-xs rounded-full transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlatformStats({ meta }) {
  if (!meta || !meta.platformCounts) return null;
  const { amazon = 0, flipkart = 0 } = meta.platformCounts;

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-6">
      {amazon > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
          <span className="w-2 h-2 bg-orange-500 rounded-full" />
          <span className="text-xs font-semibold text-orange-700">Amazon: {amazon} products</span>
        </div>
      )}
      {flipkart > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
          <span className="w-2 h-2 bg-blue-600 rounded-full" />
          <span className="text-xs font-semibold text-blue-700">Flipkart: {flipkart} products</span>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const {
    query, results, loading, error, meta, searched,
    handleQueryChange, handleSubmit, debouncedSearch,
  } = useSearch();

  const { wishlist, addItem, removeItem, isInWishlist } = useWishlist();
  const [filteredResults, setFilteredResults] = useState([]);
  const [showWishlist, setShowWishlist] = useState(false);

  // Sync filtered results when raw results change
  useEffect(() => {
    setFilteredResults(results);
  }, [results]);

  const handleWishlistToggle = async (product) => {
    if (isInWishlist(product.id)) {
      await removeItem(product.id);
    } else {
      await addItem({
        productId: product.id,
        productName: product.productName,
        image: product.image,
        minPrice: product.minPrice,
        platforms: product.platforms.map((p) => ({ name: p.name, price: p.price, url: p.url })),
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header — fixed on desktop, hidden over hero */}
      <div className="hidden md:block">
        <Header wishlistCount={wishlist.length} onWishlistClick={() => setShowWishlist(true)} />
      </div>

      {/* Hero with integrated search */}
      <HeroSection
        query={query}
        onChange={handleQueryChange}
        onSubmit={handleSubmit}
        loading={loading}
      />

      {/* Mobile wishlist button */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowWishlist(true)}
          className="relative w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {wishlist.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {wishlist.length}
            </span>
          )}
        </button>
      </div>

      {/* Results section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Error */}
        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} />
          </div>
        )}

        {/* Loading skeleton */}
        {loading && <SkeletonGrid count={6} />}

        {/* Results */}
        {!loading && searched && !error && (
          <>
            {results.length > 0 ? (
              <>
                <PlatformWarning platformStatus={meta?.platformStatus} />
                <PlatformStats meta={meta} />
                <FilterBar
                  results={results}
                  onFilteredResults={setFilteredResults}
                  meta={meta}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredResults.map((product, i) => (
                    <div
                      key={product.id}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <ProductCard
                        product={product}
                        onWishlistToggle={handleWishlistToggle}
                        isWishlisted={isInWishlist(product.id)}
                      />
                    </div>
                  ))}
                </div>
                {filteredResults.length === 0 && (
                  <div className="text-center py-10 text-slate-500">
                    No products match the current filters.{' '}
                    <button className="text-blue-600 hover:underline" onClick={() => setFilteredResults(results)}>
                      Clear filters
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState query={meta?.query || query} />
            )}
          </>
        )}

        {/* Initial state — feature cards */}
        {!searched && !loading && (
          <FeatureCards />
        )}
      </div>

      {/* Wishlist panel */}
      {showWishlist && (
        <WishlistPanel
          wishlist={wishlist}
          onRemove={removeItem}
          onClose={() => setShowWishlist(false)}
        />
      )}
    </div>
  );
}

function FeatureCards() {
  const features = [
    {
      icon: '⚡',
      title: 'Real-Time Prices',
      desc: 'Live data fetched directly from Amazon & Flipkart at search time.',
    },
    {
      icon: '🧩',
      title: 'Smart Grouping',
      desc: 'Identical products across platforms are automatically grouped for easy comparison.',
    },
    {
      icon: '💰',
      title: 'Best Deal Finder',
      desc: 'The cheapest price is highlighted instantly so you never overpay.',
    },
    {
      icon: '🔗',
      title: 'Direct Redirect',
      desc: 'One click takes you straight to the exact product page — no searching again.',
    },
    {
      icon: '❤️',
      title: 'Wishlist',
      desc: 'Save products and track price changes over time.',
    },
    {
      icon: '🔍',
      title: 'Advanced Filters',
      desc: 'Filter by platform, rating, and sort by price or popularity.',
    },
  ];

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">How it works</h2>
      <p className="text-slate-500 text-center mb-8">Search once, compare everywhere</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
