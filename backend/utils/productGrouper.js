/**
 * ─────────────────────────────────────────────────────────────
 * PRODUCT GROUPING ENGINE
 * Groups identical/similar products from different platforms
 * into unified cards for price comparison
 * ─────────────────────────────────────────────────────────────
 */

// ─── String Utilities ────────────────────────────────────────────────────────

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(title) {
  return normalizeTitle(title).split(' ').filter((t) => t.length > 1);
}

// Extract model numbers like "WH-1000XM5", "TWS-1200", "AX200" etc.
function extractModelNumbers(title) {
  const patterns = [
    /\b[A-Z]{1,4}[-\s]?\d{3,6}[A-Z0-9]{0,4}\b/gi,
    /\b\d{3,6}[A-Z]{1,4}\b/gi,
    /\b[A-Z]{2,6}\d{2,6}\b/gi,
  ];
  const models = new Set();
  patterns.forEach((p) => {
    const matches = title.match(p) || [];
    matches.forEach((m) => models.add(m.toUpperCase().replace(/\s/g, '-')));
  });
  return [...models];
}

// Jaccard similarity on token sets
function jaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// Bigram similarity for more robust fuzzy matching
function bigrams(str) {
  const s = str.replace(/\s/g, '');
  const bg = new Set();
  for (let i = 0; i < s.length - 1; i++) {
    bg.add(s.substring(i, i + 2));
  }
  return bg;
}

