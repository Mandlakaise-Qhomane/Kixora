import { test, expect } from '@playwright/test';
import {
  FEATURES,
  isSupabaseAdminEnabled,
  isSupabaseAdminCatalogEnabled,
  isSupabaseAdminOrdersEnabled,
  isSupabaseAdminInventoryEnabled,
  isSupabaseAdminPromosEnabled,
  isSupabaseAdminDropsEnabled,
  isSupabaseAdminAuditEnabled,
} from '../../src/config/features';
import {
  mapAdminProductRowToSneaker,
  mapProductFormToDbInsert,
} from '../../src/repositories/admin/productAdminMapper';
import {
  mapAdminOrderRowToOrder,
  getStatusTransitionDefaults,
} from '../../src/repositories/admin/orderAdminMapper';
import {
  mapPromoRowToPromoCode,
  mapPromoFormToDbInsert,
} from '../../src/repositories/admin/promoAdminMapper';
import {
  mapAuditLogRowToModel,
} from '../../src/repositories/admin/auditAdminMapper';
import { productAdminRepository } from '../../src/repositories/admin/productAdminRepository';
import { inventoryAdminRepository } from '../../src/repositories/admin/inventoryAdminRepository';
import { orderAdminRepository } from '../../src/repositories/admin/orderAdminRepository';
import { promoAdminRepository } from '../../src/repositories/admin/promoAdminRepository';
import { dropsAdminRepository } from '../../src/repositories/admin/dropsAdminRepository';
import { analyticsAdminRepository } from '../../src/repositories/admin/analyticsAdminRepository';
import { auditAdminRepository } from '../../src/repositories/admin/auditAdminRepository';
import { auditService } from '../../src/services/auditService';

