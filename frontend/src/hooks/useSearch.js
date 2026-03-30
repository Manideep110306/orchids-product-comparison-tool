import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { searchProducts } from '../services/searchService';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef(null);
  const activeRequestRef = useRef(0);
  const abortControllerRef = useRef(null);

  const search = useCallback(async (searchQuery) => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return;

    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await searchProducts(q, { signal: controller.signal });
      if (activeRequestRef.current !== requestId) return;

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
      if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return;
      }

      if (activeRequestRef.current !== requestId) return;

      const msg = err.response?.data?.error || err.message || 'Search failed. Please try again.';
      setError(msg);
      setResults([]);
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
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

  const handleSubmit = useCallback((nextQuery) => {
    clearTimeout(debounceRef.current);
    search(nextQuery ?? query);
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
