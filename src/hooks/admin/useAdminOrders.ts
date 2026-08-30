import { useState, useCallback, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { isSupabaseAdminOrdersEnabled } from '../../config/features';
import {
  orderAdminRepository,
  AdminOrderFilters,
} from '../../repositories/admin/orderAdminRepository';

export function useAdminOrders(fallbackOrders: Order[] = [], initialFilters?: AdminOrderFilters) {
  const [orders, setOrders] = useState<Order[]>(fallbackOrders);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (filters?: AdminOrderFilters) => {
    if (!isSupabaseAdminOrdersEnabled()) {
      setOrders(fallbackOrders);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await orderAdminRepository.getAllOrders(filters || initialFilters);
      setOrders(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch admin orders');
      setOrders(fallbackOrders);
    } finally {
      setIsLoading(false);
    }
  }, [fallbackOrders, initialFilters]);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchOrders();
      }
    };
    init();
    return () => { ignore = true; };
  }, [fetchOrders]);

  const transitionOrderStatus = useCallback(async (
    orderId: string,
    newStatus: OrderStatus,
    title?: string,
    description?: string
  ) => {
    if (!isSupabaseAdminOrdersEnabled()) {
      // Local fallback state transition
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                timeline: [
                  ...o.timeline,
                  {
                    title: title || `Status updated to ${newStatus}`,
                    timestamp: new Date().toISOString(),
                    description: description || `Status transitioned to ${newStatus}`,
                    completed: true,
                  },
                ],
              }
            : o
        )
      );
      return;
    }

    setIsLoading(true);
    try {
      await orderAdminRepository.transitionOrderStatus(orderId, newStatus, title, description);
      const updatedOrder = await orderAdminRepository.getOrderById(orderId);
      if (updatedOrder) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update order status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTracking = useCallback(async (
    orderId: string,
    trackingNumber: string,
    carrier?: string
  ) => {
    if (!isSupabaseAdminOrdersEnabled()) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, trackingNumber } : o))
      );
      return;
    }

    setIsLoading(true);
    try {
      await orderAdminRepository.updateShipmentTracking(orderId, trackingNumber, carrier);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, trackingNumber } : o))
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to update tracking');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    orders,
    isLoading,
    error,
    refresh: fetchOrders,
    transitionOrderStatus,
    updateTracking,
  };
}
