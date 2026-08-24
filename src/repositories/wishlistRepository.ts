import { supabase } from '../api/supabase';
import { handleSupabaseError } from '../api/errors';
import type { Product } from '../types/domain';

export const wishlistRepository = {
  async getWishlist(): Promise<Product[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw handleSupabaseError(userError || { code: 'PGRST116' });

    const res = await supabase
      .from('wishlists')
      .select('product_id, products(*)')
      .eq('user_id', userData.user.id);

    if (res.error) throw handleSupabaseError(res.error);
    
    return ((res.data as any) || [])
      .map((item: any) => item.products)
      .filter((p: any): p is Product => p !== null);
  },

  async addWishlistItem(productId: string): Promise<void> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw handleSupabaseError(userError || { code: 'PGRST116' });

    const { error } = await supabase
      .from('wishlists')
      .insert({
        user_id: userData.user.id,
        product_id: productId
      } as any);

    if (error && error.code !== '23505') {
      throw handleSupabaseError(error);
    }
  },

  async removeWishlistItem(productId: string): Promise<void> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) throw handleSupabaseError(userError || { code: 'PGRST116' });

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('product_id', productId);

    if (error) throw handleSupabaseError(error);
  },

  async checkIsWishlisted(productId: string): Promise<boolean> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return false;

    const { count, error } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .eq('product_id', productId);

    if (error) throw handleSupabaseError(error);
    return count ? count > 0 : false;
  }
};
