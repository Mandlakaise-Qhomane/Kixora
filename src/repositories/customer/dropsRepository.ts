import { supabase } from '../../lib/supabase';
import { Drop } from '../../types';
import { mapDropRowToDrop, DropHydratedRow } from './dropsMapper';

export const dropsRepository = {
  async getDrops(): Promise<Drop[]> {
    const { data, error } = await supabase
      .from('drops')
      .select('*, brands (*)')
      .eq('is_active', true)
      .order('release_time', { ascending: true });

    if (error) {
      console.error('[dropsRepository.getDrops] Error fetching drops:', error);
      throw error;
    }

    if (!data) return [];
    return (data as unknown as DropHydratedRow[]).map(row => mapDropRowToDrop(row));
  },

  async getActiveDrops(): Promise<Drop[]> {
    return this.getDrops();
  },

  async getDropDetails(dropId: string): Promise<Drop | null> {
    const { data, error } = await supabase
      .from('drops')
      .select('*, brands (*)')
      .eq('id', dropId)
      .maybeSingle();

    if (error) {
      console.error('[dropsRepository.getDropDetails] Error:', error);
      return null;
    }
    if (!data) return null;
    return mapDropRowToDrop(data as unknown as DropHydratedRow);
  },

  async toggleDropNotification(dropId: string): Promise<void> {
    const { error } = await supabase.rpc('toggle_drop_notification', { p_drop_id: dropId });
    if (error) {
      console.error('[dropsRepository.toggleDropNotification] Error:', error);
    }
  }
};
