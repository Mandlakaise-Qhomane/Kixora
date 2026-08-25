import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { auditService } from '../../services/auditService';

export interface SizeInventoryDetail {
  productSizeId: string;
  productId: string;
  sizeUs: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  updatedAt: string;
}

export const inventoryAdminRepository = {
  /**
   * Retrieves all size-level inventory rows for a specific product.
   */
  async getProductInventory(productId: string): Promise<SizeInventoryDetail[]> {
    if (!isSupabaseConfigured() || !productId) {
      return [];
    }

    const { data, error } = await supabase
      .from('product_sizes')
      .select(`
        id,
        product_id,
        size_us,
        inventory (
          stock,
          reserved_stock,
          updated_at
        )
      `)
      .eq('product_id', productId)
      .order('size_us', { ascending: true });

    if (error) {
      console.error('[inventoryAdminRepository.getProductInventory] Error:', error);
      throw error;
    }

    return (data || []).map((row: any) => {
      const inv = row.inventory?.[0] || { stock: 0, reserved_stock: 0, updated_at: new Date().toISOString() };
      const stock = Number(inv.stock) || 0;
      const reserved = Number(inv.reserved_stock) || 0;
      return {
        productSizeId: row.id,
        productId: row.product_id,
        sizeUs: Number(row.size_us),
        stock,
        reservedStock: reserved,
        availableStock: Math.max(0, stock - reserved),
        updatedAt: inv.updated_at,
      };
    });
  },

  /**
   * Retrieves inventory detail for a single product size ID.
   */
  async getSizeInventory(productSizeId: string): Promise<SizeInventoryDetail | null> {
    if (!isSupabaseConfigured() || !productSizeId) {
      return null;
    }

    const { data, error } = await supabase
      .from('product_sizes')
      .select(`
        id,
        product_id,
        size_us,
        inventory (
          stock,
          reserved_stock,
          updated_at
        )
      `)
      .eq('id', productSizeId)
      .maybeSingle();

    if (error) {
      console.error('[inventoryAdminRepository.getSizeInventory] Error:', error);
      throw error;
    }

    if (!data) return null;

    const row: any = data;
    const inv = row.inventory?.[0] || { stock: 0, reserved_stock: 0, updated_at: new Date().toISOString() };
    const stock = Number(inv.stock) || 0;
    const reserved = Number(inv.reserved_stock) || 0;

    return {
      productSizeId: row.id,
      productId: row.product_id,
      sizeUs: Number(row.size_us),
      stock,
      reservedStock: reserved,
      availableStock: Math.max(0, stock - reserved),
      updatedAt: inv.updated_at,
    };
  },

  /**
   * Adjusts stock quantity for a size using database RPC function `admin_adjust_inventory`.
   */
  async adjustInventory(
    productSizeId: string,
    quantityAdjust: number,
    reason: string = 'Manual Admin Stock Adjustment',
    adminId?: string
  ): Promise<void> {
    if (!isSupabaseConfigured() || !productSizeId) {
      return;
    }

    // Call stored procedure RPC
    const { error } = await supabase.rpc('admin_adjust_inventory', {
      p_product_size_id: productSizeId,
      p_quantity: quantityAdjust,
      p_reason: reason,
    });

    if (error) {
      console.error('[inventoryAdminRepository.adjustInventory] RPC Error:', error);
      throw error;
    }

    // Audit log
    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'INVENTORY_ADJUST',
      entityType: 'inventory',
      entityId: productSizeId,
      changes: { adjustment: quantityAdjust, reason },
    });
  },

  /**
   * Directly sets stock level for a product size.
   */
  async updateStockLevel(
    productSizeId: string,
    newStockLevel: number,
    adminId?: string
  ): Promise<void> {
    if (!isSupabaseConfigured() || !productSizeId) {
      return;
    }

    const { error } = await supabase
      .from('inventory')
      .update({ stock: Math.max(0, newStockLevel) })
      .eq('product_size_id', productSizeId);

    if (error) {
      console.error('[inventoryAdminRepository.updateStockLevel] Error:', error);
      throw error;
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'INVENTORY_ADJUST',
      entityType: 'inventory',
      entityId: productSizeId,
      changes: { newStockLevel },
    });
  },
};
