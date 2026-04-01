const axios = require('axios');
const { extractSpecs, extractBrand, extractModelNumbers } = require('../utils/productGrouper');

const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json';
const DEFAULT_MAX_PRODUCTS = parseInt(process.env.MAX_SERPAPI_PRODUCTS, 10) || 5;
const DEFAULT_MAX_STORES = parseInt(process.env.MAX_SERPAPI_STORES_PER_PRODUCT, 10) || 6;
const DEFAULT_ENRICHED_PRODUCTS = parseInt(process.env.MAX_SERPAPI_ENRICHED_PRODUCTS, 10) || DEFAULT_MAX_PRODUCTS;
const DEFAULT_OFFERS_TIMEOUT = parseInt(process.env.SERPAPI_OFFERS_TIMEOUT, 10) || 12000;
const QUERY_ALIAS_PATTERNS = [
  { pattern: /\biphone\b/i, expand: (query) => `apple ${query}` },
  { pattern: /\bairpods?\b/i, expand: (query) => `apple ${query}` },
  { pattern: /\bmacbook\b/i, expand: (query) => `apple ${query}` },
  { pattern: /\bipad\b/i, expand: (query) => `apple ${query}` },
  { pattern: /\bgalaxy\b/i, expand: (query) => `samsung ${query}` },
  { pattern: /\bvivobook\b/i, expand: (query) => `asus ${query}` },
  { pattern: /\bideapad\b/i, expand: (query) => `lenovo ${query}` },
  { pattern: /\bairdopes\b/i, expand: (query) => `boat ${query}` },
  { pattern: /\brockerz\b/i, expand: (query) => `boat ${query}` },
];

function getSerpApiConfig() {
  return {
    apiKey: process.env.SERPAPI_KEY,
    gl: process.env.SERPAPI_GL || 'in',
    hl: process.env.SERPAPI_HL || 'en',
    location: process.env.SERPAPI_LOCATION || 'India',
    timeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 30000,
  };
}

function normalizeAvailability(detailsAndOffers = []) {
  const text = detailsAndOffers.join(' ').toLowerCase();
  if (!text) return 'In Stock';
  if (text.includes('out of stock') || text.includes('unavailable')) {
    return 'Out of Stock';
  }
  return 'In Stock';
}

function normalizeDelivery(detailsAndOffers = []) {
  const detail = detailsAndOffers.find((item) => /delivery|shipping|pickup|arrives/i.test(item));
  return detail || 'Check site';
}

function uniquePlatformsByName(platforms) {
  const bestByName = new Map();

  for (const platform of platforms) {
    const key = platform.name.toLowerCase();
    const current = bestByName.get(key);
    if (!current) {
      bestByName.set(key, platform);
      continue;
    }

    const currentPrice = current.price ?? Number.POSITIVE_INFINITY;
    const nextPrice = platform.price ?? Number.POSITIVE_INFINITY;
    if (nextPrice < currentPrice) {
      bestByName.set(key, platform);
    }
  }

  return [...bestByName.values()];
}

function buildAggregates(platforms) {
  const prices = platforms.map((p) => p.price).filter((value) => value !== null && value !== undefined);
  const ratings = platforms.map((p) => p.rating).filter((value) => value !== null && value !== undefined);

  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10
    : null;

  return {
    minPrice,
    maxPrice,
    avgRating,
    platformCount: platforms.length,
    bestDealPlatform: minPrice === null
      ? null
      : platforms.find((platform) => platform.price === minPrice)?.name || null,
  };
}

async function fetchJson(params, timeout) {
  const response = await axios.get(SERPAPI_ENDPOINT, { params, timeout });
  return response.data;
}

