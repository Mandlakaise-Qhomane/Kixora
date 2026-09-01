import { supabase } from '../../lib/supabase';
import { Sneaker } from '../../types';
import { mapProductRowToSneaker, ProductHydratedRow } from './productMapper';

export const productRepository = {
  async getProducts(): Promise<Sneaker[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brands (*),
          categories (*),
          product_images (*),
          product_sizes (
            *,
            inventory (*)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[productRepository.getProducts] Failed to fetch products:', error);
        throw error;
      }

      if (!data) return [];
      return (data as unknown as ProductHydratedRow[]).map(mapProductRowToSneaker);
    } catch (err) {
      console.warn('[productRepository.getProducts] Network error or unconfigured Supabase:', err);
      throw err;
    }
  },

  async getProductBySlug(slugOrId: string): Promise<Sneaker | null> {
    const query = supabase
      .from('products')
      .select(`
        *,
        brands (*),
        categories (*),
        product_images (*),
        product_sizes (
          *,
          inventory (*)
        )
      `)
      .eq('is_active', true);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const { data, error } = isUuid 
      ? await query.eq('id', slugOrId).maybeSingle()
      : await query.eq('slug', slugOrId).maybeSingle();

    if (error) {
      console.error('[productRepository.getProductBySlug] Error fetching product:', error);
      throw error;
    }

    if (!data) return null;
    return mapProductRowToSneaker(data as unknown as ProductHydratedRow);
  },

  async getBrands(): Promise<Array<{ id: string; name: string; slug: string }>> {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) {
      console.error('[productRepository.getBrands] Error:', error);
      return [];
    }
    return data || [];
  },

  async getCategories(): Promise<Array<{ id: string; name: string; slug: string }>> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) {
      console.error('[productRepository.getCategories] Error:', error);
      return [];
    }
    return data || [];
  },

  async getProductWithSizes(productId: string): Promise<Sneaker | null> {
    return this.getProductBySlug(productId);
  },

  async getProductImages(productId: string): Promise<Array<{ id: string; image_url: string; display_order: number }>> {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });
    if (error) {
      console.error('[productRepository.getProductImages] Error:', error);
      return [];
    }
    return data || [];
  }
};
