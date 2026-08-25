import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Sneaker } from '../../types';
import { mapWishlistRowsToSneakers, WishlistHydratedRow } from './wishlistMapper';

export const wishlistRepository = {
  async getWishlist(userId: string): Promise<Sneaker[]> {
    if (!isSupabaseConfigured() || !userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        products (
          *,
          brands (*),
          categories (*),
          product_images (*),
          product_sizes (
            *,
            inventory (*)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[wishlistRepository.getWishlist] Error fetching wishlist:', error);
      throw error;
    }

    return mapWishlistRowsToSneakers((data || []) as unknown as WishlistHydratedRow[]);
  },

  async addToWishlist(userId: string, productId: string): Promise<void> {
    if (!isSupabaseConfigured() || !userId || !productId) {
      return;
    }

    const { error } = await supabase
      .from('wishlists')
      .insert({
        user_id: userId,
        product_id: productId,
      });

    if (error && (error as any).code !== '23505') {
      console.error('[wishlistRepository.addToWishlist] Error adding to wishlist:', error);
      throw error;
    }
  },

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    if (!isSupabaseConfigured() || !userId || !productId) {
      return;
    }

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('[wishlistRepository.removeFromWishlist] Error removing from wishlist:', error);
      throw error;
    }
  },

  async isWishlisted(userId: string, productId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId || !productId) {
      return false;
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      console.error('[wishlistRepository.isWishlisted] Error:', error);
      return false;
    }

    return Boolean(data?.id);
  }
};