function pickProductUrl(product) {
  const candidates = [
    product.link,
    product.product_link,
    product.serpapi_link,
    product.offer_link,
    product.inline_shopping_results?.link,
  ];

  return candidates.find((value) => typeof value === 'string' && /^https?:\/\//i.test(value)) || null;
}

function buildQueryCandidates(query) {
  const candidates = [query.trim()];

  for (const alias of QUERY_ALIAS_PATTERNS) {
    if (alias.pattern.test(query)) {
      const expanded = alias.expand(query).trim();
      if (!candidates.some((candidate) => candidate.toLowerCase() === expanded.toLowerCase())) {
        candidates.push(expanded);
      }
    }
  }

  return candidates;
}

async function fetchStoresForProduct(product, config) {
  const pageToken = product.serpapi_immersive_product_api?.page_token || product.immersive_product_page_token;
  if (!pageToken) {
    return [];
  }

  try {
    const data = await fetchJson({
      engine: 'google_immersive_product',
      page_token: pageToken,
      more_stores: 'true',
      gl: config.gl,
      hl: config.hl,
      api_key: config.apiKey,
    }, DEFAULT_OFFERS_TIMEOUT);

    const stores = data.product_results?.stores || [];
    return stores.slice(0, DEFAULT_MAX_STORES).map((store, index) => ({
      name: store.name || `Store ${index + 1}`,
      price: store.extracted_price ?? null,
      rating: typeof store.rating === 'number' ? store.rating : null,
      reviews: typeof store.reviews === 'number' ? store.reviews : 0,
      url: store.link || null,
      availability: normalizeAvailability(store.details_and_offers),
      delivery: normalizeDelivery(store.details_and_offers),
      image: product.thumbnail || product.thumbnails?.[0] || null,
    }));
  } catch (error) {
    console.warn(`[SERPAPI] Failed to fetch stores for "${product.title}": ${error.message}`);
    return [];
  }
}

async function searchWithSerpApi(query) {
  const config = getSerpApiConfig();
  if (!config.apiKey) {
    throw new Error('SERPAPI_KEY is not configured.');
  }

  const queryCandidates = buildQueryCandidates(query);
  let shoppingResults = [];
  let matchedQuery = queryCandidates[0];

  for (const candidate of queryCandidates) {
    console.log(`[SERPAPI] Searching Google Shopping for "${candidate}"`);
    const data = await fetchJson({
      engine: 'google_shopping',
      q: candidate,
      gl: config.gl,
      hl: config.hl,
      location: config.location,
      api_key: config.apiKey,
    }, config.timeout);

    shoppingResults = (data.shopping_results || []).slice(0, DEFAULT_MAX_PRODUCTS);
    if (shoppingResults.length > 0) {
      matchedQuery = candidate;
      break;
    }
  }

  console.log(`[SERPAPI] Found ${shoppingResults.length} shopping products using "${matchedQuery}"`);

  const storeResults = await Promise.all(
    shoppingResults.map((product, index) => (
      index < DEFAULT_ENRICHED_PRODUCTS
        ? fetchStoresForProduct(product, config)
        : Promise.resolve([])
    ))
  );

  const results = shoppingResults.map((product, index) => {
    const platforms = uniquePlatformsByName(storeResults[index]).sort((a, b) => {
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return a.price - b.price;
    });

    const title = product.title || 'Untitled product';
    const image = product.thumbnail || product.thumbnails?.[0] || null;
    const productUrl = pickProductUrl(product);
    const normalizedPlatforms = platforms.length > 0 ? platforms : [{
      name: product.source || 'Google Shopping',
      price: product.extracted_price ?? null,
      rating: typeof product.rating === 'number' ? product.rating : null,
      reviews: typeof product.reviews === 'number' ? product.reviews : 0,
      url: productUrl,
      availability: 'Check site',
      delivery: 'Check site',
      image,
    }];

    return {
      id: `serpapi_${product.product_id || index}_${Date.now()}`,
      productName: title,
      image,
      specs: extractSpecs(title),
      brand: extractBrand(title),
      modelNumbers: extractModelNumbers(title),
      platforms: normalizedPlatforms,
      ...buildAggregates(normalizedPlatforms),
    };
  });

  return {
    results,
    totalProducts: shoppingResults.length,
    platformStatus: { serpapi: 'ok' },
    platformCounts: results.reduce((acc, result) => {
      result.platforms.forEach((platform) => {
        acc[platform.name] = (acc[platform.name] || 0) + 1;
      });
      return acc;
    }, {}),
  };
}

module.exports = { searchWithSerpApi };
