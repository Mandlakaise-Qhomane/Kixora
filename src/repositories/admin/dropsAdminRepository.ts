import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Drop } from '../../types';
import type { Database } from '../../types/database';
import { mapDropRowToDrop, mapDropRowsToDrops, DropHydratedRow } from '../customer/dropsMapper';
import { auditService } from '../../services/auditService';

type DropUpdate = Database['public']['Tables']['drops']['Update'];

export interface DropFormData {
  sneakerName: string;
  brand: string;
  price: number;
  releaseTime: string;
  image: string;
  hypeLevel: 'EXTREME' | 'HIGH' | 'GRAIL' | 'LIMITED';
  type: 'Shock Drop' | 'Raffle Draw' | 'Vault Exclusive' | 'General Release';
  description: string;
  isActive?: boolean;
}

export interface RaffleEntryDetail {
  id: string;
  dropId: string;
  userId: string;
  preferredSize: number | null;
  isWinner: boolean;
  createdAt: string;
}

export const dropsAdminRepository = {
  /**
   * Retrieves all drops including inactive drops for admin management.
   */
  async getAllDrops(): Promise<Drop[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('drops')
      .select('*, brands (*)')
      .order('release_time', { ascending: true });

    if (error) {
      console.error('[dropsAdminRepository.getAllDrops] Error:', error);
      throw error;
    }

    return mapDropRowsToDrops((data || []) as unknown as DropHydratedRow[]);
  },

  /**
   * Retrieves a drop by ID.
   */
  async getDropById(id: string): Promise<Drop | null> {
    if (!isSupabaseConfigured() || !id) {
      return null;
    }

    const { data, error } = await supabase
      .from('drops')
      .select('*, brands (*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[dropsAdminRepository.getDropById] Error:', error);
      throw error;
    }

    if (!data) return null;
    return mapDropRowToDrop(data as unknown as DropHydratedRow);
  },

  /**
   * Creates a new scheduled drop or raffle event.
   */
  async createDrop(form: DropFormData, adminId?: string): Promise<Drop> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured');
    }

    // Resolve brand ID
    let brandId = '00000000-0000-0000-0000-000000000001';
    const { data: brandRow } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', form.brand)
      .maybeSingle();

    if (brandRow?.id) {
      brandId = brandRow.id;
    }

    const { data, error } = await supabase
      .from('drops')
      .insert({
        sneaker_name: form.sneakerName,
        brand_id: brandId,
        price: Number(form.price),
        release_time: form.releaseTime,
        image_url: form.image,
        hype_level: form.hypeLevel,
        drop_type: form.type,
        description: form.description,
        is_active: form.isActive !== undefined ? form.isActive : true,
      })
      .select('*, brands (*)')
      .single();

    if (error) {
      console.error('[dropsAdminRepository.createDrop] Error:', error);
      throw error;
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'CREATE',
      entityType: 'drop',
      entityId: data.id,
      changes: { sneakerName: form.sneakerName, releaseTime: form.releaseTime },
    });

    return mapDropRowToDrop(data as unknown as DropHydratedRow);
  },

  /**
   * Updates an existing drop schedule or configuration.
   */
  async updateDrop(id: string, updates: Partial<DropFormData>, adminId?: string): Promise<Drop> {
    if (!isSupabaseConfigured() || !id) {
      throw new Error('Supabase client is not configured or drop ID missing');
    }

    const payload: DropUpdate = {};
    if (updates.sneakerName !== undefined) payload.sneaker_name = updates.sneakerName;
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.releaseTime !== undefined) payload.release_time = updates.releaseTime;
    if (updates.image !== undefined) payload.image_url = updates.image;
    if (updates.hypeLevel !== undefined) payload.hype_level = updates.hypeLevel;
    if (updates.type !== undefined) payload.drop_type = updates.type;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('drops')
      .update(payload as any)
      .eq('id', id)
      .select('*, brands (*)')
      .single();

    if (error) {
      console.error('[dropsAdminRepository.updateDrop] Error:', error);
      throw error;
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'UPDATE',
      entityType: 'drop',
      entityId: id,
      changes: updates,
    });

    return mapDropRowToDrop(data as unknown as DropHydratedRow);
  },

  /**
   * Toggles a drop's active status.
   */
  async toggleDropActive(id: string, isActive: boolean, adminId?: string): Promise<void> {
    if (!isSupabaseConfigured() || !id) return;

    const { error } = await supabase
      .from('drops')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      console.error('[dropsAdminRepository.toggleDropActive] Error:', error);
      throw error;
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'TOGGLE_ACTIVE',
      entityType: 'drop',
      entityId: id,
      changes: { isActive },
    });
  },

  /**
   * Retrieves user entries for a specific drop/raffle.
   */
  async getRaffleEntries(dropId: string): Promise<RaffleEntryDetail[]> {
    if (!isSupabaseConfigured() || !dropId) {
      return [];
    }

    const { data, error } = await supabase
      .from('raffle_entries')
      .select('*')
      .eq('drop_id', dropId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[dropsAdminRepository.getRaffleEntries] Error:', error);
      throw error;
    }

    return (data || []).map((row) => ({
      id: row.id,
      dropId: row.drop_id,
      userId: row.user_id,
      preferredSize: row.preferred_size,
      isWinner: row.is_winner,
      createdAt: row.created_at,
    }));
  },
};

