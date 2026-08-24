-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 001 - INITIAL SCHEMA
-- Description: Core tables, constraints, foreign keys, indexes, and triggers.
-- Architecture: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. UTILITY TRIGGERS & FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. USERS & PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  full_name TEXT,
  phone TEXT,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. BRANDS & CATEGORIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PRODUCTS & ASSETS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  gender TEXT NOT NULL DEFAULT 'Unisex' CHECK (gender IN ('Men', 'Women', 'Unisex')),
  sku TEXT NOT NULL UNIQUE,
  colorway TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(10,2) CHECK (original_price IS NULL OR original_price >= price),
  release_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  details TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating BETWEEN 0 AND 5),
  reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  sales_count INTEGER NOT NULL DEFAULT 0 CHECK (sales_count >= 0),
  is_new_release BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Multi-angle 3D Perspective Images
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  angle_label TEXT NOT NULL DEFAULT 'Side Profile',
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, display_order);

-- Product Sizes (US Sizing Matrix)
CREATE TABLE IF NOT EXISTS public.product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size_us NUMERIC(3,1) NOT NULL CHECK (size_us > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_size UNIQUE (product_id, size_us)
);

CREATE INDEX IF NOT EXISTS idx_product_sizes_product ON public.product_sizes(product_id);

-- ==============================================================================
-- 5. INVENTORY & CONCURRENT RESERVATION SUBSYSTEM
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_size_id UUID NOT NULL UNIQUE REFERENCES public.product_sizes(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_stock_reservations CHECK (reserved_stock <= stock)
);

CREATE INDEX IF NOT EXISTS idx_inventory_size ON public.inventory(product_size_id);

CREATE TRIGGER set_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Active / Expired Inventory Reservations
CREATE TABLE IF NOT EXISTS public.inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_size_id UUID NOT NULL REFERENCES public.product_sizes(id) ON DELETE CASCADE,
  order_id UUID, -- Tied when order checkout initiates
  guest_session_token TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'released', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_status_expires ON public.inventory_reservations(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_size ON public.inventory_reservations(product_size_id);

CREATE TRIGGER set_reservations_updated_at
  BEFORE UPDATE ON public.inventory_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. WISHLIST, CARTS & BESPOKE STUDIO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_product_wishlist UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

CREATE TABLE IF NOT EXISTS public.bespoke_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guest_session_token TEXT,
  base_model TEXT NOT NULL DEFAULT 'Air Jordan 1 High OG',
  base_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  sole_color TEXT NOT NULL,
  laces_color TEXT NOT NULL,
  lining_color TEXT NOT NULL,
  custom_text VARCHAR(20) NOT NULL DEFAULT '',
  preview_thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_session_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cart_owner CHECK (user_id IS NOT NULL OR guest_session_token IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_carts_user ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_guest ON public.carts(guest_session_token);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_size_id UUID NOT NULL REFERENCES public.product_sizes(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  bespoke_design_id UUID REFERENCES public.bespoke_designs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cart_item_entry UNIQUE (cart_id, product_size_id, bespoke_design_id)
);

CREATE TRIGGER set_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. PROMO CODES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  min_spend NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (min_spend >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. ORDERS, SNAPSHOTS, SHIPMENTS & STATUS HISTORY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE, -- e.g., 'KXO-9284'
  guest_access_token TEXT NOT NULL, -- Secure hash/token for unauthenticated guest tracking lookup
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_snapshot JSONB NOT NULL, -- Full customer info snapshot at moment of purchase
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
  tax NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL,
  shipping_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_reference TEXT,
  current_status TEXT NOT NULL DEFAULT 'Pending' CHECK (current_status IN ('Pending', 'Authenticated', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(current_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Fixed Historical Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  size_us NUMERIC(3,1) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  bespoke_snapshot JSONB,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- Immutable Order Status History
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id, created_at ASC);

-- Shipments & Live Couriers
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL UNIQUE,
  carrier TEXT NOT NULL DEFAULT 'Vault Priority Express',
  nfc_security_tag_id TEXT UNIQUE,
  dispatched_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);

-- Promo Redemptions Tracking
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  discount_amount NUMERIC(10,2) NOT NULL CHECK (discount_amount >= 0),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. DROPS & RAFFLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sneaker_name TEXT NOT NULL,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  release_time TIMESTAMPTZ NOT NULL,
  image_url TEXT NOT NULL,
  hype_level TEXT NOT NULL CHECK (hype_level IN ('EXTREME', 'HIGH', 'GRAIL', 'LIMITED')),
  drop_type TEXT NOT NULL CHECK (drop_type IN ('Shock Drop', 'Raffle Draw', 'Vault Exclusive', 'General Release')),
  description TEXT NOT NULL,
  subscribers_count INTEGER NOT NULL DEFAULT 0 CHECK (subscribers_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drops_release ON public.drops(release_time, is_active);

CREATE TABLE IF NOT EXISTS public.raffle_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_size NUMERIC(3,1),
  is_winner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_drop_user_raffle UNIQUE (drop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_raffle_entries_drop ON public.raffle_entries(drop_id);

-- ==============================================================================
-- 10. ADMIN AUDIT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL, -- e.g. 'UPDATE_INVENTORY', 'TRANSITION_ORDER_STATUS', 'UPDATE_PRODUCT'
  entity_type TEXT NOT NULL, -- e.g. 'inventory', 'order', 'product', 'promo'
  entity_id TEXT NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON public.admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON public.admin_audit_logs(entity_type, entity_id);