test.describe('Phase 2C: Admin Data Access Layer', () => {

  test('DAL2C-01: Admin feature flags exist with safe fallback defaults', async () => {
    expect(FEATURES).toHaveProperty('USE_SUPABASE_ADMIN');
    expect(FEATURES).toHaveProperty('USE_SUPABASE_ADMIN_CATALOG');
    expect(FEATURES).toHaveProperty('USE_SUPABASE_ADMIN_ORDERS');
    expect(FEATURES).toHaveProperty('USE_SUPABASE_ADMIN_INVENTORY');
    expect(FEATURES).toHaveProperty('USE_SUPABASE_ADMIN_PROMOS');
    expect(FEATURES).toHaveProperty('USE_SUPABASE_ADMIN_DROPS');
    expect(FEATURES).toHaveProperty('USE_SUPABASE_ADMIN_AUDIT');

    expect(typeof isSupabaseAdminEnabled()).toBe('boolean');
    expect(typeof isSupabaseAdminCatalogEnabled()).toBe('boolean');
    expect(typeof isSupabaseAdminOrdersEnabled()).toBe('boolean');
    expect(typeof isSupabaseAdminInventoryEnabled()).toBe('boolean');
    expect(typeof isSupabaseAdminPromosEnabled()).toBe('boolean');
    expect(typeof isSupabaseAdminDropsEnabled()).toBe('boolean');
    expect(typeof isSupabaseAdminAuditEnabled()).toBe('boolean');
  });

  test('DAL2C-02: ProductAdminMapper converts forms and hydrated rows correctly', async () => {
    const insertPayload = mapProductFormToDbInsert(
      {
        name: 'Travis Scott x Air Jordan 1 Low "Reverse Mocha"',
        brand: 'Travis Scott',
        category: 'Limited Edition',
        gender: 'Men',
        price: 4899,
        originalPrice: 5299,
        sku: 'DM7866-162',
        colorway: 'Sail/University Red/Ridgerock',
        description: 'Iconic reverse swoosh collaboration.',
        isFeatured: true,
      },
      'brand-travis-id',
      'cat-limited-id'
    );

    expect(insertPayload.name).toBe('Travis Scott x Air Jordan 1 Low "Reverse Mocha"');
    expect(insertPayload.brand_id).toBe('brand-travis-id');
    expect(insertPayload.category_id).toBe('cat-limited-id');
    expect(insertPayload.price).toBe(4899);
    expect(insertPayload.sku).toBe('DM7866-162');
    expect(insertPayload.is_featured).toBe(true);

    const mockHydratedRow: any = {
      id: 'prod-test-01',
      name: 'Air Max 1 86 OG Big Bubble',
      slug: 'air-max-1-big-bubble',
      brand_id: 'brand-nike-01',
      category_id: 'cat-lifestyle',
      gender: 'Unisex',
      sku: 'DQ3989-100',
      colorway: 'White/University Red',
      price: 2699,
      original_price: 2999,
      description: 'The return of the true 1986 big bubble.',
      details: ['Visible Max Air unit', 'Mesh upper'],
      tags: ['Air Max', 'Iconic'],
      rating: 4.8,
      reviews_count: 32,
      sales_count: 140,
      is_new_release: true,
      is_featured: false,
      is_active: true,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      brands: { id: 'brand-nike-01', name: 'Nike', slug: 'nike' },
      categories: { id: 'cat-lifestyle', name: 'Lifestyle', slug: 'lifestyle' },
      product_images: [{ id: 'img-1', image_url: 'https://img.com/shoe.png', display_order: 1 }],
      product_sizes: [
        {
          id: 'size-1',
          size_us: 10,
          inventory: [{ stock: 12, reserved_stock: 2 }],
        },
      ],
    };

    const sneaker = mapAdminProductRowToSneaker(mockHydratedRow);
    expect(sneaker.id).toBe('prod-test-01');
    expect(sneaker.name).toBe('Air Max 1 86 OG Big Bubble');
    expect(sneaker.brand).toBe('Nike');
    expect(sneaker.price).toBe(2699);
    expect(sneaker.sizes[0].size).toBe(10);
    expect(sneaker.sizes[0].stock).toBe(10); // 12 - 2 available
  });

  test('DAL2C-03: PromoAdminMapper & OrderAdminMapper transform models accurately', async () => {
    // Promo mapping test
    const promoRow: any = {
      id: 'promo-kix10',
      code: 'KIX10',
      discount_percent: 10,
      min_spend: 1500,
      max_uses: 100,
      current_uses: 12,
      is_active: true,
      starts_at: '2026-01-01T00:00:00Z',
      expires_at: null,
      created_at: '2026-01-01T00:00:00Z',
    };

    const promo = mapPromoRowToPromoCode(promoRow);
    expect(promo.id).toBe('promo-kix10');
    expect(promo.code).toBe('KIX10');
    expect(promo.discountPercent).toBe(10);
    expect(promo.minSpend).toBe(1500);
    expect(promo.isActive).toBe(true);

    const promoInsert = mapPromoFormToDbInsert({
      code: 'summer20',
      discountPercent: 20,
      minSpend: 2000,
      isActive: true,
    });
    expect(promoInsert.code).toBe('SUMMER20');
    expect(promoInsert.discount_percent).toBe(20);
    expect(promoInsert.min_spend).toBe(2000);

    // Order defaults test
    const authDefaults = getStatusTransitionDefaults('Authenticated');
    expect(authDefaults.title).toContain('Authentic');
    const shipDefaults = getStatusTransitionDefaults('Shipped');
    expect(shipDefaults.title).toContain('Courier');
  });

  test('DAL2C-04: AuditAdminMapper transforms database rows to domain models', async () => {
    const auditRow: any = {
      id: 'audit-log-001',
      admin_id: 'admin-usr-123',
      action_type: 'UPDATE',
      entity_type: 'product',
      entity_id: 'prod-456',
      changes: { price: 3499, previousPrice: 3899 },
      ip_address: '127.0.0.1',
      created_at: '2026-08-24T12:00:00Z',
    };

    const log = mapAuditLogRowToModel(auditRow);
    expect(log.id).toBe('audit-log-001');
    expect(log.adminId).toBe('admin-usr-123');
    expect(log.actionType).toBe('UPDATE');
    expect(log.entityType).toBe('product');
    expect(log.changes.price).toBe(3499);
    expect(log.changes.previousPrice).toBe(3899);
  });

  test('DAL2C-05: Repositories expose all required administrative interfaces', async () => {
    // productAdminRepository
    expect(typeof productAdminRepository.getAllProducts).toBe('function');
    expect(typeof productAdminRepository.getProductById).toBe('function');
    expect(typeof productAdminRepository.createProduct).toBe('function');
    expect(typeof productAdminRepository.updateProduct).toBe('function');
    expect(typeof productAdminRepository.deleteProduct).toBe('function');
    expect(typeof productAdminRepository.addProductImages).toBe('function');
    expect(typeof productAdminRepository.removeProductImage).toBe('function');

    // inventoryAdminRepository
    expect(typeof inventoryAdminRepository.getProductInventory).toBe('function');
    expect(typeof inventoryAdminRepository.getSizeInventory).toBe('function');
    expect(typeof inventoryAdminRepository.adjustInventory).toBe('function');
    expect(typeof inventoryAdminRepository.updateStockLevel).toBe('function');

    // orderAdminRepository
    expect(typeof orderAdminRepository.getAllOrders).toBe('function');
    expect(typeof orderAdminRepository.getOrderById).toBe('function');
    expect(typeof orderAdminRepository.transitionOrderStatus).toBe('function');
    expect(typeof orderAdminRepository.updateShipmentTracking).toBe('function');

    // promoAdminRepository
    expect(typeof promoAdminRepository.getAllPromos).toBe('function');
    expect(typeof promoAdminRepository.getPromoById).toBe('function');
    expect(typeof promoAdminRepository.createPromo).toBe('function');
    expect(typeof promoAdminRepository.updatePromo).toBe('function');
    expect(typeof promoAdminRepository.togglePromoActive).toBe('function');
    expect(typeof promoAdminRepository.deletePromo).toBe('function');

    // dropsAdminRepository
    expect(typeof dropsAdminRepository.getAllDrops).toBe('function');
    expect(typeof dropsAdminRepository.getDropById).toBe('function');
    expect(typeof dropsAdminRepository.createDrop).toBe('function');
    expect(typeof dropsAdminRepository.updateDrop).toBe('function');
    expect(typeof dropsAdminRepository.toggleDropActive).toBe('function');
    expect(typeof dropsAdminRepository.getRaffleEntries).toBe('function');

    // analyticsAdminRepository
    expect(typeof analyticsAdminRepository.getDashboardMetrics).toBe('function');
    expect(typeof analyticsAdminRepository.getLowStockAlerts).toBe('function');

    // auditAdminRepository
    expect(typeof auditAdminRepository.getAuditLogs).toBe('function');
  });

  test('DAL2C-06: Centralized auditService logs mutations safely', async () => {
    expect(typeof auditService.log).toBe('function');

    // Test calling auditService with sample input
    await expect(
      auditService.log({
        adminId: 'test-admin',
        actionType: 'INVENTORY_ADJUST',
        entityType: 'inventory',
        entityId: 'size-test-01',
        changes: { adjustment: 5 },
      })
    ).resolves.not.toThrow();
  });
});
