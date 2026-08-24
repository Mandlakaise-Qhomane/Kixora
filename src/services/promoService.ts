import { supabase } from '../api/supabase';
import { handleSupabaseError, AppError } from '../api/errors';
import type { PromoCode } from '../types/domain';

export const promoService = {
  /**
   * Securely validates a promo code via RPC.
   * Never trust client-side discount logic for final totals.
   */
  async validatePromoCode(code: string, subtotal: number): Promise<{ isValid: boolean; discountAmount: number; minSpend: number; promoId?: string }> {
    try {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: code.toUpperCase(),
        p_subtotal: subtotal
      });

      if (error) {
        throw error;
      }

      if (!data) {
         return { isValid: false, discountAmount: 0, minSpend: 0 };
      }

      // The RPC returns { is_valid, discount_amount, min_spend, promo_id }
      // Because we used raw DB queries, we should map safely
      const result = data as any;
      if (result.is_valid) {
        return {
          isValid: true,
          discountAmount: Number(result.discount_amount),
          minSpend: Number(result.min_spend),
          promoId: result.promo_id
        };
      } else {
        return { isValid: false, discountAmount: 0, minSpend: 0 };
      }
    } catch (error: any) {
      if (error.message?.includes('Invalid or expired promo code')) {
        throw new AppError('PROMO_INVALID', 'This promo code is invalid or expired.', error);
      }
      if (error.message?.includes('Minimum spend not met')) {
        throw new AppError('VALIDATION', 'Minimum spend for this promo code not met.', error);
      }
      throw handleSupabaseError(error);
    }
  }
};
