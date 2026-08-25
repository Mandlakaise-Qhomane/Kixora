import { Sneaker, SneakerSize } from '../../types';
import { ProductHydratedRow, mapProductRowToSneaker } from '../customer/productMapper';

export interface ProductFormData {
  name: string;
  brand?: string;
  category?: string;
  gender?: 'Men' | 'Women' | 'Unisex';
  price: number;
  originalPrice?: number;
  description?: string;
  colorway?: string;
  releaseYear?: number;
  sku?: string;
  story?: string;
  isVaultExclusive?: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  image?: string;
  gallery?: string[];
  sizes?: SneakerSize[];
  [key: string]: any;
}

export type ProductUpdateRow = Partial<{
  name: string;
  brand_id: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  description: string;
  story: string;
  colorway: string;
  release_year: number;
  sku: string;
  gender: 'Men' | 'Women' | 'Unisex';
  is_vault_exclusive: boolean;
  featured: boolean;
  is_featured: boolean;
  is_active: boolean;
  [key: string]: any;
}>;

export const mapProductFormToDbInsert = (form: ProductFormData, brandId?: string, categoryId?: string) => {
  return {
    name: form.name,
    slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    brand_id: brandId || (form as any).brand_id || null,
    category_id: categoryId || (form as any).category_id || null,
    price: Number(form.price),
    original_price: form.originalPrice ? Number(form.originalPrice) : null,
    description: form.description || '',
    story: form.story || '',
    colorway: form.colorway || '',
    release_year: form.releaseYear ? Number(form.releaseYear) : 2024,
    sku: form.sku || '',
    gender: form.gender || 'Men',
    is_vault_exclusive: Boolean(form.isVaultExclusive),
    featured: Boolean(form.isFeatured ?? form.featured),
    is_featured: Boolean(form.isFeatured ?? form.featured),
    is_active: true,
  };
};

export const mapAdminProductRowToSneaker = (row: ProductHydratedRow): Sneaker => {
  return mapProductRowToSneaker(row);
};

export const mapAdminProductRowsToSneakers = (rows: ProductHydratedRow[]): Sneaker[] => {
  return rows.map(mapAdminProductRowToSneaker);
};
