const { validateProductUrls } = require('../utils/urlValidator');
const { getCache, setCache } = require('../cache/queryCache');
const { generateMockProducts } = require('../utils/mockData');
const { groupProducts } = require('../utils/productGrouper');
const { filterProductsByQuery, isRelevantToQuery, scoreQueryMatch } = require('../utils/searchRelevance');
const { searchWithSerpApi } = require('../providers/serpApiProvider');

const USE_MOCK_FALLBACK = process.env.USE_MOCK === 'true' || false;

async function searchProducts(req, res) {
  const query = req.query.q;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters.' });
  }

  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `search:${normalizedQuery}`;

  console.log(`\n${'-'.repeat(60)}`);
  console.log(`[SEARCH] Query: "${normalizedQuery}"`);
  console.log(`${'-'.repeat(60)}`);

  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const startTime = Date.now();
  let results = [];
  let totalProducts = 0;
  let platformStatus = { serpapi: 'ok' };
  let platformCounts = {};
  let usedMock = false;

  try {
    const serpApiResponse = await searchWithSerpApi(normalizedQuery);
    const scoredResults = serpApiResponse.results
      .map((product) => ({
        product,
        score: scoreQueryMatch({ title: product.productName }, normalizedQuery),
      }))
      .sort((a, b) => b.score - a.score);

    const relevantResults = scoredResults
      .filter(({ product }) => isRelevantToQuery({ title: product.productName }, normalizedQuery))
      .map(({ product }) => product);

    if (relevantResults.length !== serpApiResponse.results.length) {
      console.log(
        `[SEARCH] Relevance filter kept ${relevantResults.length}/${serpApiResponse.results.length} product groups for "${normalizedQuery}"`
      );
    }

    if (relevantResults.length > 0) {
      results = relevantResults;
    } else {
      const fallbackResults = scoredResults
        .filter(({ score }) => score > 0)
        .map(({ product }) => product);

      if (fallbackResults.length > 0) {
        console.log(
          `[SEARCH] No strict matches for "${normalizedQuery}" - using ${fallbackResults.length} ranked fallback result(s)`
        );
        results = fallbackResults;
      } else {
        console.log(
          `[SEARCH] No scored matches for "${normalizedQuery}" - returning raw provider results`
        );
        results = serpApiResponse.results;
      }
    }

    totalProducts = serpApiResponse.totalProducts;
    platformStatus = serpApiResponse.platformStatus;
    platformCounts = serpApiResponse.platformCounts;
  } catch (error) {
    platformStatus.serpapi = 'error';
    console.error('[SEARCH] SerpApi failed:', error.message);

    if (!USE_MOCK_FALLBACK) {
      return res.status(503).json({
        error: error.message === 'SERPAPI_KEY is not configured.'
          ? 'Search is not configured. Add backend/.env with a valid SERPAPI_KEY, or enable USE_MOCK=true for demo results.'
          : 'Live product search is temporarily unavailable. Please try again later.',
        platformStatus,
        fetchTime: Date.now() - startTime,
      });
    }
  }

  if (results.length === 0 && USE_MOCK_FALLBACK) {
    console.log('[SEARCH] No live SerpApi results - using mock data fallback');
    const mockProducts = filterProductsByQuery(generateMockProducts(normalizedQuery), normalizedQuery);
    results = validateProductUrls(groupProducts(mockProducts));
    totalProducts = mockProducts.length;
    platformStatus.serpapi = 'mock';
    platformCounts = results.reduce((acc, product) => {
      product.platforms.forEach((platform) => {
        const key = platform.name.toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
      });
      return acc;
    }, {});
    usedMock = true;
  }

  if (results.length === 0) {
    return res.json({
      query: normalizedQuery,
      results: [],
      totalProducts: 0,
      platformStatus,
      message: 'No products found across any platform.',
      fetchTime: Date.now() - startTime,
    });
  }

  const validated = validateProductUrls(results);
  const fetchTime = Date.now() - startTime;
  console.log(`[SEARCH] Done in ${fetchTime}ms - ${validated.length} groups\n`);

  const response = {
    query: normalizedQuery,
    results: validated,
    totalProducts,
    totalGroups: validated.length,
    crossPlatformGroups: validated.filter((group) => group.platformCount > 1).length,
    platformStatus,
    platformCounts,
    fetchTime,
    cached: false,
    usedMock,
  };

  setCache(cacheKey, response);
  return res.json(response);
}

module.exports = { searchProducts };
