import { CartItem, CustomSneakerConfig } from '../../types';
import { mapProductRowToSneaker, ProductHydratedRow } from './productMapper';

export interface CartItemHydratedRow {
  id: string;
  cart_id?: string;
  product_id?: string;
  product_size_id?: string;
  size?: number;
  quantity: number;
  bespoke_design_id?: string | null;
  customization?: Record<string, any> | null;
  products?: ProductHydratedRow | null;
  product_sizes?: { id?: string; size_us?: number; size?: number; [key: string]: any } | null;
  bespoke_designs?: {
    id?: string;
    design_name?: string;
    design_snapshot?: Record<string, any> | null;
    [key: string]: any;
  } | null;
  [key: string]: any;
}

export const mapCartItemRowToCartItem = (row: CartItemHydratedRow): CartItem => {
  const selectedSize = Number(row.product_sizes?.size_us ?? row.product_sizes?.size ?? row.size ?? 9);

  const sneaker = row.products
    ? mapProductRowToSneaker(row.products)
    : {
        id: row.product_id || 'prod-default',
        name: 'Vault Sneaker',
        brand: 'Nike',
        category: 'High-Top',
        gender: 'Men' as const,
        price: 3999,
        description: '',
        image: '',
        images: [],
        gallery: [],
        sizes: [{ size: selectedSize, stock: 10 }],
        colorway: '',
        releaseYear: 2024,
        sku: '',
        story: '',
        rating: 5.0,
        reviewsCount: 0,
        salesCount: 0,
      };

  const customization = (row.bespoke_designs?.design_snapshot || row.customization) as CustomSneakerConfig | undefined;

  return {
    id: row.id,
    sneaker,
    selectedSize,
    quantity: row.quantity,
    customization: customization || undefined,
  };
};

export const mapCartRowsToCartItems = (rows: CartItemHydratedRow[]): CartItem[] => {
  return rows.map(mapCartItemRowToCartItem);
};
