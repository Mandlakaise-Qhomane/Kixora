import { Sneaker, Drop } from '../../types';
import { productRepository } from '../../repositories/customer/productRepository';
import { dropsRepository } from '../../repositories/customer/dropsRepository';
import { isSupabaseCatalogEnabled, isSupabaseDropsEnabled } from '../../config/features';

export interface CatalogAdapterResult {
  sneakers?: Sneaker[];
  drops?: Drop[];
  error?: Error;
}

export const catalogAdapter = {
  /**
   * Fetches the sneaker catalog.
   * If feature flag is enabled, attempts to fetch from Supabase repository,
   * falling back to local fallback data if anything fails or if the flag is disabled.
   */
  async loadCatalog(fallbackSneakers: Sneaker[]): Promise<Sneaker[]> {
    if (!isSupabaseCatalogEnabled()) {
      return fallbackSneakers;
    }

    try {
      const data = await productRepository.getProducts();
      if (data && data.length > 0) {
        return data;
      }
      return fallbackSneakers;
    } catch (error) {
      console.warn('[catalogAdapter.loadCatalog] Supabase fetch failed, using fallback:', error);
      return fallbackSneakers;
    }
  },

  /**
   * Fetches the drops list.
   * If feature flag is enabled, attempts to fetch from Supabase repository,
   * falling back to local fallback data if anything fails or if the flag is disabled.
   */
  async loadDrops(fallbackDrops: Drop[]): Promise<Drop[]> {
    if (!isSupabaseDropsEnabled()) {
      return fallbackDrops;
    }

    try {
      const data = await dropsRepository.getDrops();
      if (data && data.length > 0) {
        return data;
      }
      return fallbackDrops;
    } catch (error) {
      console.warn('[catalogAdapter.loadDrops] Supabase fetch failed, using fallback:', error);
      return fallbackDrops;
    }
  },

  /**
   * Toggles notification / raffle participation for a drop.
   */
  async toggleDropNotify(dropId: string, currentNotified: boolean): Promise<boolean> {
    if (!isSupabaseDropsEnabled()) {
      return !currentNotified;
    }

    try {
      await dropsRepository.toggleDropNotification(dropId);
      return !currentNotified;
    } catch (error) {
      console.warn('[catalogAdapter.toggleDropNotify] Supabase notification update failed:', error);
      return !currentNotified;
    }
  },
};
