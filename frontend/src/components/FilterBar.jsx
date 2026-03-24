import { useState } from 'react';
import { Filter, ArrowUpDown } from './Icons';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'platforms', label: 'Cross-Platform First' },
];

const PLATFORM_OPTIONS = ['Amazon', 'Flipkart'];

export default function FilterBar({ results, onFilteredResults, meta }) {
  const [sort, setSort] = useState('relevance');
  const [platforms, setPlatforms] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = (newSort = sort, newPlatforms = platforms, newRating = minRating) => {
    let filtered = [...results];

    // Platform filter
    if (newPlatforms.length > 0) {
      filtered = filtered.filter((product) =>
        product.platforms.some((p) => newPlatforms.includes(p.name))
      );
    }

    // Rating filter
    if (newRating > 0) {
      filtered = filtered.filter((product) =>
        product.platforms.some((p) => p.rating >= newRating)
      );
    }

    // Sort
    switch (newSort) {
      case 'price_asc':
        filtered.sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
        break;
      case 'reviews':
        filtered.sort(
          (a, b) =>
            b.platforms.reduce((s, p) => s + (p.reviews || 0), 0) -
            a.platforms.reduce((s, p) => s + (p.reviews || 0), 0)
        );
        break;
      case 'platforms':
        filtered.sort((a, b) => b.platformCount - a.platformCount);
        break;
      default:
        break;
    }

    onFilteredResults(filtered);
  };

  const handleSort = (val) => {
    setSort(val);
    applyFilters(val, platforms, minRating);
  };

  const handlePlatformToggle = (platform) => {
    const updated = platforms.includes(platform)
      ? platforms.filter((p) => p !== platform)
      : [...platforms, platform];
    setPlatforms(updated);
    applyFilters(sort, updated, minRating);
  };

  const handleRating = (val) => {
    setMinRating(val);
    applyFilters(sort, platforms, val);
  };

  const clearFilters = () => {
    setSort('relevance');
    setPlatforms([]);
    setMinRating(0);
    applyFilters('relevance', [], 0);
  };

  const hasActiveFilters = sort !== 'relevance' || platforms.length > 0 || minRating > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Meta info */}
        <div className="text-sm text-slate-500">
          {meta && (
            <>
              <span className="font-semibold text-slate-800">{meta.totalGroups}</span> products found
              {meta.crossPlatformGroups > 0 && (
                <span className="ml-2 text-green-600 font-medium">
                  ({meta.crossPlatformGroups} cross-platform)
                </span>
              )}
              {meta.cached && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">cached</span>
              )}
              <span className="ml-2 text-slate-400 text-xs">{meta.fetchTime}ms</span>
            </>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white outline-none focus:border-blue-400 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-white text-blue-600 text-xs rounded-full flex items-center justify-center font-bold">
                {(platforms.length > 0 ? 1 : 0) + (minRating > 0 ? 1 : 0)}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-500 transition-colors">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-6">
          {/* Platform filter */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Platform</p>
            <div className="flex gap-2">
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePlatformToggle(p)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                    platforms.includes(p)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Rating filter */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Min Rating</p>
            <div className="flex gap-2">
              {[0, 3, 3.5, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRating(r)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                    minRating === r
                      ? 'bg-amber-400 text-white border-amber-400'
                      : 'text-slate-600 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {r === 0 ? 'All' : `${r}★`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
