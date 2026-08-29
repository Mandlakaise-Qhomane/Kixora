import { useOrdersRepository, UseOrdersRepositoryResult } from './useOrdersRepository';
import { useStore } from '../context/StoreContext';

/**
 * High-level useOrders hook.
 * If passed a userId, delegates to useOrdersRepository for database access.
 * Otherwise, accesses the global StoreContext orders list.
 */
export function useOrders(userId?: string): UseOrdersRepositoryResult {
  const store = useStore();
  const repo = useOrdersRepository(userId);

  if (!userId) {
    return {
      orders: store.orders,
      loading: false,
      error: null,
      getOrderDetails: async (orderId: string) => store.orders.find(o => o.id === orderId || o.orderCode === orderId) || null,
      getOrderTracking: async (orderIdOrCode: string) => {
        const match = store.orders.find(o => o.id === orderIdOrCode || o.orderCode === orderIdOrCode || o.trackingNumber === orderIdOrCode);
        if (!match) return null;
        return {
          order: match,
          trackingNumber: match.trackingNumber,
          carrier: 'RAM Hand-to-Hand',
          status: match.status,
          timeline: match.timeline,
        };
      },
      refetch: async () => {},
    };
  }

  return repo;
}
