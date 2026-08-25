import { useState, useCallback, useEffect } from 'react';
import { PromoCode } from '../../types';
import { isSupabaseAdminPromosEnabled } from '../../config/features';
import { promoAdminRepository } from '../../repositories/admin/promoAdminRepository';
import { PromoFormData } from '../../repositories/admin/promoAdminMapper';

export function useAdminPromos(fallbackPromos: PromoCode[] = []) {
  const [promos, setPromos] = useState<PromoCode[]>(fallbackPromos);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromos = useCallback(async () => {
    if (!isSupabaseAdminPromosEnabled()) {
      setPromos(fallbackPromos);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await promoAdminRepository.getAllPromos();
      setPromos(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch promos');
      setPromos(fallbackPromos);
    } finally {
      setIsLoading(false);
    }
  }, [fallbackPromos]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const createPromo = useCallback(async (formData: PromoFormData) => {
    if (!isSupabaseAdminPromosEnabled()) {
      return null;
    }

    setIsLoading(true);
    try {
      const created = await promoAdminRepository.createPromo(formData);
      setPromos((prev) => [created, ...prev]);
      return created;
    } catch (err: any) {
      setError(err?.message || 'Failed to create promo code');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePromoActive = useCallback(async (id: string, isActive: boolean) => {
    if (!isSupabaseAdminPromosEnabled()) {
      setPromos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive } : p))
      );
      return;
    }

    setIsLoading(true);
    try {
      await promoAdminRepository.togglePromoActive(id, isActive);
      setPromos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive } : p))
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle promo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePromo = useCallback(async (id: string) => {
    if (!isSupabaseAdminPromosEnabled()) {
      setPromos((prev) => prev.filter((p) => p.id !== id));
      return;
    }

    setIsLoading(true);
    try {
      await promoAdminRepository.deletePromo(id);
      setPromos((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete promo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    promos,
    isLoading,
    error,
    refresh: fetchPromos,
    createPromo,
    togglePromoActive,
    deletePromo,
  };
}
