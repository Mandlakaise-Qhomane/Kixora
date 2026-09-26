import { describe, expect, it } from 'vitest';
import { filterSneakers } from '../../src/utils/filterSneakers';
import { FilterState, Sneaker } from '../../src/types';

const sneakers: Sneaker[] = [
  {
    id: '1',
    name: 'Travis Scott x Air Jordan 1 Low',
    brand: 'Travis Scott',
    category: 'Low-Top',
    gender: 'Men',
    price: 3200,
    image: '',
    images: [],
    gallery: [],
    sizes: [{ size: 8, stock: 2 }, { size: 9, stock: 0 }],
    colorway: 'Mocha',
    releaseYear: 2024,
    sku: 'TS-001',
    story: 'test',
    description: 'A collaborative Travis Scott sneaker with premium materials.',
    rating: 4.9,
    reviewsCount: 42,
    salesCount: 9,
    tags: ['Travis', 'Collab'],
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Nike Dunk Low Retro Panda',
    brand: 'Nike',
    category: 'Low-Top',
    gender: 'Unisex',
    price: 2900,
    image: '',
    images: [],
    gallery: [],
    sizes: [{ size: 9, stock: 0 }, { size: 10, stock: 3 }],
    colorway: 'Black/White',
    releaseYear: 2023,
    sku: 'NK-001',
    story: 'test',
    description: 'A clean staple sneaker in a classic black and white finish.',
    rating: 4.6,
    reviewsCount: 27,
    salesCount: 15,
    isFeatured: false,
  },
];

const baseFilters: FilterState = {
  brand: 'All',
  category: 'All',
  gender: 'All',
  maxPrice: 6000,
  selectedSize: null,
  inStockOnly: false,
  sortBy: 'featured',
  search: '',
};

describe('filterSneakers', () => {
  it('filters by search, brand and size', () => {
    const results = filterSneakers(sneakers, {
      ...baseFilters,
      search: 'travis',
      brand: 'Travis Scott',
      selectedSize: 8,
    });

    expect(results).toHaveLength(1);
    expect(results[0].name).toContain('Travis Scott');
  });

  it('applies special-case Travis Scott brand matching and sorts by price descending', () => {
    const results = filterSneakers(sneakers, {
      ...baseFilters,
      brand: 'Travis Scott',
      sortBy: 'price-desc',
    });

    expect(results).toHaveLength(1);
    expect(results[0].price).toBe(3200);
  });

  it('returns empty list when no sneaker matches', () => {
    const results = filterSneakers(sneakers, {
      ...baseFilters,
      search: 'nope',
    });

    expect(results).toHaveLength(0);
  });
});
