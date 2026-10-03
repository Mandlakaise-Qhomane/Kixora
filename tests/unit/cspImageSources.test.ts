import { describe, expect, it } from 'vitest';
import { buildCspImageSources } from '../../src/config/cspImageSources';

describe('Content Security Policy image sources', () => {
  it('allows the image hosts used by the app without unrelated hosts', () => {
    const imgSrc = buildCspImageSources();

    expect(imgSrc).toContain('https://images.unsplash.com');
    expect(imgSrc).toContain('https://res.cloudinary.com');
    expect(imgSrc).not.toContain('https://img.com');
    expect(imgSrc).not.toContain('https://v5.airtableusercontent.com');
    expect(imgSrc).not.toContain('https://*.googleusercontent.com');
    expect(imgSrc).not.toContain('blob:');
    expect(imgSrc).not.toContain('https:');
    expect(imgSrc).not.toContain('*');
  });
});
