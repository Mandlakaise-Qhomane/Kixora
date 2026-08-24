import { supabase } from '../api/supabase';
import { handleSupabaseError } from '../api/errors';
import type { Profile } from '../types/domain';

export const authService = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw handleSupabaseError(error);
    return data.session;
  },

  async getUserProfile(): Promise<Profile | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw handleSupabaseError(error);
    }
    
    return data as Profile;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw handleSupabaseError(error);
  }
};
