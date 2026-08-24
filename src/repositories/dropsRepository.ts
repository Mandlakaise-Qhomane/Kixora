import { supabase } from '../api/supabase';
import { handleSupabaseError, AppError } from '../api/errors';
import type { Drop } from '../types/domain';

export const dropsRepository = {
  async getActiveDrops(): Promise<Drop[]> {
    const { data, error } = await supabase
      .from('drops')
      .select('*')
      .eq('is_active', true)
      .lte('release_time', new Date().toISOString())
      .order('release_time', { ascending: false });

    if (error) throw handleSupabaseError(error);
    return (data as any) || [];
  },

  async getUpcomingDrops(): Promise<Drop[]> {
    const { data, error } = await supabase
      .from('drops')
      .select('*')
      .eq('is_active', true)
      .gt('release_time', new Date().toISOString())
      .order('release_time', { ascending: true });

    if (error) throw handleSupabaseError(error);
    return (data as any) || [];
  },

  async getDropById(id: string): Promise<Drop | null> {
    const { data, error } = await supabase
      .from('drops')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw handleSupabaseError(error);
    }
    return data as any;
  },

  async submitRaffleEntry(dropId: string, preferredSize: number): Promise<void> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw handleSupabaseError(userError || { code: 'PGRST116' });

    const { error } = await supabase
      .from('raffle_entries')
      .insert({
        drop_id: dropId,
        user_id: userData.user.id,
        preferred_size: preferredSize,
        is_winner: false
      } as any);

    if (error) {
      if (error.code === '23505') {
        throw new AppError('DUPLICATE', 'You have already entered this raffle.');
      }
      throw handleSupabaseError(error);
    }
  },

  async getUserRaffleEntries() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw handleSupabaseError(userError || { code: 'PGRST116' });

    const res = await supabase
      .from('raffle_entries')
      .select('*, drop:drops(*)')
      .eq('user_id', userData.user.id);

    if (res.error) throw handleSupabaseError(res.error);
    return (res.data as any) || [];
  }
};
