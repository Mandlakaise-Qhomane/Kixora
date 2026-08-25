import { useState, useEffect, useCallback } from 'react';
import { Sneaker } from '../types';
import { wishlistRepository } from '../repositories/customer/wishlistRepository';
import { isSupabaseWishlistEnabled } from '../config/features';
import { isSupabaseConfigured } from '../lib/supabase';

export interface UseWishlistRepositoryResult {
  wishlist: Sneaker[];
  loading: boolean;
  error: Error | null;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * Hook providing access to customer wishlist in Supabase with local fallback.
 */
export function useWishlistRepository(userId?: string): UseWishlistRepositoryResult {
  const [wishlist, setWishlist] = useState<Sneaker[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!isSupabaseWishlistEnabled() || !isSupabaseConfigured() || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await wishlistRepository.getWishlist(userId);
      setWishlist(items);
    } catch (err: any) {
      console.warn('[useWishlistRepository] Fetch error:', err?.message || err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId: string) => {
    if (!isSupabaseWishlistEnabled() || !isSupabaseConfigured() || !userId) return;
    try {
      await wishlistRepository.addToWishlist(userId, productId);
      await fetchWishlist();
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!isSupabaseWishlistEnabled() || !isSupabaseConfigured() || !userId) return;
    try {
      await wishlistRepository.removeFromWishlist(userId, productId);
      await fetchWishlist();
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const isWishlisted = async (productId: string): Promise<boolean> => {
    if (!isSupabaseWishlistEnabled() || !isSupabaseConfigured() || !userId) {
      return wishlist.some((s) => s.id === productId);
    }
    return wishlistRepository.isWishlisted(userId, productId);
  };

  return {
    wishlist,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isWishlisted,
    refetch: fetchWishlist,
  };
}
