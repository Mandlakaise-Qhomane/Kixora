import { CartItem, Sneaker } from '../../types';
import { cartRepository } from '../../repositories/customer/cartRepository';
import { isSupabaseCartEnabled } from '../../config/features';

export const cartAdapter = {
  /**
   * Loads the current cart items.
   * If feature flag is enabled and user/guest token exists, fetches from repository.
   * Falls back to fallbackCart.
   */
  async loadCart(userIdOrGuestToken: string, fallbackCart: CartItem[]): Promise<CartItem[]> {
    if (!isSupabaseCartEnabled()) {
      return fallbackCart;
    }

    try {
      const items = await cartRepository.getCart(userIdOrGuestToken);
      if (items && items.length > 0) {
        return items;
      }
      return fallbackCart;
    } catch (error) {
      console.warn('[cartAdapter.loadCart] Supabase cart load failed, using fallback:', error);
      return fallbackCart;
    }
  },

  /**
   * Synchronizes adding an item to the remote cart repository in the background.
   */
  async syncAddItem(
    userId: string,
    sneaker: Sneaker,
    size: number,
    quantity: number = 1
  ): Promise<void> {
    if (!isSupabaseCartEnabled()) return;

    try {
      await cartRepository.addItem(userId, sneaker, size, quantity);
    } catch (error) {
      console.warn('[cartAdapter.syncAddItem] Background cart sync failed:', error);
    }
  },

  /**
   * Synchronizes quantity updates to the remote cart.
   */
  async syncUpdateQuantity(userId: string, cartItemId: string, quantity: number): Promise<void> {
    if (!isSupabaseCartEnabled()) return;

    try {
      await cartRepository.updateQuantity(userId, cartItemId, quantity);
    } catch (error) {
      console.warn('[cartAdapter.syncUpdateQuantity] Background cart update failed:', error);
    }
  },

  /**
   * Synchronizes item removal to the remote cart.
   */
  async syncRemoveItem(userId: string, cartItemId: string): Promise<void> {
    if (!isSupabaseCartEnabled()) return;

    try {
      await cartRepository.removeItem(userId, cartItemId);
    } catch (error) {
      console.warn('[cartAdapter.syncRemoveItem] Background cart removal failed:', error);
    }
  },

  /**
   * Clears the remote cart in the background.
   */
  async syncClearCart(userId: string): Promise<void> {
    if (!isSupabaseCartEnabled()) return;

    try {
      await cartRepository.clearCart(userId);
    } catch (error) {
      console.warn('[cartAdapter.syncClearCart] Background cart clear failed:', error);
    }
  },
};
