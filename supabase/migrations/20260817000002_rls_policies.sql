-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 002 - ROW LEVEL SECURITY POLICIES
-- Description: Enables RLS across all tables with granular RBAC rules.
-- Architecture: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. SECURITY HELPER FUNCTIONS (DEFINER CONTEXT)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  -- Extract role from JWT app_metadata or fallback to profile lookup
  RETURN COALESCE(
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> 'role'),
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'anon'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN 'anon';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_auth_role() IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_auth_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 2. ENABLE RLS ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bespoke_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. PROFILES POLICIES
-- ==============================================================================
CREATE POLICY "Public profiles are viewable by owner or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own personal info (excluding role)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_super_admin())
  WITH CHECK (
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_super_admin()
  );

-- ==============================================================================
-- 4. BRANDS & CATEGORIES POLICIES
-- ==============================================================================
CREATE POLICY "Brands are publicly readable"
  ON public.brands FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage brands"
  ON public.brands FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. PRODUCTS & CATALOG POLICIES
-- ==============================================================================
CREATE POLICY "Active products are publicly readable"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Product images are publicly readable"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Product sizes are publicly readable"
  ON public.product_sizes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product sizes"
  ON public.product_sizes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 6. INVENTORY POLICIES
-- ==============================================================================
CREATE POLICY "Inventory is publicly viewable"
  ON public.inventory FOR SELECT
  USING (true);

CREATE POLICY "Only admins can directly alter inventory"
  ON public.inventory FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Inventory reservations are viewable by owner or admin"
  ON public.inventory_reservations FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Reservations managed by RPC or Admin only"
  ON public.inventory_reservations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. WISHLISTS & BESPOKE POLICIES
-- ==============================================================================
CREATE POLICY "Users can manage own wishlist"
  ON public.wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Bespoke designs viewable by creator or admin"
  ON public.bespoke_designs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

CREATE POLICY "Users or guests can create bespoke designs"
  ON public.bespoke_designs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own bespoke designs"
  ON public.bespoke_designs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 8. CARTS & CART ITEMS POLICIES
-- ==============================================================================
CREATE POLICY "Users can manage own authenticated cart"
  ON public.carts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cart items accessible via authorized cart"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND c.user_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND c.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ==============================================================================
-- 9. PROMO CODES POLICIES
-- ==============================================================================
CREATE POLICY "Active promo codes are viewable"
  ON public.promo_codes FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Promo redemptions viewable by owner or admin"
  ON public.promo_redemptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 10. ORDERS & HISTORICAL ARTIFACTS POLICIES
-- ==============================================================================
CREATE POLICY "Users view own orders or Admin views all"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Direct client INSERT into orders is disabled; MUST use place_order_atomic RPC
CREATE POLICY "Direct order insert disabled"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update order status or metadata"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Order items viewable by order owner or admin"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Order status history viewable by order owner or admin"
  ON public.order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Shipments viewable by order owner or admin"
  ON public.shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = shipments.order_id
        AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins can manage shipments"
  ON public.shipments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 11. DROPS & RAFFLES POLICIES
-- ==============================================================================
CREATE POLICY "Active drops are publicly viewable"
  ON public.drops FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage drops"
  ON public.drops FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users view own raffle entries or Admin views all"
  ON public.raffle_entries FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can enter raffles"
  ON public.raffle_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage raffle winners"
  ON public.raffle_entries FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 12. ADMIN AUDIT LOGS POLICIES
-- ==============================================================================
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Audit logs insertion by triggers or admins"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin());
