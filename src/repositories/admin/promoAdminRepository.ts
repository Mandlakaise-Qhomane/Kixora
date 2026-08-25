import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PromoCode } from '../../types';
import {
  mapPromoRowToPromoCode,
  mapPromoRowsToPromoCodes,
  mapPromoFormToDbInsert,
  PromoFormData,
  PromoCodeUpdate,
} from './promoAdminMapper';
import { auditService } from '../../services/auditService';

export const promoAdminRepository = {
  /**
   * Retrieves all promo discount codes.
   */
  async getAllPromos(): Promise<PromoCode[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[promoAdminRepository.getAllPromos] Error:', error);
      throw error;
    }

    return mapPromoRowsToPromoCodes(data || []);
  },

  /**
   * Retrieves a promo code by ID.
   */
  async getPromoById(id: string): Promise<PromoCode | null> {
    if (!isSupabaseConfigured() || !id) {
      return null;
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[promoAdminRepository.getPromoById] Error:', error);
      throw error;
    }

    if (!data) return null;
    return mapPromoRowToPromoCode(data);
  },

  /**
   * Creates a new promotional discount code.
   */
  async createPromo(formData: PromoFormData, adminId?: string): Promise<PromoCode> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured');
    }

    const insertPayload = mapPromoFormToDbInsert(formData);
    const { data, error } = await supabase
      .from('promo_codes')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[promoAdminRepository.createPromo] Error:', error);
      throw error;
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'CREATE',
      entityType: 'promo',
      entityId: data.id,
      changes: { code: insertPayload.code, discountPercent: insertPayload.discount_percent },
    });

    return mapPromoRowToPromoCode(data);
  },

  /**
   * Updates an existing promo code.
   */
  async updatePromo(id: string, updates: Partial<PromoFormData>, adminId?: string): Promise<PromoCode> {
    if (!isSupabaseConfigured() || !id) {
      throw new Error('Supabase client is not configured or promo ID missing');
    }

    const payload: PromoCodeUpdate = {};
    if (updates.code !== undefined) payload.code = updates.code.trim().toUpperCase();
    if (updates.discountPercent !== undefined) payload.discount_percent = Number(updates.discountPercent);
    if (updates.minSpend !== undefined) payload.min_spend = Number(updates.minSpend);
    if (updates.isActive !== undefined) payload.is_active = Boolean(updates.isActive);
    if (updates.expiresAt !== undefined) payload.expires_at = updates.expiresAt;
    if (updates.maxUses !== undefined) payload.max_uses = updates.maxUses;

    const { data, error } = await supabase
      .from('promo_codes')
      .update(payload as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[promoAdminRepository.updatePromo] Error:', error);
      throw error;
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'UPDATE',
      entityType: 'promo',
      entityId: id,
      changes: updates,
    });

    return mapPromoRowToPromoCode(data);
  },

  /**
   * Toggles promo active state.
   */
  async togglePromoActive(id: string, isActive: boolean, adminId?: string): Promise<void> {
    if (!isSupabaseConfigured() || !id) return;

    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      console.error('[promoAdminRepository.togglePromoActive] Error:', error);
      throw error;
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'TOGGLE_ACTIVE',
      entityType: 'promo',
      entityId: id,
      changes: { isActive },
    });
  },

  /**
   * Deletes a promo code.
   */
  async deletePromo(id: string, adminId?: string): Promise<void> {
    if (!isSupabaseConfigured() || !id) return;

    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) {
      console.error('[promoAdminRepository.deletePromo] Error:', error);
      throw error;
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'DELETE',
      entityType: 'promo',
      entityId: id,
      changes: { id },
    });
  },
};