function bigramSimilarity(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  const bgA = bigrams(na);
  const bgB = bigrams(nb);
  const intersection = new Set([...bgA].filter((x) => bgB.has(x)));
  const union = new Set([...bgA, ...bgB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// ─── Model Number Matching ────────────────────────────────────────────────────

function hasModelOverlap(titleA, titleB) {
  const modelsA = extractModelNumbers(titleA);
  const modelsB = extractModelNumbers(titleB);
  if (modelsA.length === 0 || modelsB.length === 0) return false;
  return modelsA.some((m) => modelsB.includes(m));
}

// ─── Brand Extraction ─────────────────────────────────────────────────────────

const KNOWN_BRANDS = [
  'apple', 'samsung', 'sony', 'lg', 'oneplus', 'xiaomi', 'redmi', 'realme',
  'oppo', 'vivo', 'nokia', 'motorola', 'lenovo', 'asus', 'acer', 'hp', 'dell',
  'bosch', 'philips', 'bose', 'jbl', 'sennheiser', 'skullcandy', 'boat',
  'ptron', 'noise', 'zebronics', 'intex', 'havells', 'syska', 'bajaj',
  'whirlpool', 'godrej', 'voltas', 'daikin', 'carrier', 'logitech', 'razer',
  'corsair', 'nikon', 'canon', 'fujifilm', 'godox', 'anker', 'baseus',
];

function extractBrand(title) {
  const lower = title.toLowerCase();
  return KNOWN_BRANDS.find((b) => lower.includes(b)) || null;
}

// ─── Combined Similarity Score ────────────────────────────────────────────────

function computeSimilarity(productA, productB) {
  const titleA = productA.title;
  const titleB = productB.title;

  // Model number exact match → very high similarity
  if (hasModelOverlap(titleA, titleB)) {
    return 0.92;
  }

  // Brand mismatch → cannot be same product
  const brandA = extractBrand(titleA);
  const brandB = extractBrand(titleB);
  if (brandA && brandB && brandA !== brandB) {
    return 0;
  }

  const tokensA = tokenize(titleA);
  const tokensB = tokenize(titleB);

  const jaccard = jaccardSimilarity(tokensA, tokensB);
  const bigram = bigramSimilarity(titleA, titleB);

  // Weighted combination
  const combined = jaccard * 0.5 + bigram * 0.5;

  return combined;
}

// ─── Extract Specs from Title ─────────────────────────────────────────────────

function extractSpecs(title) {
  const specs = {};

  // Storage: 128GB, 256GB, 512GB, 1TB
  const storageMatch = title.match(/\b(\d+\s?(?:GB|TB|MB))\b/gi);
  if (storageMatch) specs.storage = storageMatch.join(', ');

  // RAM
  const ramMatch = title.match(/\b(\d+\s?GB\s?RAM)\b/gi);
  if (ramMatch) specs.ram = ramMatch[0];

  // Display size
  const displayMatch = title.match(/\b(\d+\.?\d*[\s"]?\s?(?:inch|"|\"|cm))\b/gi);
  if (displayMatch) specs.display = displayMatch[0];

  // Color
  const colors = ['black', 'white', 'silver', 'gold', 'blue', 'red', 'green', 'grey', 'gray', 'purple', 'pink', 'brown', 'orange'];
  const titleLower = title.toLowerCase();
  const foundColor = colors.find((c) => titleLower.includes(c));
  if (foundColor) specs.color = foundColor.charAt(0).toUpperCase() + foundColor.slice(1);

  // Battery
  const batteryMatch = title.match(/\b(\d{3,5}\s?mAh)\b/gi);
  if (batteryMatch) specs.battery = batteryMatch[0];

  // Model number
  const models = extractModelNumbers(title);
  if (models.length > 0) specs.model = models[0];

  return specs;
}

// ─── Main Grouping Function ───────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 0.55;

function groupProducts(allProducts) {
  console.log(`[GROUPER] Input: ${allProducts.length} products`);

  const groups = [];
  const used = new Set();

  for (let i = 0; i < allProducts.length; i++) {
    if (used.has(i)) continue;

    const base = allProducts[i];
    const group = {
      id: `group_${i}_${Date.now()}`,
      productName: base.title,
      image: base.image,
      specs: extractSpecs(base.title),
      brand: extractBrand(base.title),
      modelNumbers: extractModelNumbers(base.title),
      platforms: [],
    };

    // Add base product
    group.platforms.push({
      name: base.platform,
      price: base.price,
      rating: base.rating,
      reviews: base.reviews,
      url: base.url,
      availability: base.availability,
      delivery: base.delivery,
      image: base.image,
    });

    used.add(i);

    // Find matching products from OTHER platforms
    for (let j = i + 1; j < allProducts.length; j++) {
      if (used.has(j)) continue;

      const candidate = allProducts[j];

      // Don't group same platform products together
      const alreadyHasPlatform = group.platforms.some((p) => p.name === candidate.platform);
      if (alreadyHasPlatform) continue;

      const score = computeSimilarity(base, candidate);
      console.log(
        `[GROUPER] "${base.title.substring(0, 40)}" ↔ "${candidate.title.substring(0, 40)}" = ${score.toFixed(3)}`
      );

      if (score >= SIMILARITY_THRESHOLD) {
        group.platforms.push({
          name: candidate.platform,
          price: candidate.price,
          rating: candidate.rating,
          reviews: candidate.reviews,
          url: candidate.url,
          availability: candidate.availability,
          delivery: candidate.delivery,
          image: candidate.image,
        });

        // Use better image (prefer the one with https)
        if (!group.image && candidate.image) {
          group.image = candidate.image;
        }

        used.add(j);
      }
    }

    // Sort platforms by price (lowest first)
    group.platforms.sort((a, b) => {
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return a.price - b.price;
    });

    // Compute aggregate stats
    const prices = group.platforms.map((p) => p.price).filter((p) => p !== null);
    const ratings = group.platforms.map((p) => p.rating).filter((r) => r !== null);

    group.minPrice = prices.length > 0 ? Math.min(...prices) : null;
    group.maxPrice = prices.length > 0 ? Math.max(...prices) : null;
    group.avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
    group.platformCount = group.platforms.length;
    group.bestDealPlatform =
      prices.length > 0
        ? group.platforms.find((p) => p.price === group.minPrice)?.name
        : null;

    groups.push(group);
  }

  // Sort groups: multi-platform first, then by min price
  groups.sort((a, b) => {
    if (b.platformCount !== a.platformCount) return b.platformCount - a.platformCount;
    if (a.minPrice === null) return 1;
    if (b.minPrice === null) return -1;
    return a.minPrice - b.minPrice;
  });

  console.log(`[GROUPER] Output: ${groups.length} groups (${groups.filter((g) => g.platformCount > 1).length} cross-platform)`);
  return groups;
}

module.exports = { groupProducts, computeSimilarity, extractSpecs, extractBrand, extractModelNumbers };
