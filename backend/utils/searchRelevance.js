const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with',
  'under', 'over', 'into', 'your', 'our', 'new', 'latest', 'best', 'deal', 'combo', 'pack',
]);

const BRAND_TERMS = new Set([
  'apple', 'samsung', 'sony', 'lg', 'oneplus', 'xiaomi', 'redmi', 'realme', 'oppo', 'vivo',
  'nokia', 'motorola', 'lenovo', 'asus', 'acer', 'hp', 'dell', 'boat', 'noise', 'bose',
  'jbl', 'logitech', 'canon', 'nikon', 'philips',
]);

const ACCESSORY_TERMS = new Set([
  'case', 'cover', 'charger', 'adapter', 'cable', 'protector', 'skin', 'stand', 'holder',
  'refill', 'replacement', 'strap', 'band', 'mount', 'bag', 'sleeve', 'keyboard', 'mouse',
]);

const VARIANT_TERMS = new Set([
  'ultra', 'plus', 'pro', 'max', 'mini', 'lite', 'fe', 'air', 'se', 'prime',
]);

const IGNORABLE_EXTRA_TERMS = new Set([
  '5g', '4g', 'wifi', 'bluetooth', 'smartphone', 'phone', 'mobile', 'cellular', 'unlocked',
  'dual', 'sim', 'esim', 'with', 'without', 'display', 'screen', 'inch', 'inches',
  'ram', 'rom', 'ssd', 'hdd', 'storage', 'camera', 'battery', 'mah', 'hz',
  'galaxy',
  'black', 'white', 'blue', 'red', 'green', 'silver', 'gold', 'gray', 'grey', 'pink',
  'purple', 'yellow', 'orange', 'brown', '128gb', '256gb', '512gb', '1tb', '64gb', '32gb',
]);

const IMPLIED_BRAND_BY_TOKEN = {
  iphone: 'apple',
  ipad: 'apple',
  macbook: 'apple',
  airpods: 'apple',
  galaxy: 'samsung',
  vivobook: 'asus',
  ideapad: 'lenovo',
  airdopes: 'boat',
  rockerz: 'boat',
};

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactText(value) {
  return normalizeText(value).replace(/\s/g, '');
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function extractModelLikeTokens(value) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => /\d/.test(token) || /[a-z]/.test(token) && /\d/.test(token));
}

function hasAccessoryMismatch(queryTokens, titleTokens) {
  const querySet = new Set(queryTokens);
  const titleSet = new Set(titleTokens);

  return [...ACCESSORY_TERMS].some((term) => !querySet.has(term) && titleSet.has(term));
}

function hasVariantMismatch(queryTokens, titleTokens) {
  const querySet = new Set(queryTokens);
  const titleSet = new Set(titleTokens);

  return [...VARIANT_TERMS].some((term) => !querySet.has(term) && titleSet.has(term));
}

const IGNOREABLE_TOKEN_PATTERN = /^(\d+(gb|tb|mah|hz|mp)|\d+(\.\d+)?(cm|inch|inches)|[a-z]*\d+[a-z0-9]*)$/i;

function getImpliedBrands(queryTokens) {
  return new Set(
    queryTokens
      .map((token) => IMPLIED_BRAND_BY_TOKEN[token])
      .filter(Boolean)
  );
}

function isAllowedBrandPrefix(queryTokens, extraTokens) {
  const queryBrands = new Set(queryTokens.filter((token) => BRAND_TERMS.has(token)));
  const impliedBrands = getImpliedBrands(queryTokens);

  return extraTokens.every((token) => (
    BRAND_TERMS.has(token) && (queryBrands.has(token) || impliedBrands.has(token))
  ));
}

function allQueryTokensPresent(queryTokens, titleTokens) {
  if (queryTokens.length === 0) {
    return false;
  }

  const titleSet = new Set(titleTokens);
  return queryTokens.every((token) => titleSet.has(token));
}

function scoreQueryMatch(product, query) {
  const title = product?.title || '';
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);

  if (!normalizedQuery || !normalizedTitle) {
    return 0;
  }

  if (normalizedTitle === normalizedQuery) {
    return 1;
  }

  const queryCompact = compactText(query);
  const titleCompact = compactText(title);
  if (queryCompact.length > 3 && titleCompact === queryCompact) {
    return 0.98;
  }

  const queryTokens = tokenize(query);
  const titleTokens = tokenize(title);
  const overlap = getTokenOverlap(queryTokens, titleTokens);
  const allTokensPresent = allQueryTokensPresent(queryTokens, titleTokens);
  const queryModels = extractModelLikeTokens(query);
  const titleModelSet = new Set(extractModelLikeTokens(title));
  const hasModelOverlap =
    queryModels.length > 0 && queryModels.some((token) => titleModelSet.has(token));
  const missingModelToken =
    queryModels.length > 0 && queryModels.some((token) => !titleModelSet.has(token));

  if (hasAccessoryMismatch(queryTokens, titleTokens)) {
    return 0;
  }

  if (hasVariantMismatch(queryTokens, titleTokens)) {
    return 0;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return hasModelOverlap || queryModels.length === 0 ? 0.95 : 0.7;
  }

  if (queryCompact.length > 3 && titleCompact.includes(queryCompact)) {
    return hasModelOverlap || queryModels.length === 0 ? 0.93 : 0.68;
  }

  if (missingModelToken) {
    return 0;
  }

  if (queryTokens.length === 1) {
    return overlap === 1 ? 0.9 : 0;
  }

  if (allTokensPresent) {
    return hasModelOverlap || queryModels.length === 0 ? 0.9 : 0.78;
  }

  if (hasModelOverlap) {
    return overlap >= 0.5 ? 0.88 : 0;
  }

  if (queryTokens.length === 2) {
    return overlap >= 1 ? 0.82 : 0;
  }

  return overlap >= 0.75 ? overlap : 0;
}

function getTokenOverlap(queryTokens, titleTokens) {
  if (queryTokens.length === 0 || titleTokens.length === 0) {
    return 0;
  }

  const titleSet = new Set(titleTokens);
  const matched = queryTokens.filter((token) => titleSet.has(token));
  return matched.length / queryTokens.length;
}

function isRelevantToQuery(product, query) {
  return scoreQueryMatch(product, query) >= 0.75;
}

function filterProductsByQuery(products, query) {
  return products.filter((product) => isRelevantToQuery(product, query));
}

module.exports = {
  filterProductsByQuery,
  isRelevantToQuery,
  scoreQueryMatch,
};
