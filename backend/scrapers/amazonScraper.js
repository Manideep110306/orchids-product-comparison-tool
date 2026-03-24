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
  'Cache-Control': 'max-age=0',
  'Upgrade-Insecure-Requests': '1',
};

const BASE_URL = 'https://www.amazon.in/s?k=';

function cleanPrice(priceStr) {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function cleanRating(ratingStr) {
  if (!ratingStr) return null;
  const match = ratingStr.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function cleanReviews(reviewStr) {
  if (!reviewStr) return 0;
  const cleaned = reviewStr.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}

function buildProductUrl(asin) {
  if (!asin) return null;
  return `https://www.amazon.in/dp/${asin}`;
}

async function scrapeAmazon(query) {
  console.log(`[AMAZON] Scraping query: "${query}"`);
  const products = [];

  try {
    const searchUrl = `${BASE_URL}${encodeURIComponent(query)}`;
    console.log(`[AMAZON] URL: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
      headers: HEADERS,
      timeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    });

    const $ = cheerio.load(response.data);
    const maxResults = parseInt(process.env.MAX_RESULTS_PER_PLATFORM) || 10;

    const items = $('[data-component-type="s-search-result"]').not('[data-ad-feedback-details]');
    console.log(`[AMAZON] Found ${items.length} raw items`);

    items.each((i, el) => {
      if (products.length >= maxResults) return false;

      try {
        const $el = $(el);

        // Skip sponsored
        const isSponsored =
          $el.find('.puis-sponsored-label-text').length > 0 ||
          $el.find('[data-ad-feedback-details]').length > 0 ||
          $el.attr('data-ad-feedback-details') !== undefined;
        if (isSponsored) return;

        const asin = $el.attr('data-asin');
        if (!asin) return;

        // Title
        const title =
          $el.find('h2 a span').first().text().trim() ||
          $el.find('.a-size-medium.a-color-base.a-text-normal').first().text().trim();
        if (!title || title.length < 5) return;

        // Price
        const priceWhole = $el.find('.a-price-whole').first().text().trim();
        const priceFraction = $el.find('.a-price-fraction').first().text().trim();
        const priceStr = priceWhole ? `${priceWhole}.${priceFraction || '00'}` : null;
        const price = cleanPrice(priceStr);

        // Rating
        const ratingEl = $el.find('.a-icon-star-small .a-icon-alt, .a-icon-star .a-icon-alt').first().text();
        const rating = cleanRating(ratingEl);

        // Reviews
        const reviewsEl = $el.find('.a-size-small .a-link-normal[href*="customerReviews"], [aria-label*="stars"] ~ a').first().text();
        const reviews = cleanReviews(reviewsEl);

        // Image
        const image = $el.find('img.s-image').attr('src') || null;

        // Availability
        const availability =
          $el.find('.a-size-small.a-color-price').text().includes('Currently unavailable')
            ? 'Out of Stock'
            : 'In Stock';

        // Delivery
        const delivery =
          $el.find('.a-color-secondary .a-size-base').first().text().trim() || 'Check site';

        // URL
        const relativeUrl = $el.find('h2 a').attr('href');
        const productUrl = relativeUrl
          ? `https://www.amazon.in${relativeUrl.split('?')[0]}`
          : buildProductUrl(asin);

        if (!title || !image) return;

        products.push({
          id: `amazon_${asin}`,
          platform: 'Amazon',
          asin,
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
        console.warn(`[AMAZON] Error parsing item ${i}:`, err.message);
      }
    });

    console.log(`[AMAZON] Scraped ${products.length} valid products`);
    return products;
  } catch (err) {
    console.error(`[AMAZON] Scraping failed:`, err.message);
    return [];
  }
}

module.exports = { scrapeAmazon };
