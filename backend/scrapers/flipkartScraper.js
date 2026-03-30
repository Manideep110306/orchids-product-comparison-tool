const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-IN,en;q=0.9',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
};

const BASE_URL = 'https://www.flipkart.com/search?q=';

function cleanPrice(priceStr) {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function cleanRating(ratingStr) {
  if (!ratingStr) return null;
  const match = String(ratingStr).match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function cleanReviews(reviewStr) {
  if (!reviewStr) return 0;
  // Handle "1,234 Ratings" or "1.2K Ratings"
  const str = String(reviewStr).toLowerCase();
  if (str.includes('k')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return Math.round(num * 1000);
  }
  const cleaned = str.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}

function extractFlipkartPID(url) {
  if (!url) return null;
  const match = url.match(/\/p\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

async function scrapeFlipkart(query) {
  console.log(`[FLIPKART] Scraping query: "${query}"`);
  const products = [];

  try {
    const searchUrl = `${BASE_URL}${encodeURIComponent(query)}`;
    console.log(`[FLIPKART] URL: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
      headers: HEADERS,
      timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    });

    const $ = cheerio.load(response.data);
    const maxResults = parseInt(process.env.MAX_RESULTS_PER_PLATFORM) || 10;

    // Flipkart uses different selectors — try multiple
    let items = $('div[data-id]');
    if (items.length === 0) {
      items = $('div._1AtVbE').filter((i, el) => $(el).find('a._1fQZEK, a.s1Q9rs').length > 0);
    }

    console.log(`[FLIPKART] Found ${items.length} raw items`);

    items.each((i, el) => {
      if (products.length >= maxResults) return false;

      try {
        const $el = $(el);

        // Skip sponsored/ads
        const isAd = $el.find('._2eTFAf, .sponsored-label').length > 0;
        if (isAd) return;

        // Title — try multiple selectors
        const title =
          $el.find('._4rR01T').first().text().trim() ||
          $el.find('.s1Q9rs').first().text().trim() ||
          $el.find('a[title]').first().attr('title') ||
          $el.find('.IRpwTa').first().text().trim() ||
          $el.find('div._2WkVRV').first().text().trim();

        if (!title || title.length < 5) return;

        // Price
        const priceEl =
          $el.find('._30jeq3').first().text() ||
          $el.find('._1_WHN1').first().text() ||
          $el.find('div._30jeq3._1_WHN1').first().text();
        const price = cleanPrice(priceEl);

        // Rating
        const ratingEl =
          $el.find('._3LWZlK').first().text() ||
          $el.find('div._3LWZlK').first().text();
        const rating = cleanRating(ratingEl);

        // Reviews
        const reviewsEl =
          $el.find('._2_R_DZ span').first().text() ||
          $el.find('span._13vcmD').first().text() ||
          $el.find('span._2_R_DZ').first().text();
        const reviews = cleanReviews(reviewsEl);

        // Image
        const image =
          $el.find('img._396cs4').attr('src') ||
          $el.find('img._2r_T1I').attr('src') ||
          $el.find('img').first().attr('src') ||
          null;

        // URL
        const relPath =
          $el.find('a[href*="/p/"]').first().attr('href') ||
          $el.find('a._1fQZEK[href*="/p/"]').attr('href') ||
          $el.find('a.s1Q9rs[href*="/p/"]').attr('href');

        const productUrl = relPath
          ? relPath.startsWith('http')
            ? relPath.split('?')[0]
            : `https://www.flipkart.com${relPath.split('?')[0]}`
          : null;

        if (!productUrl) return;
        const pid = extractFlipkartPID(productUrl);
        if (!pid) return;

        // Availability
        const outOfStock = $el.find('._16FRp0, .btn-out-of-stock').length > 0;
        const availability = outOfStock ? 'Out of Stock' : 'In Stock';

        // Delivery
        const delivery =
          $el.find('._3tcF9').first().text().trim() ||
          $el.find('._2Tpdn3').first().text().trim() ||
          'Check site';

        if (!title || !image) return;

        products.push({
          id: pid ? `flipkart_${pid}` : `flipkart_${i}_${Date.now()}`,
          platform: 'Flipkart',
          pid,
          title,
          image,
          price,
          rating,
          reviews,
          availability,
          delivery,
          url: productUrl,
        });
      } catch (err) {
        console.warn(`[FLIPKART] Error parsing item ${i}:`, err.message);
      }
    });

    console.log(`[FLIPKART] Scraped ${products.length} valid products`);
    return products;
  } catch (err) {
    console.error(`[FLIPKART] Scraping failed:`, err.message);
    return [];
  }
}

module.exports = { scrapeFlipkart };
