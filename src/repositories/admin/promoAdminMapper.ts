import { PromoCode } from '../../types';
import type { Database } from '../../types/database';

export type PromoCodeRow = Database['public']['Tables']['promo_codes']['Row'];
export type PromoCodeInsert = Database['public']['Tables']['promo_codes']['Insert'];
export type PromoCodeUpdate = Database['public']['Tables']['promo_codes']['Update'];

export interface PromoFormData {
  code: string;
  discountPercent: number;
  minSpend?: number;
  description?: string;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string | null;
  maxUses?: number | null;
}

/**
 * Maps database promo_codes row to domain PromoCode model.
 */
export function mapPromoRowToPromoCode(row: PromoCodeRow): PromoCode {
  return {
    id: row.id,
    code: row.code,
    discountPercent: Number(row.discount_percent),
    minSpend: row.min_spend ? Number(row.min_spend) : undefined,
    description: `${row.discount_percent}% off discount code`,
    isActive: Boolean(row.is_active),
  };
}

/**
 * Maps an array of promo_codes rows to domain PromoCode models.
 */
export function mapPromoRowsToPromoCodes(rows: PromoCodeRow[]): PromoCode[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapPromoRowToPromoCode);
}

/**
 * Maps an admin promo form input into database insert parameters.
 */
export function mapPromoFormToDbInsert(form: PromoFormData): PromoCodeInsert {
  return {
    code: form.code.trim().toUpperCase(),
    discount_percent: Number(form.discountPercent),
    min_spend: form.minSpend ? Number(form.minSpend) : 0,
    max_uses: form.maxUses !== undefined ? form.maxUses : null,
    is_active: form.isActive !== undefined ? form.isActive : true,
    starts_at: form.startsAt || new Date().toISOString(),
    expires_at: form.expiresAt || null,
  };
}
