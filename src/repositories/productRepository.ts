import { supabase } from '../api/supabase';
import { handleSupabaseError } from '../api/errors';
import type { Brand, Category, Product, ProductWithDetails } from '../types/domain';

export const productRepository = {
  async getActiveProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
    if (error) throw handleSupabaseError(error);
    return data || [];
  },

  async getProductById(id: string): Promise<ProductWithDetails | null> {
    const res = await supabase
      .from('products')
      .select('*, brand:brands(*), category:categories(*), images:product_images(*), sizes:product_sizes(*, inventory(*))')
      .eq('id', id)
      .eq('is_active', true)
      .single();
      
    if (res.error) {
      if (res.error.code === 'PGRST116') return null; // not found
      throw handleSupabaseError(res.error);
    }
    
    const data = res.data as any;
    if (data && data.images) {
      data.images.sort((a: any, b: any) => a.display_order - b.display_order);
    }
    return data as ProductWithDetails;
  },

  async getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
    const res = await supabase
      .from('products')
      .select('*, brand:brands(*), category:categories(*), images:product_images(*), sizes:product_sizes(*, inventory(*))')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (res.error) {
      if (res.error.code === 'PGRST116') return null; // not found
      throw handleSupabaseError(res.error);
    }
    
    const data = res.data as any;
    if (data && data.images) {
      data.images.sort((a: any, b: any) => a.display_order - b.display_order);
    }
    return data as ProductWithDetails;
  },

  async getBrands(): Promise<Brand[]> {
    const { data, error } = await supabase.from('brands').select('*').eq('is_active', true);
    if (error) throw handleSupabaseError(error);
    return data || [];
  },

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw handleSupabaseError(error);
    return data || [];
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false });
    if (error) throw handleSupabaseError(error);
    return data || [];
  },

  async getNewReleases(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).eq('is_new_release', true).order('created_at', { ascending: false });
    if (error) throw handleSupabaseError(error);
    return data || [];
  },

  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).ilike('name', `%${query}%`);
    if (error) throw handleSupabaseError(error);
    return data || [];
  },

  async filterProducts(filters: {
    brandIds?: string[];
    categoryIds?: string[];
    minPrice?: number;
    maxPrice?: number;
    genders?: string[];
  }): Promise<Product[]> {
    let query = supabase.from('products').select('*').eq('is_active', true);

    if (filters.brandIds && filters.brandIds.length > 0) {
      query = query.in('brand_id', filters.brandIds);
    }
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      query = query.in('category_id', filters.categoryIds);
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.genders && filters.genders.length > 0) {
      query = query.in('gender', filters.genders);
    }

    const { data, error } = await query;
    if (error) throw handleSupabaseError(error);
    return data || [];
  }
};
