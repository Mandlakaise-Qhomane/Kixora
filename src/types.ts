export type Brand = 
  | 'Nike' 
  | 'Jordan' 
  | 'Adidas' 
  | 'Puma'
  | 'New Balance' 
  | 'Vans'
  | 'Converse'
  | 'Travis Scott'
  | 'Asics' 
  | 'Off-White';

export type Category = 
  | 'All'
  | 'Lifestyle' 
  | 'High-Top' 
  | 'Low-Top'
  | 'Basketball' 
  | 'Running' 
  | 'Limited Edition' 
  | 'Retro';

export interface SneakerSize {
  size: number; // US sizing e.g. 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, 13
  stock: number;
}

export interface Sneaker {
  id: string;
  name: string;
  brand: Brand;
  category: Category;
  gender: 'Men' | 'Women' | 'Unisex';
  price: number; // Stored as standard value, formatted with R prefix (e.g. R2,999.00)
  originalPrice?: number;
  sku: string;
  colorway: string;
  releaseDate: string;
  description: string;
  details: string[];
  images: string[];
  sizes: SneakerSize[];
  rating: number;
  reviewsCount: number;
  isNewRelease?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  tags: string[];
  salesCount?: number;
}

export interface CartItem {
  id: string;
  sneaker: Sneaker;
  selectedSize: number;
  quantity: number;
  customization?: CustomSneakerConfig;
}

export interface CustomSneakerConfig {
  baseModel: string;
  baseColor: string;
  accentColor: string;
  soleColor: string;
  lacesColor: string;
  liningColor: string;
  customText: string;
}

export type OrderStatus = 
  | 'Pending' 
  | 'Authenticated' 
  | 'Processing' 
  | 'Shipped' 
  | 'Delivered' 
  | 'Cancelled';

export interface OrderMilestone {
  title: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface Order {
  id: string;
  trackingNumber: string;
  createdAt: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  shippingMethod: string;
  timeline: OrderMilestone[];
}

export interface Drop {
  id: string;
  sneakerName: string;
  brand: Brand;
  price: number;
  releaseTime: string;
  image: string;
  hypeLevel: 'EXTREME' | 'HIGH' | 'GRAIL' | 'LIMITED';
  type: 'Shock Drop' | 'Raffle Draw' | 'Vault Exclusive' | 'General Release';
  description: string;
  subscribersCount: number;
  isNotified?: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  minSpend?: number;
  description: string;
  isActive: boolean;
}

export interface FilterState {
  brand: Brand | 'All';
  category: Category;
  gender: 'All' | 'Men' | 'Women' | 'Unisex';
  maxPrice: number;
  selectedSize: number | null;
  inStockOnly: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  search: string;
}

export type ViewMode = 
  | 'store' 
  | 'shop'
  | 'new-releases'
  | 'brands'
  | 'about'
  | 'drops' 
  | 'customizer' 
  | 'tracking' 
  | 'admin';
