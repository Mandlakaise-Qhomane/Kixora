import { Database } from './database';

type Tables = Database['public']['Tables'];

// Core Entities (Row types)
export type Profile = Tables['profiles']['Row'];
export type Brand = Tables['brands']['Row'];
export type Category = Tables['categories']['Row'];
export type Product = Tables['products']['Row'];
export type ProductImage = Tables['product_images']['Row'];
export type ProductSize = Tables['product_sizes']['Row'];
export type Inventory = Tables['inventory']['Row'];
export type Cart = Tables['carts']['Row'];
export type CartItem = Tables['cart_items']['Row'];
export type PromoCode = Tables['promo_codes']['Row'];
export type Order = Tables['orders']['Row'];
export type OrderItem = Tables['order_items']['Row'];
export type OrderStatusHistory = Tables['order_status_history']['Row'];
export type Drop = Tables['drops']['Row'];
export type BespokeDesign = Tables['bespoke_designs']['Row'];

// Composite/Domain Types
export type ProductWithDetails = Product & {
  brand?: Brand;
  category?: Category;
  images: ProductImage[];
  sizes: (ProductSize & { inventory?: Inventory[] })[];
};

export type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product;
    product_size: ProductSize;
    bespoke_design?: BespokeDesign | null;
  })[];
};

export type OrderWithDetails = Order & {
  items: OrderItem[];
  status_history: OrderStatusHistory[];
};

export type CheckoutSession = {
  cart: CartWithItems;
  promoCode?: PromoCode | null;
  guestToken?: string;
};
