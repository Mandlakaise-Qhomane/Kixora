import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Order, OrderStatus } from '../../types';
import { mapOrderRowToOrder, OrderHydratedRow } from './orderMapper';

export interface OrderTrackingResult {
  order: Order;
  trackingNumber: string;
  carrier?: string;
  status: OrderStatus;
  timeline: any[];
  shipment?: any;
}

export const orderRepository = {
  async getOrders(userId?: string): Promise<Order[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            *,
            brands (*),
            categories (*),
            product_images (*)
          )
        ),
        order_status_history (*),
        order_events (*),
        shipments (*)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[orderRepository.getOrders] Error fetching orders:', error);
      throw error;
    }

    return (data || []).map(row => mapOrderRowToOrder(row as unknown as OrderHydratedRow));
  },

  async getCustomerOrders(userId: string): Promise<Order[]> {
    return this.getOrders(userId);
  },

  async getOrderByCode(orderCodeOrId: string, guestAccessToken?: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            *,
            brands (*),
            categories (*),
            product_images (*)
          )
        ),
        order_status_history (*),
        order_events (*),
        shipments (*)
      `);

    if (guestAccessToken) {
      query = query.eq('guest_access_token', guestAccessToken);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderCodeOrId);
    const { data, error } = isUuid
      ? await query.eq('id', orderCodeOrId).maybeSingle()
      : await query.eq('order_code', orderCodeOrId).maybeSingle();

    if (error) {
      console.error('[orderRepository.getOrderByCode] Error fetching order:', error);
      throw error;
    }

    if (!data) return null;
    return mapOrderRowToOrder(data as unknown as OrderHydratedRow);
  },

  async getOrderDetails(orderIdOrCode: string, guestAccessToken?: string): Promise<Order | null> {
    return this.getOrderByCode(orderIdOrCode, guestAccessToken);
  },

  async getOrderTracking(trackingNumberOrCode: string): Promise<OrderTrackingResult | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    // Try finding by shipment tracking number
    const { data: shipmentData } = await supabase
      .from('shipments')
      .select('*, orders (*)')
      .eq('tracking_number', trackingNumberOrCode)
      .maybeSingle();

    if (shipmentData?.order_id) {
      const order = await this.getOrderByCode(shipmentData.order_id);
      if (order) {
        return {
          order,
          trackingNumber: shipmentData.tracking_number || order.trackingNumber,
          carrier: shipmentData.carrier || 'RAM Hand-to-Hand',
          status: order.status,
          timeline: order.timeline,
          shipment: shipmentData,
        };
      }
    }

    const order = await this.getOrderByCode(trackingNumberOrCode);
    if (order) {
      return {
        order,
        trackingNumber: order.trackingNumber,
        carrier: 'RAM Hand-to-Hand',
        status: order.status,
        timeline: order.timeline,
      };
    }

    return null;
  }
};
