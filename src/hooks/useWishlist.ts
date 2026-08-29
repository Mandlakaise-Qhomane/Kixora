import { useState, useEffect, useCallback, useRef } from 'react';
import { Sneaker } from '../types';
import { wishlistRepository } from '../repositories/customer/wishlistRepository';
import { authService } from '../services/authService';
import { AuthUser } from '../types/auth';

const STORAGE_KEY = 'kixora_wishlist_v2';
const DEFAULT_GUEST_WISHLIST = ['kixo-shattered-backboard-01', 'kixo-aj4-black-cat-04'];

export interface UseWishlistResult {
  wishlist: string[];
  wishlistItems: Sneaker[];
  isLoading: boolean;
  error: string | null;
  isWishlisted: (productId: string) => boolean;
  isInWishlist: (productId: string) => boolean;
  add: (productId: string) => Promise<boolean>;
  addToWishlist: (productId: string) => Promise<boolean>;
  remove: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  toggle: (productId: string) => Promise<boolean>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  mergeGuestWishlist: (guestIds?: string[]) => Promise<void>;
}

export function useWishlist(): UseWishlistResult {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_GUEST_WISHLIST;
    } catch {
      return DEFAULT_GUEST_WISHLIST;
    }
  });
  const [wishlistItems, setWishlistItems] = useState<Sneaker[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const prevWishlistRef = useRef<string[]>(wishlist);

  // Subscribe to authentication state
  useEffect(() => {
    let isMounted = true;

    authService.getSession().then(session => {
      if (isMounted) {
        setCurrentUser(session?.user || null);
      }
    });

    const unsubscribe = authService.onAuthStateChange(session => {
      if (isMounted) {
        setCurrentUser(session?.user || null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Fetch wishlist from Supabase for authenticated user, or sync from localStorage for guest
  const loadWishlist = useCallback(async () => {
    if (!currentUser?.id) {
      // Guest mode: read from localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const ids = saved ? JSON.parse(saved) : DEFAULT_GUEST_WISHLIST;
        setWishlist(ids);
        prevWishlistRef.current = ids;
      } catch {
        setWishlist(DEFAULT_GUEST_WISHLIST);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if guest wishlist needs to be migrated to Supabase
      const guestRaw = localStorage.getItem(STORAGE_KEY);
      if (guestRaw) {
        try {
          const guestIds: string[] = JSON.parse(guestRaw);
          if (Array.isArray(guestIds) && guestIds.length > 0) {
            await wishlistRepository.mergeGuestWishlist(currentUser.id, guestIds);
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (e) {
          console.warn('[useWishlist] Failed to parse guest wishlist for migration:', e);
        }
      }

      // Fetch persistent wishlist items from Supabase
      const items = await wishlistRepository.getWishlist(currentUser.id);
      const ids = items.map(item => item.id);
      setWishlistItems(items);
      setWishlist(ids);
      prevWishlistRef.current = ids;
    } catch (err: any) {
      console.warn('[useWishlist] Error loading wishlist from Supabase:', err);
      setError(err?.message || 'Failed to load wishlist');
      // Fall back to current in-memory / local IDs
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Keep localStorage synced when in guest mode
  useEffect(() => {
    if (!currentUser?.id) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
      } catch (e) {
        console.warn('[useWishlist] LocalStorage sync error:', e);
      }
    }
  }, [wishlist, currentUser?.id]);

  const isWishlisted = useCallback((productId: string): boolean => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!productId) return false;
    if (wishlist.includes(productId)) return true;

    const previous = [...wishlist];
    prevWishlistRef.current = previous;
    const next = [...previous, productId];

    // Optimistic UI update
    setWishlist(next);
    setError(null);

    if (currentUser?.id) {
      try {
        await wishlistRepository.addToWishlist(currentUser.id, productId);
        return true;
      } catch (err: any) {
        console.error('[useWishlist] Failed to add item to Supabase wishlist:', err);
        // Revert optimistic update
        setWishlist(previous);
        setError(err?.message || 'Failed to save item to wishlist');
        return false;
      }
    }
    return true;
  }, [wishlist, currentUser?.id]);

  const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!productId) return false;
    if (!wishlist.includes(productId)) return true;

    const previous = [...wishlist];
    prevWishlistRef.current = previous;
    const next = previous.filter(id => id !== productId);

    // Optimistic UI update
    setWishlist(next);
    setError(null);

    if (currentUser?.id) {
      try {
        await wishlistRepository.removeFromWishlist(currentUser.id, productId);
        return true;
      } catch (err: any) {
        console.error('[useWishlist] Failed to remove item from Supabase wishlist:', err);
        // Revert optimistic update
        setWishlist(previous);
        setError(err?.message || 'Failed to remove item from wishlist');
        return false;
      }
    }
    return true;
  }, [wishlist, currentUser?.id]);

  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (!productId) return false;
    if (wishlist.includes(productId)) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId);
    }
  }, [wishlist, addToWishlist, removeFromWishlist]);

  const mergeGuestWishlist = useCallback(async (guestIds?: string[]): Promise<void> => {
    if (!currentUser?.id) return;
    const idsToMerge = guestIds || wishlist;
    if (!idsToMerge || idsToMerge.length === 0) return;

    try {
      await wishlistRepository.mergeGuestWishlist(currentUser.id, idsToMerge);
      await loadWishlist();
    } catch (err: any) {
      console.warn('[useWishlist] Error merging wishlist:', err);
    }
  }, [currentUser?.id, wishlist, loadWishlist]);

  return {
    wishlist,
    wishlistItems,
    isLoading,
    error,
    isWishlisted,
    isInWishlist: isWishlisted,
    add: addToWishlist,
    addToWishlist,
    remove: removeFromWishlist,
    removeFromWishlist,
    toggle: toggleWishlist,
    toggleWishlist,
    refetch: loadWishlist,
    mergeGuestWishlist,
  };
}
