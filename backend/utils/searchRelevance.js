const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with',
  'under', 'over', 'into', 'your', 'our', 'new', 'latest', 'best', 'deal', 'combo', 'pack',
]);

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

function getTokenOverlap(queryTokens, titleTokens) {
  if (queryTokens.length === 0 || titleTokens.length === 0) {
    return 0;
  }

  const titleSet = new Set(titleTokens);
  const matched = queryTokens.filter((token) => titleSet.has(token));
  return matched.length / queryTokens.length;
}

function isRelevantToQuery(product, query) {
  const title = product?.title || '';
  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(title);

  if (!normalizedQuery || !normalizedTitle) {
    return false;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return true;
  }

  const queryCompact = compactText(query);
  const titleCompact = compactText(title);
  if (queryCompact.length > 3 && titleCompact.includes(queryCompact)) {
    return true;
  }

  const queryTokens = tokenize(query);
  const titleTokens = tokenize(title);
  const overlap = getTokenOverlap(queryTokens, titleTokens);

  if (queryTokens.length === 1) {
    return overlap === 1;
  }

  const queryModels = extractModelLikeTokens(query);
  const titleModelSet = new Set(extractModelLikeTokens(title));
  const hasModelOverlap =
    queryModels.length > 0 && queryModels.some((token) => titleModelSet.has(token));

  if (hasModelOverlap && overlap >= 0.5) {
    return true;
  }

  if (queryTokens.length === 2) {
    return overlap >= 0.5;
  }

  return overlap >= 0.6;
}

function filterProductsByQuery(products, query) {
  return products.filter((product) => isRelevantToQuery(product, query));
}

module.exports = {
  filterProductsByQuery,
  isRelevantToQuery,
};
