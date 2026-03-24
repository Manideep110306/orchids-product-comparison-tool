/**
 * URL validation utilities
 */

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isProductUrl(url) {
  if (!isValidUrl(url)) return false;

  const amazonPatterns = [/amazon\.in\/dp\/[A-Z0-9]+/, /amazon\.in\/.*\/dp\//];
  const flipkartPatterns = [/flipkart\.com\/.*\/p\/[a-zA-Z0-9]+/];

  const allPatterns = [...amazonPatterns, ...flipkartPatterns];
  return allPatterns.some((p) => p.test(url));
}

function validateProductUrls(products) {
  return products.map((product) => ({
    ...product,
    platforms: product.platforms.map((platform) => ({
      ...platform,
      urlValid: isValidUrl(platform.url),
      isProductUrl: isProductUrl(platform.url),
    })),
  }));
}

module.exports = { isValidUrl, isProductUrl, validateProductUrls };
