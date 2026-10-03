import { describe, expect, it } from 'vitest';
import { buildCspImageSources } from '../../src/config/cspImageSources';

describe('Content Security Policy image sources', () => {
  it('allows each host used by product image data and fixtures', () => {
    const imgSrc = buildCspImageSources();

    expect(imgSrc).toContain('https://images.unsplash.com');
    expect(imgSrc).toContain('https://res.cloudinary.com');
    expect(imgSrc).toContain('https://img.com');
    expect(imgSrc).not.toContain('https:');
    expect(imgSrc).not.toContain('*');
  });
});
