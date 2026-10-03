import { describe, expect, it } from 'vitest';
import {
  getApiNoStoreHeaders,
  getCrawlerCacheHeaders,
  getImmutableAssetCacheHeaders,
  getSpaEntryCacheHeaders,
  isImmutableAsset,
} from '../../src/config/httpCache';

describe('httpCache policy helpers', () => {
  it('returns no-store headers for API and webhook routes', () => {
    expect(getApiNoStoreHeaders()).toEqual({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      'Surrogate-Control': 'no-store',
      Vary: 'Origin',
    });
  });

  it('returns must-revalidate headers for the SPA entrypoint', () => {
    expect(getSpaEntryCacheHeaders()).toEqual({
      'Cache-Control': 'public, max-age=0, must-revalidate',
    });
  });

  it('returns immutable caching for hashed static assets', () => {
    expect(getImmutableAssetCacheHeaders()).toEqual({
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    expect(isImmutableAsset('/workspace/dist/assets/index-abc123.js')).toBe(true);
    expect(isImmutableAsset('/workspace/dist/assets/logo.webp')).toBe(true);
    expect(isImmutableAsset('/workspace/dist/index.html')).toBe(false);
  });

  it('returns short-lived public caching for crawler metadata routes', () => {
    expect(getCrawlerCacheHeaders()).toEqual({
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    });
  });
});
