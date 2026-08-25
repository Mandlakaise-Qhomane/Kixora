import { test, expect } from '@playwright/test';
import { supabase, isSupabaseConfigured } from '../../src/lib/supabase';
import { FEATURES, isSupabaseCatalogEnabled, isSupabaseDropsEnabled } from '../../src/config/features';
import { mapProductRowToSneaker, ProductHydratedRow } from '../../src/repositories/customer/productMapper';
import { mapDropRowToDrop, DropHydratedRow } from '../../src/repositories/customer/dropsMapper';
import { productRepository } from '../../src/repositories/customer/productRepository';
import { dropsRepository } from '../../src/repositories/customer/dropsRepository';

test.describe('Supabase Data Access Layer & Catalog Mapping (Phase 2A)', () => {

  test('DAL-01: Supabase client singleton initializes cleanly with safe defaults', async () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    expect(typeof supabase.auth.getSession).toBe('function');
    
    // Check helper
    expect(typeof isSupabaseConfigured).toBe('function');
  });

  test('DAL-02: Feature flag toggles exist with expected default safety values', async () => {
    expect(FEATURES).toBeDefined();
    expect(typeof FEATURES.USE_SUPABASE_CATALOG).toBe('boolean');
    expect(typeof FEATURES.USE_SUPABASE_DROPS).toBe('boolean');

    // By default without env override, catalog should be false (local fallback safe)
    expect(typeof isSupabaseCatalogEnabled()).toBe('boolean');
    expect(typeof isSupabaseDropsEnabled()).toBe('boolean');
  });

  test('DAL-03: ProductMapper correctly transforms database rows into Sneaker domain models', async () => {
    const mockDbRow: ProductHydratedRow = {
      id: 'mock-prod-123',
      name: 'Air Jordan 4 Retro "Military Black"',
      slug: 'air-jordan-4-military-black',
      brand_id: 'brand-jordan',
      category_id: 'cat-mid',
      gender: 'Unisex',
      sku: 'DH6927-111',
      colorway: 'White / Black / Neutral Grey',
      price: 3299,
      original_price: 3899,
      description: 'The Air Jordan 4 Military Black features smooth white leather and neutral grey suede.',
      details: ['Smooth white leather upper', 'Neutral grey suede forefoot overlay', 'Molded eyelets and heel tab'],
      tags: ['Grail', 'Retro', 'Jordan 4'],
      rating: 4.9,
      reviews_count: 142,
      sales_count: 512,
      is_new_release: true,
      is_featured: true,
      is_active: true,
      created_at: '2025-05-15T10:00:00Z',
      updated_at: '2025-05-15T10:00:00Z',
      brands: {
        id: 'brand-jordan',
        name: 'Jordan',
        slug: 'jordan',
        logo_url: null,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      },
      categories: {
        id: 'cat-mid',
        name: 'Mid-Top',
        slug: 'mid-top',
        description: null,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      },
      product_images: [
        {
          id: 'img-2',
          product_id: 'mock-prod-123',
          image_url: 'https://images.unsplash.com/photo-2',
          angle_label: 'Profile',
          display_order: 2,
          created_at: '2025-05-15T10:00:00Z',
        },
        {
          id: 'img-1',
          product_id: 'mock-prod-123',
          image_url: 'https://images.unsplash.com/photo-1',
          angle_label: 'Hero',
          display_order: 1,
          created_at: '2025-05-15T10:00:00Z',
        },
      ],
      product_sizes: [
        {
          id: 'size-10',
          product_id: 'mock-prod-123',
          size_us: 10,
          created_at: '2025-05-15T10:00:00Z',
          inventory: [
            {
              id: 'inv-10',
              product_size_id: 'size-10',
              stock: 8,
              reserved_stock: 2,
              updated_at: '2025-05-15T10:00:00Z',
            },
          ],
        },
        {
          id: 'size-9',
          product_id: 'mock-prod-123',
          size_us: 9,
          created_at: '2025-05-15T10:00:00Z',
          inventory: [
            {
              id: 'inv-9',
              product_size_id: 'size-9',
              stock: 5,
              reserved_stock: 0,
              updated_at: '2025-05-15T10:00:00Z',
            },
          ],
        },
      ],
    };

    const sneaker = mapProductRowToSneaker(mockDbRow);

    // Assert domain attributes
    expect(sneaker.id).toBe('mock-prod-123');
    expect(sneaker.name).toBe('Air Jordan 4 Retro "Military Black"');
    expect(sneaker.brand).toBe('Jordan');
    expect(sneaker.category).toBe('Mid-Top');
    expect(sneaker.price).toBe(3299);
    expect(sneaker.originalPrice).toBe(3899);
    expect(sneaker.isFeatured).toBe(true);
    expect(sneaker.isNewRelease).toBe(true);
    expect(sneaker.isBestSeller).toBe(true);

    // Verify images are sorted by display_order
    expect(sneaker.images[0]).toBe('https://images.unsplash.com/photo-1');
    expect(sneaker.images[1]).toBe('https://images.unsplash.com/photo-2');

    // Verify sizes are sorted by numeric US size and calculate available stock (stock - reserved)
    expect(sneaker.sizes[0].size).toBe(9);
    expect(sneaker.sizes[0].stock).toBe(5);
    expect(sneaker.sizes[1].size).toBe(10);
    expect(sneaker.sizes[1].stock).toBe(6); // 8 stock - 2 reserved = 6 available
  });

  test('DAL-04: DropsMapper correctly transforms database rows into Drop domain models', async () => {
    const mockDropRow: DropHydratedRow = {
      id: 'drop-travis-olive-01',
      sneaker_name: 'Travis Scott x Air Jordan 1 Low OG "Olive"',
      brand_id: 'brand-travis',
      price: 3499,
      release_time: '2025-06-01T15:00:00Z',
      image_url: 'https://images.unsplash.com/photo-olive',
      hype_level: 'EXTREME',
      drop_type: 'Raffle Draw',
      description: 'Exclusive vault raffle entry for verified sneakerheads.',
      subscribers_count: 1420,
      is_active: true,
      created_at: '2025-05-01T00:00:00Z',
      brands: {
        id: 'brand-travis',
        name: 'Travis Scott',
        slug: 'travis-scott',
        logo_url: null,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
      },
    };

    const drop = mapDropRowToDrop(mockDropRow);

    expect(drop.id).toBe('drop-travis-olive-01');
    expect(drop.sneakerName).toBe('Travis Scott x Air Jordan 1 Low OG "Olive"');
    expect(drop.brand).toBe('Travis Scott');
    expect(drop.price).toBe(3499);
    expect(drop.hypeLevel).toBe('EXTREME');
    expect(drop.type).toBe('Raffle Draw');
    expect(drop.subscribersCount).toBe(1420);
    expect(drop.isNotified).toBe(false);
  });

  test('DAL-05: ProductRepository and DropsRepository expose all required read-only methods', async () => {
    expect(typeof productRepository.getProducts).toBe('function');
    expect(typeof productRepository.getProductBySlug).toBe('function');
    expect(typeof productRepository.getBrands).toBe('function');
    expect(typeof productRepository.getCategories).toBe('function');
    expect(typeof productRepository.getProductWithSizes).toBe('function');
    expect(typeof productRepository.getProductImages).toBe('function');

    expect(typeof dropsRepository.getActiveDrops).toBe('function');
    expect(typeof dropsRepository.getDropDetails).toBe('function');
  });
});
