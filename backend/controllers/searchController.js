const { scrapeAmazon } = require('../scrapers/amazonScraper');
const { scrapeFlipkart } = require('../scrapers/flipkartScraper');
const { groupProducts } = require('../utils/productGrouper');
const { validateProductUrls } = require('../utils/urlValidator');
const { getCache, setCache } = require('../cache/queryCache');
const { generateMockProducts } = require('../utils/mockData');

const USE_MOCK_FALLBACK = process.env.USE_MOCK === 'true' || false;

async function searchProducts(req, res) {
  const query = req.query.q;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters.' });
  }

  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `search:${normalizedQuery}`;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[SEARCH] Query: "${normalizedQuery}"`);
  console.log(`${'─'.repeat(60)}`);

  // Check cache
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  // Parallel fetch from all platforms
  const startTime = Date.now();
  const platformStatus = { amazon: 'ok', flipkart: 'ok' };

  const [amazonResults, flipkartResults] = await Promise.allSettled([
    scrapeAmazon(normalizedQuery),
    scrapeFlipkart(normalizedQuery),
  ]);

  let amazonProducts = amazonResults.status === 'fulfilled' ? amazonResults.value : [];
  let flipkartProducts = flipkartResults.status === 'fulfilled' ? flipkartResults.value : [];

  if (amazonResults.status === 'rejected') {
    platformStatus.amazon = 'error';
    console.error('[SEARCH] Amazon failed:', amazonResults.reason?.message);
  }
  if (flipkartResults.status === 'rejected') {
    platformStatus.flipkart = 'error';
    console.error('[SEARCH] Flipkart failed:', flipkartResults.reason?.message);
  }

  let allProducts = [...amazonProducts, ...flipkartProducts];
  let usedMock = false;

  // Fallback to mock data if scraping returned nothing
  if (allProducts.length === 0) {
    console.log('[SEARCH] No live results — using mock data fallback');
    allProducts = generateMockProducts(normalizedQuery);
    usedMock = true;
    platformStatus.amazon = 'mock';
    platformStatus.flipkart = 'mock';

    // Split mock data by platform
    amazonProducts = allProducts.filter(p => p.platform === 'Amazon');
    flipkartProducts = allProducts.filter(p => p.platform === 'Flipkart');
  }

  if (allProducts.length === 0) {
    return res.json({
      query: normalizedQuery,
      results: [],
      totalProducts: 0,
      platformStatus,
      message: 'No products found across any platform.',
      fetchTime: Date.now() - startTime,
    });
  }

  // Group products
  console.log(`\n[SEARCH] Grouping ${allProducts.length} total products...`);
  const grouped = groupProducts(allProducts);
  const validated = validateProductUrls(grouped);

  const fetchTime = Date.now() - startTime;
  console.log(`[SEARCH] Done in ${fetchTime}ms — ${validated.length} groups\n`);

  const response = {
    query: normalizedQuery,
    results: validated,
    totalProducts: allProducts.length,
    totalGroups: validated.length,
    crossPlatformGroups: validated.filter((g) => g.platformCount > 1).length,
    platformStatus,
    platformCounts: {
      amazon: amazonProducts.length,
      flipkart: flipkartProducts.length,
    },
    fetchTime,
    cached: false,
    usedMock,
  };

  // Cache the response
  setCache(cacheKey, response);

  return res.json(response);
}

module.exports = { searchProducts };
