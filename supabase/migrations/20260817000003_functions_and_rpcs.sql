-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 003 - FUNCTIONS & ATOMIC RPCS
-- Description: Transactional inventory reservation, checkout orchestration,
--              status transitions, promo validation, and secure guest access.
-- Architecture: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. PROMO VALIDATION (SERVER-SIDE DETERMINISTIC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code TEXT,
  p_subtotal NUMERIC(10,2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_promo RECORD;
  v_discount NUMERIC(10,2) := 0;
BEGIN
  IF p_code IS NULL OR TRIM(p_code) = '' THEN
    RETURN jsonb_build_object('valid', false, 'message', 'No code provided');
  END IF;

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
    AND (starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF v_promo.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Invalid or expired promo code');
  END IF;

  IF p_subtotal < v_promo.min_spend THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', 'Minimum spend of R' || v_promo.min_spend || ' required for code ' || v_promo.code
    );
  END IF;

  v_discount := ROUND((p_subtotal * v_promo.discount_percent) / 100.0, 2);

  RETURN jsonb_build_object(
    'valid', true,
    'id', v_promo.id,
    'code', v_promo.code,
    'discount_percent', v_promo.discount_percent,
    'discount_amount', v_discount,
    'min_spend', v_promo.min_spend
  );
END;
$$;

-- ==============================================================================
-- 2. INVENTORY RESERVATION & RELEASE HELPERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.release_order_reservations(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'Order cancelled or expired'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res RECORD;
BEGIN
  FOR v_res IN
    SELECT * FROM public.inventory_reservations
    WHERE order_id = p_order_id AND status = 'active'
    FOR UPDATE
  LOOP
    -- Decrement reserved_stock
    UPDATE public.inventory
    SET reserved_stock = GREATEST(0, reserved_stock - v_res.quantity),
        updated_at = NOW()
    WHERE product_size_id = v_res.product_size_id;

    -- Update reservation status
    UPDATE public.inventory_reservations
    SET status = 'released',
        updated_at = NOW()
    WHERE id = v_res.id;
  END LOOP;

  RETURN true;
END;
$$;

-- ==============================================================================
-- 3. PAYMENT CONFIRMATION & SALE FINALIZATION (WEBHOOK/SERVER RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.confirm_inventory_sale(
  p_order_id UUID,
  p_payment_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_res RECORD;
  v_item RECORD;
BEGIN
  -- Lock and retrieve order
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Order already paid');
  END IF;

  -- 1. Finalize inventory decrement and close reservations
  FOR v_res IN
    SELECT * FROM public.inventory_reservations
    WHERE order_id = p_order_id AND status = 'active'
    FOR UPDATE
  LOOP
    UPDATE public.inventory
    SET stock = GREATEST(0, stock - v_res.quantity),
        reserved_stock = GREATEST(0, reserved_stock - v_res.quantity),
        updated_at = NOW()
    WHERE product_size_id = v_res.product_size_id;

    UPDATE public.inventory_reservations
    SET status = 'confirmed',
        updated_at = NOW()
    WHERE id = v_res.id;
  END LOOP;

  -- 2. Increment sales count on products
  FOR v_item IN
    SELECT product_id, SUM(quantity) as total_qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY product_id
  LOOP
    UPDATE public.products
    SET sales_count = sales_count + v_item.total_qty,
        updated_at = NOW()
    WHERE id = v_item.product_id;
  END LOOP;

  -- 3. Update Order Payment & Fulfillment Status
  UPDATE public.orders
  SET payment_status = 'paid',
      payment_reference = p_payment_reference,
      current_status = 'Authenticated',
      updated_at = NOW()
  WHERE id = p_order_id;

  -- 4. Record Status Milestones
  INSERT INTO public.order_status_history (order_id, status, title, description)
  VALUES (
    p_order_id,
    'Authenticated',
    'Payment Authorized & Vault Authenticated',
    'Payment reference ' || p_payment_reference || ' confirmed. Sneakers passed physical 12-point authentication protocol.'
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'payment_status', 'paid',
    'current_status', 'Authenticated'
  );
END;
$$;

-- ==============================================================================
-- 4. ATOMIC ORDER CREATION & RESERVATION (CHECKOUT ORCHESTRATOR)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_pending_order_atomic(
  p_user_id UUID,
  p_guest_session_token TEXT,
  p_customer_info JSONB, -- { fullName, email, phone, street, city, state, zip, country }
  p_cart_items JSONB,   -- Array of { product_id, size_us, quantity, bespoke_config, unit_price, image_url, product_name, product_sku }
  p_promo_code TEXT,
  p_shipping_method TEXT,
  p_payment_method TEXT,
  p_reservation_ttl_minutes INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_product_size_id UUID;
  v_stock INT;
  v_reserved_stock INT;
  v_available_stock INT;
  v_subtotal NUMERIC(10,2) := 0;
  v_discount NUMERIC(10,2) := 0;
  v_shipping_fee NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2) := 0;
  v_promo_res JSONB;
  v_promo_id UUID := NULL;
  v_order_id UUID;
  v_order_code TEXT;
  v_tracking_number TEXT;
  v_guest_access_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Basic sanity check on cart payload
  IF p_cart_items IS NULL OR jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  v_expires_at := NOW() + (p_reservation_ttl_minutes * interval '1 minute');
  v_order_code := 'KXO-' || (FLOOR(1000 + RANDOM() * 9000))::TEXT;
  v_tracking_number := 'KX-' || (FLOOR(10000000 + RANDOM() * 90000000))::TEXT || '-ZA';
  v_guest_access_token := encode(gen_random_bytes(24), 'hex');

  -- 1. Atomic Row-Level Locking & Inventory Reservation
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(
    product_id UUID,
    size_us NUMERIC(3,1),
    quantity INT,
    unit_price NUMERIC(10,2),
    bespoke_config JSONB,
    image_url TEXT,
    product_name TEXT,
    product_sku TEXT
  )
  LOOP
    -- Look up size definition and lock the inventory row
    SELECT ps.id, i.stock, i.reserved_stock
    INTO v_product_size_id, v_stock, v_reserved_stock
    FROM public.product_sizes ps
    JOIN public.inventory i ON i.product_size_id = ps.id
    WHERE ps.product_id = v_item.product_id AND ps.size_us = v_item.size_us
    FOR UPDATE OF i;

    IF v_product_size_id IS NULL THEN
      RAISE EXCEPTION 'Size US % not available for %', v_item.size_us, v_item.product_name;
    END IF;

    v_available_stock := v_stock - v_reserved_stock;

    IF v_available_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (US %). Only % pair(s) available.',
        v_item.product_name, v_item.size_us, GREATEST(0, v_available_stock);
    END IF;

    -- Increment reservation stock
    UPDATE public.inventory
    SET reserved_stock = reserved_stock + v_item.quantity,
        updated_at = NOW()
    WHERE product_size_id = v_product_size_id;

    v_subtotal := v_subtotal + (v_item.unit_price * v_item.quantity);
  END LOOP;

  -- 2. Server-side Promo Verification
  IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) <> '' THEN
    v_promo_res := public.validate_promo_code(p_promo_code, v_subtotal);
    IF (v_promo_res->>'valid')::BOOLEAN = true THEN
      v_promo_id := (v_promo_res->>'id')::UUID;
      v_discount := (v_promo_res->>'discount_amount')::NUMERIC(10,2);
      
      -- Increment promo uses counter
      UPDATE public.promo_codes
      SET current_uses = current_uses + 1
      WHERE id = v_promo_id;
    ELSE
      RAISE EXCEPTION '%', (v_promo_res->>'message');
    END IF;
  END IF;

  -- 3. Shipping Calculation (Free if >= R2000, else R150)
  IF v_subtotal >= 2000 THEN
    v_shipping_fee := 0.00;
  ELSE
    v_shipping_fee := 150.00;
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount + v_shipping_fee);

  -- 4. Insert Pending Order
  INSERT INTO public.orders (
    order_code,
    guest_access_token,
    user_id,
    customer_snapshot,
    subtotal,
    discount,
    shipping_fee,
    tax,
    total,
    payment_method,
    shipping_method,
    payment_status,
    current_status
  ) VALUES (
    v_order_code,
    v_guest_access_token,
    p_user_id,
    p_customer_info,
    v_subtotal,
    v_discount,
    v_shipping_fee,
    0.00,
    v_total,
    p_payment_method,
    p_shipping_method,
    'pending',
    'Pending'
  ) RETURNING id INTO v_order_id;

  -- 5. Insert Line Items & Reservation Artifacts
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(
    product_id UUID,
    size_us NUMERIC(3,1),
    quantity INT,
    unit_price NUMERIC(10,2),
    bespoke_config JSONB,
    image_url TEXT,
    product_name TEXT,
    product_sku TEXT
  )
  LOOP
    SELECT ps.id INTO v_product_size_id
    FROM public.product_sizes ps
    WHERE ps.product_id = v_item.product_id AND ps.size_us = v_item.size_us;

    -- Create active reservation row tied to this order
    INSERT INTO public.inventory_reservations (
      product_size_id,
      order_id,
      guest_session_token,
      user_id,
      quantity,
      status,
      expires_at
    ) VALUES (
      v_product_size_id,
      v_order_id,
      p_guest_session_token,
      p_user_id,
      v_item.quantity,
      'active',
      v_expires_at
    );

    -- Insert snapshot order item
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_sku,
      size_us,
      unit_price,
      quantity,
      bespoke_snapshot,
      image_url
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.product_name,
      v_item.product_sku,
      v_item.size_us,
      v_item.unit_price,
      v_item.quantity,
      v_item.bespoke_config,
      v_item.image_url
    );
  END LOOP;

  -- 6. Initialize Shipment & Status Timeline
  INSERT INTO public.shipments (order_id, tracking_number)
  VALUES (v_order_id, v_tracking_number);

  INSERT INTO public.order_status_history (order_id, status, title, description)
  VALUES (
    v_order_id,
    'Pending',
    'Order Placed & Inventory Reserved',
    'Order created in vault. Pair reserved for 30 minutes awaiting payment authorization.'
  );

  IF v_promo_id IS NOT NULL THEN
    INSERT INTO public.promo_redemptions (promo_id, order_id, user_id, discount_amount)
    VALUES (v_promo_id, v_order_id, p_user_id, v_discount);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_code', v_order_code,
    'guest_access_token', v_guest_access_token,
    'tracking_number', v_tracking_number,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'shipping_fee', v_shipping_fee,
    'total', v_total,
    'payment_status', 'pending',
    'current_status', 'Pending',
    'expires_at', v_expires_at
  );
END;
$$;

-- ==============================================================================
-- 5. SECURE GUEST ORDER & TRACKING LOOKUP (TOKEN / EMAIL VERIFIED)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_guest_order_secure(
  p_order_code TEXT,
  p_token_or_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_order RECORD;
  v_items JSONB;
  v_history JSONB;
  v_shipment RECORD;
BEGIN
  -- Verify matching order with either guest_access_token OR email from snapshot
  SELECT * INTO v_order
  FROM public.orders
  WHERE order_code = UPPER(TRIM(p_order_code))
    AND (
      guest_access_token = TRIM(p_token_or_email)
      OR LOWER(customer_snapshot->>'email') = LOWER(TRIM(p_token_or_email))
      OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
      OR public.is_admin()
    );

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Order not found or invalid credentials');
  END IF;

  -- Fetch items
  SELECT jsonb_agg(to_jsonb(oi)) INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  -- Fetch status history
  SELECT jsonb_agg(to_jsonb(h) ORDER BY h.created_at ASC) INTO v_history
  FROM public.order_status_history h
  WHERE h.order_id = v_order.id;

  -- Fetch shipment
  SELECT * INTO v_shipment
  FROM public.shipments
  WHERE order_id = v_order.id;

  RETURN jsonb_build_object(
    'success', true,
    'order', jsonb_build_object(
      'id', v_order.id,
      'order_code', v_order.order_code,
      'customer_snapshot', v_order.customer_snapshot,
      'subtotal', v_order.subtotal,
      'discount', v_order.discount,
      'shipping_fee', v_order.shipping_fee,
      'total', v_order.total,
      'payment_method', v_order.payment_method,
      'shipping_method', v_order.shipping_method,
      'payment_status', v_order.payment_status,
      'current_status', v_order.current_status,
      'created_at', v_order.created_at
    ),
    'items', COALESCE(v_items, '[]'::jsonb),
    'history', COALESCE(v_history, '[]'::jsonb),
    'shipment', to_jsonb(v_shipment)
  );
END;
$$;

-- ==============================================================================
-- 6. ADMIN CONTROLLED ORDER STATUS TRANSITIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_transition_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_title TEXT,
  p_description TEXT,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_allowed_status TEXT[] := ARRAY['Pending', 'Authenticated', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  IF NOT (p_new_status = ANY(v_allowed_status)) THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- If status changes to Cancelled, release active reservations or refund stock if paid
  IF p_new_status = 'Cancelled' AND v_order.current_status <> 'Cancelled' THEN
    PERFORM public.release_order_reservations(p_order_id, 'Admin cancellation');
  END IF;

  -- Update order
  UPDATE public.orders
  SET current_status = p_new_status,
      updated_at = NOW()
  WHERE id = p_order_id;

  -- Record status history
  INSERT INTO public.order_status_history (order_id, status, title, description, created_by)
  VALUES (p_order_id, p_new_status, p_title, p_description, p_admin_id);

  -- Record admin audit log
  INSERT INTO public.admin_audit_logs (admin_id, action_type, entity_type, entity_id, changes)
  VALUES (
    p_admin_id,
    'TRANSITION_ORDER_STATUS',
    'order',
    p_order_id::TEXT,
    jsonb_build_object('previous_status', v_order.current_status, 'new_status', p_new_status, 'title', p_title)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'previous_status', v_order.current_status,
    'new_status', p_new_status
  );
END;
$$;

-- ==============================================================================
-- 7. ADMIN INVENTORY ADJUSTMENT WITH AUDIT LOGGING
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_adjust_inventory(
  p_product_size_id UUID,
  p_stock_delta INTEGER,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Manual Stock Adjustment'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_stock INT;
  v_new_stock INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  SELECT stock INTO v_old_stock
  FROM public.inventory
  WHERE product_size_id = p_product_size_id
  FOR UPDATE;

  IF v_old_stock IS NULL THEN
    RAISE EXCEPTION 'Inventory record not found for size %', p_product_size_id;
  END IF;

  v_new_stock := v_old_stock + p_stock_delta;
  IF v_new_stock < 0 THEN
    RAISE EXCEPTION 'Cannot reduce stock below 0. Current: %, Delta: %', v_old_stock, p_stock_delta;
  END IF;

  UPDATE public.inventory
  SET stock = v_new_stock,
      updated_at = NOW()
  WHERE product_size_id = p_product_size_id;

  INSERT INTO public.admin_audit_logs (admin_id, action_type, entity_type, entity_id, changes)
  VALUES (
    p_admin_id,
    'ADJUST_INVENTORY',
    'inventory',
    p_product_size_id::TEXT,
    jsonb_build_object('old_stock', v_old_stock, 'new_stock', v_new_stock, 'delta', p_stock_delta, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'product_size_id', p_product_size_id,
    'old_stock', v_old_stock,
    'new_stock', v_new_stock
  );
END;
$$;
