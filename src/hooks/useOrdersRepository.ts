import { useState, useEffect, useCallback } from 'react';
import { Order } from '../types';
import { orderRepository, OrderTrackingResult } from '../repositories/customer/orderRepository';
import { isSupabaseOrdersEnabled } from '../config/features';
import { isSupabaseConfigured } from '../lib/supabase';

export interface UseOrdersRepositoryResult {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  getOrderDetails: (orderId: string, guestAccessToken?: string) => Promise<Order | null>;
  getOrderTracking: (orderIdOrCode: string) => Promise<OrderTrackingResult | null>;
  refetch: () => Promise<void>;
}

/**
 * Hook providing access to customer orders in Supabase with local fallback.
 */
export function useOrdersRepository(userId?: string): UseOrdersRepositoryResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseOrdersEnabled() || !isSupabaseConfigured() || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await orderRepository.getCustomerOrders(userId);
      setOrders(data);
    } catch (err: any) {
      console.warn('[useOrdersRepository] Fetch error:', err?.message || err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getOrderDetails = async (orderId: string, guestAccessToken?: string): Promise<Order | null> => {
    if (!isSupabaseOrdersEnabled() || !isSupabaseConfigured()) {
      return orders.find((o) => o.id === orderId) || null;
    }
    return orderRepository.getOrderDetails(orderId, guestAccessToken);
  };

  const getOrderTracking = async (orderIdOrCode: string): Promise<OrderTrackingResult | null> => {
    if (!isSupabaseOrdersEnabled() || !isSupabaseConfigured()) {
      const match = orders.find((o) => o.id === orderIdOrCode || o.trackingNumber === orderIdOrCode);
      if (!match) return null;
      return {
        order: match,
        trackingNumber: match.trackingNumber,
        carrier: 'Vault Courier Express',
        status: match.status,
        timeline: match.timeline,
      };
    }
    return orderRepository.getOrderTracking(orderIdOrCode);
  };

  return {
    orders,
    loading,
    error,
    getOrderDetails,
    getOrderTracking,
    refetch: fetchOrders,
  };
}
