/**
 * Transactional Email Notification Types
 */

export interface OrderItemSummary {
  name: string;
  sku?: string;
  sizeUs: number;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface OrderConfirmationEmailPayload {
  orderCode: string;
  customerEmail: string;
  customerName?: string;
  items: OrderItemSummary[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  shippingAddress: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export interface ShippingUpdateEmailPayload {
  orderCode: string;
  customerEmail: string;
  customerName?: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  trackingUrl: string;
  estimatedDelivery?: string;
  currentLocation?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'postmark' | 'smtp' | 'console_fallback';
  error?: string;
}
