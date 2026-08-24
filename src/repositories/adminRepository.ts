import { supabase } from '../api/supabase';
import { handleSupabaseError, AppError } from '../api/errors';
import type { Product, PromoCode, Drop, Order } from '../types/domain';

export const adminRepository = {
  async createProduct(productData: any): Promise<Product> {
    const { data, error } = await supabase.from('products').insert(productData).select().single();
    if (error) throw handleSupabaseError(error);
    return data as any;
  },
  async updateProduct(id: string, updates: any): Promise<Product> {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw handleSupabaseError(error);
    return data as any;
  },
  async deactivateProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').update({ is_active: false } as any).eq('id', id);
    if (error) throw handleSupabaseError(error);
  },

  async adjustInventory(productSizeId: string, quantityAdjust: number, reason: string): Promise<void> {
    const { error } = await supabase.rpc('admin_adjust_inventory', {
      p_product_size_id: productSizeId,
      p_quantity: quantityAdjust,
      p_reason: reason
    });
    if (error) {
      if (error.message?.includes('Insufficient stock')) {
        throw new AppError('VALIDATION', 'Cannot reduce stock below zero.', error);
      }
      throw handleSupabaseError(error);
    }
  },

  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw handleSupabaseError(error);
    return data as any;
  },
  
  async transitionOrderStatus(orderId: string, newStatus: string, title: string, description: string): Promise<void> {
    const { error } = await supabase.rpc('admin_transition_order_status', {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_title: title,
      p_description: description
    });
    if (error) {
      if (error.message?.includes('Invalid status transition')) {
        throw new AppError('VALIDATION', 'Invalid order status transition.', error);
      }
      throw handleSupabaseError(error);
    }
  },

  async createPromo(promoData: any): Promise<PromoCode> {
    const { data, error } = await supabase.from('promo_codes').insert(promoData).select().single();
    if (error) throw handleSupabaseError(error);
    return data as any;
  },
  async updatePromo(id: string, updates: any): Promise<PromoCode> {
    const { data, error } = await supabase.from('promo_codes').update(updates).eq('id', id).select().single();
    if (error) throw handleSupabaseError(error);
    return data as any;
  },
  async togglePromoActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('promo_codes').update({ is_active: isActive } as any).eq('id', id);
    if (error) throw handleSupabaseError(error);
  },

  async createDrop(dropData: any): Promise<Drop> {
    const { data, error } = await supabase.from('drops').insert(dropData).select().single();
    if (error) throw handleSupabaseError(error);
    return data as any;
  },
  async updateDrop(id: string, updates: any): Promise<Drop> {
    const { data, error } = await supabase.from('drops').update(updates).eq('id', id).select().single();
    if (error) throw handleSupabaseError(error);
    return data as any;
  },
  async toggleDropActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('drops').update({ is_active: isActive } as any).eq('id', id);
    if (error) throw handleSupabaseError(error);
  },

  async getDashboardMetrics(): Promise<{ totalRevenue: number; totalOrders: number; activeUsers: number }> {
    const { count: totalOrders, error: err1 } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .neq('current_status', 'Cancelled');
      
    const { count: activeUsers, error: err2 } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (err1) throw handleSupabaseError(err1);
    if (err2) throw handleSupabaseError(err2);

    return {
      totalRevenue: 0, 
      totalOrders: totalOrders || 0,
      activeUsers: activeUsers || 0
    };
  }
};
