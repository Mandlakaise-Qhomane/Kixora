import { supabase } from '../api/supabase';
import { handleSupabaseError } from '../api/errors';
import type { BespokeDesign } from '../types/domain';

export const bespokeRepository = {
  async createDesign(
    baseProductId: string, 
    designName: string, 
    designSnapshot: any, 
    pricePremium: number = 0,
    previewImageUrl?: string
  ): Promise<BespokeDesign> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw handleSupabaseError(userError || { code: 'PGRST116' });

    const { data, error } = await supabase
      .from('bespoke_designs')
      .insert({
        user_id: userData.user.id,
        base_product_id: baseProductId,
        design_name: designName,
        design_snapshot: designSnapshot,
        price_premium: pricePremium,
        preview_image_url: previewImageUrl || null,
        is_ordered: false
      })
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    return data as any;
  },

  async getUserDesigns(): Promise<BespokeDesign[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw handleSupabaseError(userError || { code: 'PGRST116' });

    const res = await supabase
      .from('bespoke_designs')
      .select('*, product:products(*)')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (res.error) throw handleSupabaseError(res.error);
    return (res.data as any) || [];
  },

  async getDesignById(id: string): Promise<BespokeDesign | null> {
    const res = await supabase
      .from('bespoke_designs')
      .select('*, product:products(*)')
      .eq('id', id)
      .single();

    if (res.error) {
      if (res.error.code === 'PGRST116') return null;
      throw handleSupabaseError(res.error);
    }
    return res.data as any;
  },

  async updateDesign(id: string, updates: any): Promise<BespokeDesign> {
    const { data, error } = await supabase
      .from('bespoke_designs')
      .update(updates)
      .eq('id', id)
      .eq('is_ordered', false)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    return data as any;
  }
};
