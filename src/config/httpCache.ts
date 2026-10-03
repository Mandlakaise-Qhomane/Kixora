const IMMUTABLE_ASSET_EXTENSIONS = new Set([
  '.js',
  '.css',
  '.woff',
  '.woff2',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.gif',
  '.ico',
]);

export type CacheHeaders = Record<string, string>;

export function getApiNoStoreHeaders(): CacheHeaders {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    Pragma: 'no-cache',
    'Surrogate-Control': 'no-store',
    Vary: 'Origin',
  };
}

export function getCrawlerCacheHeaders(): CacheHeaders {
  return {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  };
}

export function getSpaEntryCacheHeaders(): CacheHeaders {
  return {
    'Cache-Control': 'public, max-age=0, must-revalidate',
  };
}

export function getImmutableAssetCacheHeaders(): CacheHeaders {
  return {
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
}

export function isImmutableAsset(filePath: string): boolean {
  const normalizedPath = filePath.toLowerCase();
  for (const extension of IMMUTABLE_ASSET_EXTENSIONS) {
    if (normalizedPath.endsWith(extension)) {
      return true;
    }
  }
  return false;
}

export function applyHeaders(
  target: { setHeader(name: string, value: string): void },
  headers: CacheHeaders,
): void {
  for (const [name, value] of Object.entries(headers)) {
    target.setHeader(name, value);
  }
}
