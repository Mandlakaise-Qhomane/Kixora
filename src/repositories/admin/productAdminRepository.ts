import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Sneaker } from '../../types';
import { ProductHydratedRow } from '../customer/productMapper';
import { getOptimizedImageUrl } from '../../lib/cloudinary';
import {
  mapAdminProductRowToSneaker,
  mapAdminProductRowsToSneakers,
  mapProductFormToDbInsert,
  ProductFormData,
  ProductUpdateRow,
} from './productAdminMapper';
import { auditService } from '../../services/auditService';

export interface ProductFilters {
  brand?: string;
  category?: string;
  search?: string;
  isActive?: boolean;
}

export const productAdminRepository = {
  /**
   * Retrieves all products for the administrative catalog.
   */
  async getAllProducts(filters?: ProductFilters): Promise<Sneaker[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
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
      .order('created_at', { ascending: false });

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[productAdminRepository.getAllProducts] Error:', error);
      throw error;
    }

    let results = mapAdminProductRowsToSneakers((data || []) as unknown as ProductHydratedRow[]);

    if (filters?.brand && filters.brand !== 'All') {
      results = results.filter((p) => p.brand.toLowerCase() === filters.brand?.toLowerCase());
    }

    return results;
  },

  /**
   * Retrieves a single product by ID with full details.
   */
  async getProductById(id: string): Promise<Sneaker | null> {
    if (!isSupabaseConfigured() || !id) {
      return null;
    }

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
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[productAdminRepository.getProductById] Error:', error);
      throw error;
    }

    if (!data) return null;
    return mapAdminProductRowToSneaker(data as unknown as ProductHydratedRow);
  },

  /**
   * Creates a new product in the catalog with sizes and images, logging the admin action.
   */
  async createProduct(formData: ProductFormData, adminId?: string): Promise<Sneaker> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase client is not configured');
    }

    // 1. Resolve or find brand ID
    let brandId: string = '00000000-0000-0000-0000-000000000001';
    const { data: brandRow } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', formData.brand || 'Nike')
      .maybeSingle();

    if (brandRow?.id) {
      brandId = brandRow.id;
    } else {
      const brandSlug = (formData.brand || 'nike').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data: createdBrand } = await supabase
        .from('brands')
        .insert({ name: formData.brand || 'Nike', slug: brandSlug, is_active: true })
        .select('id')
        .single();
      if (createdBrand?.id) brandId = createdBrand.id;
    }

    // 2. Resolve or find category ID
    let categoryId: string = '00000000-0000-0000-0000-000000000001';
    const { data: catRow } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', formData.category || 'Lifestyle')
      .maybeSingle();

    if (catRow?.id) {
      categoryId = catRow.id;
    } else {
      const catSlug = (formData.category || 'lifestyle').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data: createdCat } = await supabase
        .from('categories')
        .insert({ name: formData.category || 'Lifestyle', slug: catSlug, is_active: true })
        .select('id')
        .single();
      if (createdCat?.id) categoryId = createdCat.id;
    }

    // 3. Insert product record
    const insertPayload = mapProductFormToDbInsert(formData, brandId, categoryId);
    const { data: productRow, error: prodError } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    if (prodError) {
      console.error('[productAdminRepository.createProduct] Error creating product:', prodError);
      throw prodError;
    }

    const productId = productRow.id;

    // 4. Insert sizes and initial inventory
    const standardSizes = formData.sizes && formData.sizes.length > 0
      ? formData.sizes
      : [
          { size: 7.5, stock: 4 },
          { size: 8, stock: 5 },
          { size: 8.5, stock: 6 },
          { size: 9, stock: 8 },
          { size: 9.5, stock: 8 },
          { size: 10, stock: 7 },
          { size: 10.5, stock: 5 },
          { size: 11, stock: 4 },
          { size: 12, stock: 3 },
        ];

    for (const s of standardSizes) {
      const { data: sizeRow } = await supabase
        .from('product_sizes')
        .insert({
          product_id: productId,
          size_us: s.size,
        })
        .select('id')
        .single();

      if (sizeRow?.id) {
        await supabase.from('inventory').insert({
          product_size_id: sizeRow.id,
          stock: s.stock,
          reserved_stock: 0,
        });
      }
    }

    // 5. Insert product images
    const rawImages: string[] = formData.images && formData.images.length > 0
      ? formData.images
      : ['https://res.cloudinary.com/kixora/image/upload/f_auto,q_auto/kixora/products/shattered-backboard-01.png'];
    const images = rawImages.map((img: string) => getOptimizedImageUrl(img));

    for (let i = 0; i < images.length; i++) {
      await supabase.from('product_images').insert({
        product_id: productId,
        image_url: images[i],
        angle_label: i === 0 ? 'lateral' : `angle-${i + 1}`,
        display_order: i + 1,
      });
    }

    // 6. Record audit log
    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'CREATE',
      entityType: 'product',
      entityId: productId,
      changes: { name: formData.name, sku: insertPayload.sku, price: formData.price },
    });

    // Return newly created hydrated product
    const createdProduct = await this.getProductById(productId);
    if (!createdProduct) {
      throw new Error('Failed to retrieve product after creation.');
    }
    return createdProduct;
  },

  /**
   * Updates an existing product details.
   */
  async updateProduct(id: string, updates: Partial<ProductFormData>, adminId?: string): Promise<Sneaker> {
    if (!isSupabaseConfigured() || !id) {
      throw new Error('Supabase client is not configured or id missing');
    }

    const updatePayload: ProductUpdateRow = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.price !== undefined) updatePayload.price = Number(updates.price);
    if (updates.originalPrice !== undefined) updatePayload.original_price = Number(updates.originalPrice);
    if (updates.sku !== undefined) updatePayload.sku = updates.sku;
    if (updates.colorway !== undefined) updatePayload.colorway = updates.colorway;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.details !== undefined) updatePayload.details = updates.details;
    if (updates.tags !== undefined) updatePayload.tags = updates.tags;
    if (updates.isFeatured !== undefined) updatePayload.is_featured = updates.isFeatured;
    if (updates.isNewRelease !== undefined) updatePayload.is_new_release = updates.isNewRelease;

    const { error } = await supabase
      .from('products')
      .update(updatePayload as any)
      .eq('id', id);

    if (error) {
      console.error('[productAdminRepository.updateProduct] Error updating product:', error);
      throw error;
    }

    // Record audit log
    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'UPDATE',
      entityType: 'product',
      entityId: id,
      changes: updates,
    });

    const updated = await this.getProductById(id);
    if (!updated) {
      throw new Error(`Product with ID ${id} not found after update.`);
    }
    return updated;
  },

  /**
   * Deletes a product (soft delete by default, or hard delete if specified).
   */
  async deleteProduct(id: string, hardDelete: boolean = false, adminId?: string): Promise<void> {
    if (!isSupabaseConfigured() || !id) return;

    if (hardDelete) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('[productAdminRepository.deleteProduct] Hard delete error:', error);
        throw error;
      }
    } else {
      const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
      if (error) {
        console.error('[productAdminRepository.deleteProduct] Soft delete error:', error);
        throw error;
      }
    }

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'DELETE',
      entityType: 'product',
      entityId: id,
      changes: { hardDelete },
    });
  },

  /**
   * Adds images for a product.
   */
  async addProductImages(productId: string, images: string[], adminId?: string): Promise<void> {
    if (!isSupabaseConfigured() || !productId || images.length === 0) return;

    const rows = images.map((url, idx) => ({
      product_id: productId,
      image_url: url,
      angle_label: `angle-${idx + 1}`,
      display_order: idx + 1,
    }));

    const { error } = await supabase.from('product_images').insert(rows);
    if (error) throw error;

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'UPDATE',
      entityType: 'product',
      entityId: productId,
      changes: { addedImagesCount: images.length },
    });
  },

  /**
   * Removes a specific product image by ID.
   */
  async removeProductImage(imageId: string, adminId?: string): Promise<void> {
    if (!isSupabaseConfigured() || !imageId) return;

    const { error } = await supabase.from('product_images').delete().eq('id', imageId);
    if (error) throw error;

    await auditService.log({
      adminId: adminId || 'admin-system',
      actionType: 'DELETE',
      entityType: 'product',
      entityId: imageId,
      changes: { imageId },
    });
  },
};
