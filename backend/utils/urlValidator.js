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

  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  if (hostname.includes('google.')) {
    return false;
  }

  const genericSearchPaths = [
    '/search',
    '/s',
    '/shop',
    '/shopping',
    '/results',
    '/catalogsearch',
  ];

  if (genericSearchPaths.some((segment) => pathname === segment || pathname.startsWith(`${segment}/`))) {
    return false;
  }

  const amazonPatterns = [
    /amazon\.in\/dp\/[A-Z0-9]+/i,
    /amazon\.in\/.*\/dp\/[A-Z0-9]+/i,
    /amazon\.in\/gp\/product\/[A-Z0-9]+/i,
  ];
  const flipkartPatterns = [/flipkart\.com\/.*\/p\/[a-zA-Z0-9]+/i];

  const allPatterns = [...amazonPatterns, ...flipkartPatterns];
  if (allPatterns.some((p) => p.test(url))) {
    return true;
  }

  return pathname.split('/').filter(Boolean).length >= 1;
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
