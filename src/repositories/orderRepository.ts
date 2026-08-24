import { supabase } from '../api/supabase';
import { handleSupabaseError } from '../api/errors';
import type { OrderWithDetails, Order } from '../types/domain';

export const orderRepository = {
  async getCustomerOrders(): Promise<Order[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw handleSupabaseError(userError || { code: 'PGRST116' });

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) throw handleSupabaseError(error);
    return data || [];
  },

  async getOrderById(orderId: string, guestAccessToken?: string): Promise<OrderWithDetails | null> {
    let query = supabase
      .from('orders')
      .select('*, items:order_items(*), status_history:order_status_history(*)')
      .eq('id', orderId);

    if (guestAccessToken) {
      query = query.eq('guest_access_token', guestAccessToken);
    }

    const res = await query.single();

    if (res.error) {
      if (res.error.code === 'PGRST116') return null; // Not found or no access
      throw handleSupabaseError(res.error);
    }
    
    const data = res.data as any;
    if (data && data.status_history) {
      data.status_history.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return data as OrderWithDetails;
  },

  async getShipmentDetails(orderId: string) {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw handleSupabaseError(error);
    }
    
    return data;
  }
};
