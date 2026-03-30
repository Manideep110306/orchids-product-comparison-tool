import { useState, useRef, useEffect } from 'react';
import { SearchIcon, X } from './Icons';

const POPULAR_SEARCHES = [
  'Wireless Headphones',
  'iPhone 15',
  'Samsung Galaxy S24',
  'Laptop under 50000',
  'Smart TV 55 inch',
  'OnePlus Nord 4',
  'Noise Cancelling Earbuds',
  'Mi Robot Vacuum',
];

export default function SearchBar({ query, onChange, onSubmit, loading }) {
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSubmit(query);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setTimeout(() => onSubmit(suggestion), 100);
  };

  const filteredSuggestions = query.length > 0
    ? POPULAR_SEARCHES.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : POPULAR_SEARCHES;

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
      <div
        className={`flex items-center bg-white rounded-2xl border-2 transition-all duration-200 shadow-lg ${
          focused ? 'border-blue-500 shadow-blue-100 shadow-xl' : 'border-slate-200'
        }`}
      >
        {/* Search icon */}
        <div className="pl-4 pr-2 text-slate-400">
          {loading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <SearchIcon className="w-5 h-5" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            setFocused(true);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search for products across online stores..."
          className="flex-1 py-4 px-2 text-base bg-transparent outline-none placeholder-slate-400 text-slate-800"
          disabled={loading}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
              setShowSuggestions(true);
            }}
            className="p-2 mr-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Search button */}
        <button
          onClick={() => {
            setShowSuggestions(false);
            onSubmit(query);
          }}
          disabled={loading || !query.trim()}
          className="mr-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && focused && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            {query ? 'Suggestions' : 'Popular Searches'}
          </div>
          {filteredSuggestions.slice(0, 6).map((s, i) => (
            <button
              key={i}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSuggestionClick(s)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
            >
              <SearchIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
