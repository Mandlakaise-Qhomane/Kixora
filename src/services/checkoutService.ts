import { supabase } from '../api/supabase';
import { handleSupabaseError, AppError } from '../api/errors';

export type CheckoutInput = {
  cartId: string;
  guestToken?: string;
  promoCode?: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    shippingAddress: any; // specific schema depending on UI
  };
  paymentMethod: string;
  shippingMethod: string;
};

export const checkoutService = {
  async placeOrder(input: CheckoutInput): Promise<{ orderId: string; orderCode: string; total: number }> {
    // 1. Validate Input Shape
    if (!input.cartId) {
      throw new AppError('VALIDATION', 'Cart ID is required to place an order.');
    }
    if (!input.customerInfo || !input.customerInfo.email) {
      throw new AppError('VALIDATION', 'Valid customer email is required.');
    }

    try {
      // 2. Call secure backend operation
      const { data, error } = await supabase.rpc('create_pending_order_atomic', {
        p_cart_id: input.cartId,
        p_guest_token: input.guestToken || null,
        p_promo_code: input.promoCode || null,
        p_customer_snapshot: input.customerInfo,
        p_payment_method: input.paymentMethod,
        p_shipping_method: input.shippingMethod
      });

      // 3. Handle structured errors
      if (error) {
        throw error;
      }

      // 4. Return typed result
      const result = data as any;
      return {
        orderId: result.order_id,
        orderCode: result.order_code,
        total: Number(result.total)
      };

    } catch (error: any) {
      // Catch RPC specific raised errors
      if (error.message?.includes('Insufficient stock')) {
        throw new AppError('INVENTORY_INSUFFICIENT', 'Not enough stock available for one or more items.', error);
      }
      if (error.message?.includes('Empty cart')) {
        throw new AppError('VALIDATION', 'Cannot checkout with an empty cart.', error);
      }
      if (error.message?.includes('Invalid promo')) {
        throw new AppError('PROMO_INVALID', 'The provided promo code is invalid or expired.', error);
      }
      throw handleSupabaseError(error);
    }
  }
};
