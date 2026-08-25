import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isSupabaseCheckoutEnabled } from '../config/features';

export interface CustomerInfoInput {
  email: string;
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface CheckoutInput {
  cartId: string;
  userId?: string;
  guestToken?: string;
  promoCode?: string;
  customerInfo: CustomerInfoInput;
  paymentMethod: string;
  shippingMethod: string;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  orderCode?: string;
  total?: number;
  error?: string;
  errorCode?: string;
}

export const checkoutService = {
  async placeOrderAtomic(input: CheckoutInput): Promise<CheckoutResult> {
    if (!input.cartId && !input.userId) {
      return {
        success: false,
        error: 'Cart ID or User ID is required to place an order.',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    if (!input.customerInfo?.email || input.customerInfo.email.trim() === '') {
      return {
        success: false,
        error: 'Customer email is required for checkout.',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    if (!isSupabaseConfigured() || !isSupabaseCheckoutEnabled()) {
      const mockOrderCode = `KXO-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        success: true,
        orderId: `order-${Date.now()}`,
        orderCode: mockOrderCode,
        total: 4999,
      };
    }

    try {
      const { data, error } = await supabase.rpc('create_pending_order_atomic', {
        p_cart_id: input.cartId,
        p_user_id: input.userId || null,
        p_guest_token: input.guestToken || null,
        p_promo_code: input.promoCode || null,
        p_customer_info: input.customerInfo,
        p_payment_method: input.paymentMethod,
        p_shipping_method: input.shippingMethod,
      });

      if (error) {
        console.error('[checkoutService.placeOrderAtomic] RPC error:', error);
        return {
          success: false,
          error: error.message,
          errorCode: error.code,
        };
      }

      return {
        success: true,
        orderId: data.order_id,
        orderCode: data.order_code,
        total: data.total,
      };
    } catch (err: any) {
      console.error('[checkoutService.placeOrderAtomic] Unexpected failure:', err);
      return {
        success: false,
        error: err.message || 'Checkout failed',
        errorCode: 'CHECKOUT_EXCEPTION',
      };
    }
  },

  async placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
    return this.placeOrderAtomic(input);
  }
};
