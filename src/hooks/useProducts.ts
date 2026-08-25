import { useState, useEffect, useCallback } from 'react';
import { Sneaker } from '../types';
import { INITIAL_SNEAKERS } from '../data/sneakers';
import { productRepository } from '../repositories/customer/productRepository';
import { isSupabaseCatalogEnabled } from '../config/features';
import { isSupabaseConfigured } from '../lib/supabase';

export interface UseProductsResult {
  products: Sneaker[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to retrieve products from Supabase catalog when feature flag is enabled,
 * or fallback seamlessly to local dataset.
 */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Sneaker[]>(INITIAL_SNEAKERS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    // If feature flag is off or Supabase not configured, use local data
    if (!isSupabaseCatalogEnabled() || !isSupabaseConfigured()) {
      setProducts(INITIAL_SNEAKERS);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await productRepository.getProducts();
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        // Fallback to initial sneakers if remote table is empty
        setProducts(INITIAL_SNEAKERS);
      }
    } catch (err: any) {
      console.warn('[useProducts] Falling back to local data due to fetch error:', err?.message || err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setProducts(INITIAL_SNEAKERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}
