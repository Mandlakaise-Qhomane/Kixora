import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Order, OrderStatus } from '../../types';
import { OrderHydratedRow } from '../customer/orderMapper';
import {
  mapAdminOrderRowToOrder,
  mapAdminOrderRowsToOrders,
  getStatusTransitionDefaults,
} from './orderAdminMapper';
import { auditService } from '../../services/auditService';

export interface AdminOrderFilters {
  status?: OrderStatus | 'All';
  search?: string;
  limit?: number;
}

export const orderAdminRepository = {
  /**
   * Retrieves all customer orders for the admin dashboard with search and status filtering.
   */
  async getAllOrders(filters?: AdminOrderFilters): Promise<Order[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_status_history (*),
        shipments (*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'All') {
      query = query.eq('current_status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[orderAdminRepository.getAllOrders] Error:', error);
      throw error;
    }

    let orders = mapAdminOrderRowsToOrders((data || []) as unknown as OrderHydratedRow[]);

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(term) ||
          o.trackingNumber.toLowerCase().includes(term) ||
          o.customer.fullName.toLowerCase().includes(term) ||
          o.customer.email.toLowerCase().includes(term)
      );
    }

    return orders;
  },

  /**
   * Retrieves a single order with detailed items, shipment, and full timeline history.
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    if (!isSupabaseConfigured() || !orderId) {
      return null;
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_status_history (*),
        shipments (*)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      console.error('[orderAdminRepository.getOrderById] Error:', error);
      throw error;
    }

    if (!data) return null;
    return mapAdminOrderRowToOrder(data as unknown as OrderHydratedRow);
  },

  /**
   * Transitions an order status via the atomic database RPC `admin_transition_order_status`
   * and records an audit log entry.
   */
  async transitionOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    customTitle?: string,
    customDescription?: string,
    adminId?: string
  ): Promise<void> {
    if (!isSupabaseConfigured() || !orderId) {
      return;
    }

    const defaults = getStatusTransitionDefaults(newStatus);
    const title = customTitle || defaults.title;
    const description = customDescription || defaults.description;

    const { error } = await supabase.rpc('admin_transition_order_status', {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_title: title,
      p_description: description,
    });

    if (error) {
      console.error('[orderAdminRepository.transitionOrderStatus] RPC Error:', error);
      throw error;
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'STATUS_CHANGE',
      entityType: 'order',
      entityId: orderId,
      changes: { newStatus, title, description },
    });
  },

  /**
   * Creates or updates a shipment record with a tracking number and courier carrier.
   */
  async updateShipmentTracking(
    orderId: string,
    trackingNumber: string,
    carrier: string = 'Armored Express Logistics',
    adminId?: string
  ): Promise<void> {
    if (!isSupabaseConfigured() || !orderId || !trackingNumber) {
      return;
    }

    const { data: existingShipment } = await supabase
      .from('shipments')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingShipment?.id) {
      await supabase
        .from('shipments')
        .update({
          tracking_number: trackingNumber,
          carrier,
          dispatched_at: new Date().toISOString(),
        })
        .eq('id', existingShipment.id);
    } else {
      await supabase.from('shipments').insert({
        order_id: orderId,
        tracking_number: trackingNumber,
        carrier,
        dispatched_at: new Date().toISOString(),
      });
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'UPDATE',
      entityType: 'shipment',
      entityId: orderId,
      changes: { trackingNumber, carrier },
    });
  },
};
