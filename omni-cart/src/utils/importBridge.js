const IMPORT_PARAM = 'omniImport';

function toBase64Url(value) {
  return btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    Math.ceil(value.length / 4) * 4,
    '='
  );
  return decodeURIComponent(escape(atob(padded)));
}

export function normalizeImportCart(cart, source = 'extension') {
  const components = Array.isArray(cart?.components)
    ? cart.components.map((component) => ({
        name: component.name,
        quantity: component.quantity || 1,
        confidence_score: component.confidence_score ?? 0,
      }))
    : [];

  return {
    version: 1,
    source: cart?.source || source,
    importedAt: cart?.importedAt || new Date().toISOString(),
    components,
    optimized_maps_query: cart?.optimized_maps_query || 'electronic components shop',
    sourceTitle: cart?.sourceTitle || '',
  };
}

export function encodeImportCart(cart) {
  return toBase64Url(JSON.stringify(normalizeImportCart(cart)));
}

export function decodeImportCart(encoded) {
  if (!encoded) return null;
  try {
    return normalizeImportCart(JSON.parse(fromBase64Url(encoded)), 'url');
  } catch (error) {
    console.error('Failed to decode Omni-Cart import payload:', error);
    return null;
  }
}

export function getImportUrl(baseUrl, cart) {
  const url = new URL(baseUrl);
  url.hash = `${IMPORT_PARAM}=${encodeImportCart(cart)}`;
  return url.toString();
}

export function readImportCartFromUrl(location = window.location) {
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
  const queryParams = new URLSearchParams(location.search);
  return decodeImportCart(hashParams.get(IMPORT_PARAM) || queryParams.get(IMPORT_PARAM));
}

export function clearImportCartFromUrl() {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const queryParams = url.searchParams;

  hashParams.delete(IMPORT_PARAM);
  queryParams.delete(IMPORT_PARAM);

  url.search = queryParams.toString();
  url.hash = hashParams.toString();
  window.history.replaceState({}, document.title, url.toString());
}
