const NodeCache = require('node-cache');

// TTL: 5 minutes by default, check every 2 minutes
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 300,
  checkperiod: 120,
  useClones: false,
});

const getCache = (key) => {
  const val = cache.get(key);
  if (val) {
    console.log(`[CACHE HIT] key="${key}"`);
    return val;
  }
  console.log(`[CACHE MISS] key="${key}"`);
  return null;
};

const setCache = (key, value) => {
  cache.set(key, value);
  console.log(`[CACHE SET] key="${key}" | items: ${Object.keys(value).length || '?'}`);
};

const clearCache = () => {
  cache.flushAll();
  console.log('[CACHE CLEARED]');
};

const getCacheStats = () => cache.getStats();

module.exports = { getCache, setCache, clearCache, getCacheStats };
