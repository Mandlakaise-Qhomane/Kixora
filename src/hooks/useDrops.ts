import { useState, useEffect, useCallback } from 'react';
import { Drop } from '../types';
import { INITIAL_DROPS } from '../data/sneakers';
import { dropsRepository } from '../repositories/customer/dropsRepository';
import { isSupabaseDropsEnabled } from '../config/features';
import { isSupabaseConfigured } from '../lib/supabase';

export interface UseDropsResult {
  drops: Drop[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to retrieve drops from Supabase when feature flag is enabled,
 * or fallback seamlessly to local dataset.
 */
export function useDrops(): UseDropsResult {
  const [drops, setDrops] = useState<Drop[]>(INITIAL_DROPS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDrops = useCallback(async () => {
    // If feature flag is off or Supabase not configured, use local data
    if (!isSupabaseDropsEnabled() || !isSupabaseConfigured()) {
      setDrops(INITIAL_DROPS);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await dropsRepository.getActiveDrops();
      if (data && data.length > 0) {
        setDrops(data);
      } else {
        setDrops(INITIAL_DROPS);
      }
    } catch (err: any) {
      console.warn('[useDrops] Falling back to local data due to fetch error:', err?.message || err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setDrops(INITIAL_DROPS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const init = () => {
      setTimeout(() => {
        if (!ignore) {
          fetchDrops();
        }
      }, 0);
    };
    init();
    return () => { ignore = true; };
  }, [fetchDrops]);

  return {
    drops,
    loading,
    error,
    refetch: fetchDrops,
  };
}
