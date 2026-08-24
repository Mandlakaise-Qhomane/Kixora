import { supabase } from '../api/supabase';
import { handleSupabaseError } from '../api/errors';
import type { Inventory } from '../types/domain';

export const inventoryRepository = {
  async getStockForProductSize(productSizeId: string): Promise<Inventory | null> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('product_size_id', productSizeId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw handleSupabaseError(error);
    }
    
    return data;
  },

  async getAvailableStock(productSizeId: string): Promise<number> {
    const inventory = await this.getStockForProductSize(productSizeId);
    if (!inventory) return 0;
    
    // Available stock = stock - reserved_stock
    const available = inventory.stock - inventory.reserved_stock;
    return available > 0 ? available : 0;
  }
};
