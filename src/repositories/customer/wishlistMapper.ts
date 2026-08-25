import { Sneaker } from '../../types';
import { mapProductRowToSneaker, mapProductRowsToSneakers, ProductHydratedRow } from './productMapper';

export interface WishlistHydratedRow {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products?: ProductHydratedRow | null;
  [key: string]: any;
}

export const mapWishlistRowToSneaker = (row: WishlistHydratedRow): Sneaker | null => {
  if (!row.products) return null;
  return mapProductRowToSneaker(row.products);
};

export const mapWishlistRowsToSneakers = (rows: WishlistHydratedRow[]): Sneaker[] => {
  const validProducts = rows
    .map(r => r.products)
    .filter((p): p is ProductHydratedRow => Boolean(p));
  return mapProductRowsToSneakers(validProducts);
};
