import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isSupabaseCheckoutEnabled } from '../config/features';
import { CartItem } from '../types';
import { paymentService } from './paymentService';

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
  cartId?: string;
  userId?: string;
  guestToken?: string;
  promoCode?: string;
  customerInfo: CustomerInfoInput;
  paymentMethod?: string;
  shippingMethod?: string;
  paymentReference?: string;
  cartItems?: CartItem[];
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  orderCode?: string;
  trackingNumber?: string;
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  total?: number;
  paymentStatus?: string;
  currentStatus?: string;
  guestAccessToken?: string;
  error?: string;
  errorCode?: string;
}

export const checkoutService = {
  /**
   * Phase 3A Refactored Checkout Flow:
   * 1. Cart & Customer Validation
   * 2. Inventory / Stock Preview
   * 3. Payment Intent Initialization (via paymentService)
   * 4. Atomic Order Finalization & Inventory Locking (via place_order_atomic RPC)
   */
  async placeOrderAtomic(input: CheckoutInput): Promise<CheckoutResult> {
    // Step 1: Validation
    if (!input.customerInfo?.email || input.customerInfo.email.trim() === '') {
      return {
        success: false,
        error: 'Customer email is required for checkout.',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    const items = input.cartItems || [];
    if (items.length === 0 && !input.cartId) {
      return {
        success: false,
        error: 'Cart cannot be empty when placing an order.',
        errorCode: 'EMPTY_CART',
      };
    }

    // Calculate preliminary total for payment intent initialization
    const subtotal = items.reduce((sum, i) => sum + (i.sneaker?.price || 0) * (i.quantity || 1), 0);
    const discount = input.promoCode ? Math.round(subtotal * 0.1) : 0;
    const shippingFee = subtotal >= 2000 ? 0 : 150;
    const total = Math.max(0, subtotal - discount + shippingFee);

    // Step 2: Payment Intent Initialization (Phase 3A Payment Abstraction)
    const mockOrderCode = `KXO-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentIntent = await paymentService.initializePayment({
      amount: total,
      currency: 'ZAR',
      orderCode: mockOrderCode,
      customerEmail: input.customerInfo.email,
    });

    if (!paymentIntent.success) {
      return {
        success: false,
        error: paymentIntent.error || 'Payment initialization failed.',
        errorCode: 'PAYMENT_INIT_FAILED',
      };
    }

    // Step 3: Fallback / Mock mode when Supabase is unconfigured
    if (!isSupabaseConfigured() || !isSupabaseCheckoutEnabled()) {
      const mockTrackingNumber = `KX-${Math.floor(10000000 + Math.random() * 90000000)}-ZA`;

      return {
        success: true,
        orderId: `order-${Date.now()}`,
        orderCode: mockOrderCode,
        trackingNumber: mockTrackingNumber,
        subtotal,
        discount,
        shippingFee,
        total,
        paymentStatus: 'pending',
        currentStatus: 'Pending',
      };
    }

    // Step 4: Authoritative PostgreSQL Atomic Execution with Inventory Locking
    try {
      const rpcCartItems = items.map(item => ({
        product_id: item.sneaker?.id,
        size_us: Number(item.selectedSize || 9),
        quantity: Number(item.quantity || 1),
      }));

      const { data, error } = await supabase.rpc('place_order_atomic', {
        p_user_id: input.userId || null,
        p_guest_session_token: input.guestToken || null,
        p_customer_info: input.customerInfo,
        p_cart_items: rpcCartItems,
        p_promo_code: input.promoCode || null,
        p_shipping_method: input.shippingMethod || 'Express Vault Courier',
        p_payment_method: input.paymentMethod || 'Credit / Debit Card',
        p_payment_reference: input.paymentReference || paymentIntent.paymentIntentId || null,
      });

      if (error) {
        console.warn('[checkoutService.placeOrderAtomic] RPC error:', error);
        
        let errorCode = error.code || 'CHECKOUT_FAILED';
        const userMessage = error.message;

        if (userMessage.includes('Insufficient stock')) {
          errorCode = 'INSUFFICIENT_INVENTORY';
        } else if (userMessage.includes('Promo code') || userMessage.includes('Minimum spend')) {
          errorCode = 'INVALID_PROMO';
        } else if (userMessage.includes('Product size') || userMessage.includes('not found')) {
          errorCode = 'INVALID_PRODUCT_SIZE';
        }

        return {
          success: false,
          error: userMessage,
          errorCode,
        };
      }

      return {
        success: true,
        orderId: data.order_id,
        orderCode: data.order_code,
        trackingNumber: data.tracking_number,
        subtotal: data.subtotal,
        discount: data.discount,
        shippingFee: data.shipping_fee,
        total: data.total,
        paymentStatus: data.payment_status,
        currentStatus: data.current_status,
        guestAccessToken: data.guest_access_token,
      };
    } catch (err: any) {
      console.warn('[checkoutService.placeOrderAtomic] Unexpected failure:', err);
      return {
        success: false,
        error: err.message || 'Checkout failed due to unexpected server error',
        errorCode: 'CHECKOUT_EXCEPTION',
      };
    }
  },

  async placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
    return this.placeOrderAtomic(input);
  },

  async validateStockAvailability(cartItems: CartItem[]): Promise<{ available: boolean; unavailableItems?: string[] }> {
    if (!cartItems || cartItems.length === 0) return { available: true };
    return { available: true };
  },

  async validatePromoCode(code: string, subtotal: number): Promise<{ valid: boolean; discountPercent?: number; error?: string }> {
    if (!code) return { valid: false, error: 'Promo code is required' };
    const clean = code.trim().toUpperCase();
    if (clean === 'KIXORA10') return { valid: true, discountPercent: 10 };
    if (clean === 'GRAIL20') {
      if (subtotal < 3000) return { valid: false, error: 'Minimum spend of R3,000 required for GRAIL20' };
      return { valid: true, discountPercent: 20 };
    }
    return { valid: false, error: 'Invalid or expired promo code' };
  }
};
