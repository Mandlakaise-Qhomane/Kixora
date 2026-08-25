import { Sneaker } from '../../types';
import { wishlistRepository } from '../../repositories/customer/wishlistRepository';
import { isSupabaseWishlistEnabled } from '../../config/features';

export const wishlistAdapter = {
  /**
   * Loads the user wishlist as product IDs.
   * If feature flag is enabled, fetches from Supabase and extracts IDs.
   */
  async loadWishlist(userId: string, fallbackWishlist: string[]): Promise<string[]> {
    if (!isSupabaseWishlistEnabled()) {
      return fallbackWishlist;
    }

    try {
      const items: Sneaker[] = await wishlistRepository.getWishlist(userId);
      if (items && items.length > 0) {
        return items.map(s => s.id);
      }
      return fallbackWishlist;
    } catch (error) {
      console.warn('[wishlistAdapter.loadWishlist] Supabase wishlist load failed, using fallback:', error);
      return fallbackWishlist;
    }
  },

  /**
   * Synchronizes wishlist toggle in the background.
   */
  async syncToggleWishlist(userId: string, productId: string, isCurrentlyWishlisted: boolean): Promise<void> {
    if (!isSupabaseWishlistEnabled()) return;

    try {
      if (isCurrentlyWishlisted) {
        await wishlistRepository.removeFromWishlist(userId, productId);
      } else {
        await wishlistRepository.addToWishlist(userId, productId);
      }
    } catch (error) {
      console.warn('[wishlistAdapter.syncToggleWishlist] Background wishlist toggle failed:', error);
    }
  },
};
