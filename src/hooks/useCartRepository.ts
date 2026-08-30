import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '../types';
import { cartRepository } from '../repositories/customer/cartRepository';
import { isSupabaseCartEnabled } from '../config/features';
import { isSupabaseConfigured } from '../lib/supabase';

export interface UseCartRepositoryResult {
  cartItems: CartItem[];
  cartId: string | null;
  loading: boolean;
  error: Error | null;
  addItem: (sizeId: string, quantity?: number, productId?: string, bespokeId?: string | null) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook providing access to the cart repository with seamless fallback when Supabase is disabled.
 */
export function useCartRepository(userId?: string): UseCartRepositoryResult {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCart = useCallback(async () => {
    if (!isSupabaseCartEnabled() || !isSupabaseConfigured() || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const activeCartId = await cartRepository.getOrCreateCart(userId);
      setCartId(activeCartId);
      const { items } = await cartRepository.getCartWithItems(activeCartId);
      setCartItems(items);
    } catch (err: any) {
      console.warn('[useCartRepository] Fetch error:', err?.message || err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchCart();
      }
    };
    init();
    return () => { ignore = true; };
  }, [fetchCart]);

  const addItem = async (sizeId: string, quantity: number = 1, productId?: string, bespokeId?: string | null) => {
    if (!isSupabaseCartEnabled() || !isSupabaseConfigured() || !userId) return;
    try {
      const activeCartId = cartId || await cartRepository.getOrCreateCart(userId);
      setCartId(activeCartId);
      await cartRepository.addItem(activeCartId, sizeId, quantity, productId, bespokeId);
      await fetchCart();
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!isSupabaseCartEnabled() || !isSupabaseConfigured()) return;
    try {
      await cartRepository.updateQuantity(cartItemId, quantity);
      await fetchCart();
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (!isSupabaseCartEnabled() || !isSupabaseConfigured()) return;
    try {
      await cartRepository.removeItem(cartItemId);
      await fetchCart();
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const clearCart = async () => {
    if (!isSupabaseCartEnabled() || !isSupabaseConfigured()) return;
    try {
      if (cartId) {
        await cartRepository.clearCart(cartId);
      } else if (userId) {
        await cartRepository.clearCart(userId);
      }
      setCartItems([]);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return {
    cartItems,
    cartId,
    loading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refetch: fetchCart,
  };
}
