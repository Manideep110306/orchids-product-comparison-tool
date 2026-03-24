import { useState, useCallback, useRef } from 'react';
import { searchProducts } from '../services/searchService';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef(null);

  const search = useCallback(async (searchQuery) => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await searchProducts(q);
      setResults(data.results || []);
      setMeta({
        query: data.query,
        totalProducts: data.totalProducts,
        totalGroups: data.totalGroups,
        crossPlatformGroups: data.crossPlatformGroups,
        platformStatus: data.platformStatus,
        platformCounts: data.platformCounts,
        fetchTime: data.fetchTime,
        cached: data.cached,
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Search failed. Please try again.';
      setError(msg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((q) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(q);
    }, 600);
  }, [search]);

  const handleQueryChange = useCallback((val) => {
    setQuery(val);
  }, []);

  const handleSubmit = useCallback(() => {
    clearTimeout(debounceRef.current);
    search(query);
  }, [query, search]);

  return {
    query,
    results,
    loading,
    error,
    meta,
    searched,
    handleQueryChange,
    handleSubmit,
    debouncedSearch,
    setResults,
  };
}
