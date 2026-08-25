import { Order, OrderStatus } from '../../types';
import { mapOrderRowToOrder, mapOrderRowsToOrders, OrderHydratedRow } from '../customer/orderMapper';

export type { OrderHydratedRow };

/**
 * Maps database order rows with admin enhancements.
 */
export function mapAdminOrderRowToOrder(row: OrderHydratedRow): Order {
  return mapOrderRowToOrder(row);
}

/**
 * Maps an array of database order rows to Order domain models.
 */
export function mapAdminOrderRowsToOrders(rows: OrderHydratedRow[]): Order[] {
  return mapOrderRowsToOrders(rows);
}

/**
 * Status descriptions helper for administrative status transitions.
 */
export function getStatusTransitionDefaults(status: OrderStatus): { title: string; description: string } {
  switch (status) {
    case 'Authenticated':
      return {
        title: 'Verified Authentic',
        description: 'Passed 12-point authentication checkpoint by senior vault specialist.',
      };
    case 'Processing':
      return {
        title: 'Processing in Vault',
        description: 'Placed into security vault tamper-evident packaging and assigned NFC tag.',
      };
    case 'Shipped':
      return {
        title: 'Dispatched with Courier',
        description: 'Handed over to secure armored courier for high-priority transit.',
      };
    case 'Delivered':
      return {
        title: 'Delivered to Customer',
        description: 'Package delivered and signature confirmed.',
      };
    case 'Cancelled':
      return {
        title: 'Order Cancelled',
        description: 'Order was cancelled and funds returned from escrow.',
      };
    case 'Pending':
    default:
      return {
        title: 'Order Placed',
        description: 'Payment verified and secured in escrow.',
      };
  }
}
