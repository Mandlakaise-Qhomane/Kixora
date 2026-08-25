-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 0009 - FUNCTIONS, RPCS & SECURITY TRIGGERS
-- Description: Atomic order placement, inventory locking, status transitions,
--              promo validation, guest order verification, and integrity guards.
-- ==============================================================================

-- ==============================================================================
-- 1. SECURITY HELPER FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
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
-- 2. PROMO VALIDATION (SERVER-SIDE DETERMINISTIC)
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
-- 3. ATOMIC DIRECT ORDER PLACEMENT & INVENTORY REDUCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_user_id UUID,
  p_guest_session_token TEXT,
  p_customer_info JSONB,
  p_cart_items JSONB,
  p_promo_code TEXT DEFAULT NULL,
  p_shipping_method TEXT DEFAULT 'Express Vault Courier',
  p_payment_method TEXT DEFAULT 'Credit / Debit Card',
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_product_size_id UUID;
  v_product_name TEXT;
  v_product_sku TEXT;
  v_server_price NUMERIC(10,2);
  v_image_url TEXT;
  v_stock INT;
  v_reserved_stock INT;
  v_available_stock INT;
  v_subtotal NUMERIC(10,2) := 0;
  v_discount NUMERIC(10,2) := 0;
  v_shipping_fee NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2) := 0;
  v_promo RECORD;
  v_promo_id UUID := NULL;
  v_order_id UUID;
  v_order_code TEXT;
  v_tracking_number TEXT;
  v_guest_access_token TEXT;
  v_resolved_user_id UUID;
BEGIN
  IF p_cart_items IS NULL OR jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'Cart cannot be empty';
  END IF;

  -- Resolve authenticated user
  IF auth.uid() IS NOT NULL THEN
    v_resolved_user_id := auth.uid();
  ELSE
    v_resolved_user_id := p_user_id;
  END IF;

  -- 1. Collision-Free Order Code Generation
  LOOP
    v_order_code := 'KXO-' || LPAD((FLOOR(1000 + RANDOM() * 9000))::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_code = v_order_code);
  END LOOP;

  -- 2. Collision-Free Tracking Number Generation
  LOOP
    v_tracking_number := 'KX-' || LPAD((FLOOR(10000000 + RANDOM() * 90000000))::TEXT, 8, '0') || '-ZA';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.shipments WHERE tracking_number = v_tracking_number);
  END LOOP;

  v_guest_access_token := encode(gen_random_bytes(24), 'hex');

  -- 3. Lock Inventory Rows & Validate Available Stock Server-Side
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(
    product_id UUID,
    size_us NUMERIC(3,1),
    quantity INT,
    bespoke_config JSONB
  )
  LOOP
    SELECT ps.id, p.name, p.sku, p.price,
           COALESCE(
             (SELECT pi.image_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC LIMIT 1),
             'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85'
           ) AS image_url,
           i.stock, i.reserved_stock
    INTO v_product_size_id, v_product_name, v_product_sku, v_server_price, v_image_url, v_stock, v_reserved_stock
    FROM public.product_sizes ps
    JOIN public.products p ON p.id = ps.product_id
    JOIN public.inventory i ON i.product_size_id = ps.id
    WHERE ps.product_id = v_item.product_id AND ps.size_us = v_item.size_us
    FOR UPDATE OF i;

    IF v_product_size_id IS NULL THEN
      RAISE EXCEPTION 'Product size US % not found for product %', v_item.size_us, v_item.product_id;
    END IF;

    v_available_stock := v_stock - v_reserved_stock;
    IF v_available_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (US %). Only % pair(s) available.',
        v_product_name, v_item.size_us, GREATEST(0, v_available_stock);
    END IF;

    -- Directly decrement inventory
    UPDATE public.inventory
    SET stock = stock - v_item.quantity,
        updated_at = NOW()
    WHERE product_size_id = v_product_size_id;

    -- Increment product sales count
    UPDATE public.products
    SET sales_count = sales_count + v_item.quantity,
        updated_at = NOW()
    WHERE id = v_item.product_id;

    v_subtotal := v_subtotal + (v_server_price * v_item.quantity);
  END LOOP;

  -- 4. Server-Side Promo Code Validation with Concurrency Lock
  IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) <> '' THEN
    SELECT * INTO v_promo
    FROM public.promo_codes
    WHERE code = UPPER(TRIM(p_promo_code))
    FOR UPDATE;

    IF v_promo.id IS NULL OR NOT v_promo.is_active
       OR (v_promo.starts_at > NOW())
       OR (v_promo.expires_at IS NOT NULL AND v_promo.expires_at <= NOW())
       OR (v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses) THEN
      RAISE EXCEPTION 'Promo code % is invalid or expired', p_promo_code;
    END IF;

    IF v_subtotal < v_promo.min_spend THEN
      RAISE EXCEPTION 'Minimum spend of R% required for code %', v_promo.min_spend, v_promo.code;
    END IF;

    v_promo_id := v_promo.id;
    v_discount := ROUND((v_subtotal * v_promo.discount_percent) / 100.0, 2);

    UPDATE public.promo_codes
    SET current_uses = current_uses + 1
    WHERE id = v_promo_id;
  END IF;

  -- 5. Shipping Fee Calculation (Free if >= R2000, else R150)
  IF v_subtotal >= 2000.00 THEN
    v_shipping_fee := 0.00;
  ELSE
    v_shipping_fee := 150.00;
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount + v_shipping_fee);

  -- 6. Insert Order
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
    payment_reference,
    current_status
  ) VALUES (
    v_order_code,
    v_guest_access_token,
    v_resolved_user_id,
    p_customer_info,
    v_subtotal,
    v_discount,
    v_shipping_fee,
    0.00,
    v_total,
    p_payment_method,
    p_shipping_method,
    CASE WHEN p_payment_reference IS NOT NULL THEN 'paid' ELSE 'pending' END,
    p_payment_reference,
    CASE WHEN p_payment_reference IS NOT NULL THEN 'Authenticated' ELSE 'Pending' END
  ) RETURNING id INTO v_order_id;

  -- 7. Insert Order Line Items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(
    product_id UUID,
    size_us NUMERIC(3,1),
    quantity INT,
    bespoke_config JSONB
  )
  LOOP
    SELECT ps.id, p.name, p.sku, p.price,
           COALESCE(
             (SELECT pi.image_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC LIMIT 1),
             'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85'
           ) AS image_url
    INTO v_product_size_id, v_product_name, v_product_sku, v_server_price, v_image_url
    FROM public.product_sizes ps
    JOIN public.products p ON p.id = ps.product_id
    WHERE ps.product_id = v_item.product_id AND ps.size_us = v_item.size_us;

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
      v_product_name,
      v_product_sku,
      v_item.size_us,
      v_server_price,
      v_item.quantity,
      v_item.bespoke_config,
      v_image_url
    );
  END LOOP;

  -- 8. Insert Shipment
  INSERT INTO public.shipments (order_id, tracking_number)
  VALUES (v_order_id, v_tracking_number);

  -- 9. Insert Status History Timeline
  INSERT INTO public.order_status_history (order_id, status, title, description)
  VALUES (
    v_order_id,
    CASE WHEN p_payment_reference IS NOT NULL THEN 'Authenticated' ELSE 'Pending' END,
    CASE WHEN p_payment_reference IS NOT NULL THEN 'Payment Confirmed & Verified' ELSE 'Order Placed' END,
    CASE WHEN p_payment_reference IS NOT NULL THEN 'Payment validated. Authenticated by 12-point vault protocol.' ELSE 'Order received. Stock allocated in vault.' END
  );

  -- 10. Record Promo Redemption if Applicable
  IF v_promo_id IS NOT NULL THEN
    INSERT INTO public.promo_redemptions (promo_id, order_id, user_id, discount_amount)
    VALUES (v_promo_id, v_order_id, v_resolved_user_id, v_discount);
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
    'payment_status', CASE WHEN p_payment_reference IS NOT NULL THEN 'paid' ELSE 'pending' END,
    'current_status', CASE WHEN p_payment_reference IS NOT NULL THEN 'Authenticated' ELSE 'Pending' END
  );
END;
$$;

-- ==============================================================================
-- 4. PENDING ORDER CREATION (RESERVATION SUBSYSTEM)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_pending_order_atomic(
  p_user_id UUID,
  p_guest_session_token TEXT,
  p_customer_info JSONB,
  p_cart_items JSONB,
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
  v_product_name TEXT;
  v_product_sku TEXT;
  v_server_price NUMERIC(10,2);
  v_image_url TEXT;
  v_stock INT;
  v_reserved_stock INT;
  v_available_stock INT;
  v_subtotal NUMERIC(10,2) := 0;
  v_discount NUMERIC(10,2) := 0;
  v_shipping_fee NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2) := 0;
  v_promo RECORD;
  v_promo_id UUID := NULL;
  v_order_id UUID;
  v_order_code TEXT;
  v_tracking_number TEXT;
  v_guest_access_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_resolved_user_id UUID;
BEGIN
  IF p_cart_items IS NULL OR jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    v_resolved_user_id := auth.uid();
  ELSE
    v_resolved_user_id := p_user_id;
  END IF;

  v_expires_at := NOW() + (p_reservation_ttl_minutes * interval '1 minute');

  LOOP
    v_order_code := 'KXO-' || LPAD((FLOOR(1000 + RANDOM() * 9000))::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_code = v_order_code);
  END LOOP;

  LOOP
    v_tracking_number := 'KX-' || LPAD((FLOOR(10000000 + RANDOM() * 90000000))::TEXT, 8, '0') || '-ZA';
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.shipments WHERE tracking_number = v_tracking_number);
  END LOOP;

  v_guest_access_token := encode(gen_random_bytes(24), 'hex');

  -- 1. Atomic Row-Level Locking & Reservation
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(
    product_id UUID,
    size_us NUMERIC(3,1),
    quantity INT,
    bespoke_config JSONB
  )
  LOOP
    SELECT ps.id, p.name, p.sku, p.price,
           COALESCE(
             (SELECT pi.image_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC LIMIT 1),
             'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85'
           ) AS image_url,
           i.stock, i.reserved_stock
    INTO v_product_size_id, v_product_name, v_product_sku, v_server_price, v_image_url, v_stock, v_reserved_stock
    FROM public.product_sizes ps
    JOIN public.products p ON p.id = ps.product_id
    JOIN public.inventory i ON i.product_size_id = ps.id
    WHERE ps.product_id = v_item.product_id AND ps.size_us = v_item.size_us
    FOR UPDATE OF i;

    IF v_product_size_id IS NULL THEN
      RAISE EXCEPTION 'Size US % not available for product %', v_item.size_us, v_item.product_id;
    END IF;

    v_available_stock := v_stock - v_reserved_stock;
    IF v_available_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (US %). Only % pair(s) available.',
        v_product_name, v_item.size_us, GREATEST(0, v_available_stock);
    END IF;

    UPDATE public.inventory
    SET reserved_stock = reserved_stock + v_item.quantity,
        updated_at = NOW()
    WHERE product_size_id = v_product_size_id;

    v_subtotal := v_subtotal + (v_server_price * v_item.quantity);
  END LOOP;

  -- 2. Promo Validation
  IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) <> '' THEN
    SELECT * INTO v_promo
    FROM public.promo_codes
    WHERE code = UPPER(TRIM(p_promo_code))
    FOR UPDATE;

    IF v_promo.id IS NULL OR NOT v_promo.is_active
       OR (v_promo.starts_at > NOW())
       OR (v_promo.expires_at IS NOT NULL AND v_promo.expires_at <= NOW())
       OR (v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses) THEN
      RAISE EXCEPTION 'Promo code % is invalid or expired', p_promo_code;
    END IF;

    IF v_subtotal < v_promo.min_spend THEN
      RAISE EXCEPTION 'Minimum spend of R% required for code %', v_promo.min_spend, v_promo.code;
    END IF;

    v_promo_id := v_promo.id;
    v_discount := ROUND((v_subtotal * v_promo.discount_percent) / 100.0, 2);

    UPDATE public.promo_codes
    SET current_uses = current_uses + 1
    WHERE id = v_promo_id;
  END IF;

  IF v_subtotal >= 2000 THEN
    v_shipping_fee := 0.00;
  ELSE
    v_shipping_fee := 150.00;
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount + v_shipping_fee);

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
    v_resolved_user_id,
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

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(
    product_id UUID,
    size_us NUMERIC(3,1),
    quantity INT,
    bespoke_config JSONB
  )
  LOOP
    SELECT ps.id, p.name, p.sku, p.price,
           COALESCE(
             (SELECT pi.image_url FROM public.product_images pi WHERE pi.product_id = p.id ORDER BY pi.display_order ASC LIMIT 1),
             'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85'
           ) AS image_url
    INTO v_product_size_id, v_product_name, v_product_sku, v_server_price, v_image_url
    FROM public.product_sizes ps
    JOIN public.products p ON p.id = ps.product_id
    WHERE ps.product_id = v_item.product_id AND ps.size_us = v_item.size_us;

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
      v_resolved_user_id,
      v_item.quantity,
      'active',
      v_expires_at
    );

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
      v_product_name,
      v_product_sku,
      v_item.size_us,
      v_server_price,
      v_item.quantity,
      v_item.bespoke_config,
      v_image_url
    );
  END LOOP;

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
    VALUES (v_promo_id, v_order_id, v_resolved_user_id, v_discount);
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
-- 5. PAYMENT CONFIRMATION & SALE FINALIZATION
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

  UPDATE public.orders
  SET payment_status = 'paid',
      payment_reference = p_payment_reference,
      current_status = 'Authenticated',
      updated_at = NOW()
  WHERE id = p_order_id;

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
-- 6. RELEASE ORDER RESERVATIONS
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
    UPDATE public.inventory
    SET reserved_stock = GREATEST(0, reserved_stock - v_res.quantity),
        updated_at = NOW()
    WHERE product_size_id = v_res.product_size_id;

    UPDATE public.inventory_reservations
    SET status = 'released',
        updated_at = NOW()
    WHERE id = v_res.id;
  END LOOP;

  RETURN true;
END;
$$;

-- ==============================================================================
-- 7. SECURE GUEST ORDER LOOKUP
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

  SELECT jsonb_agg(to_jsonb(oi)) INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  SELECT jsonb_agg(to_jsonb(h) ORDER BY h.created_at ASC) INTO v_history
  FROM public.order_status_history h
  WHERE h.order_id = v_order.id;

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
-- 8. ADMIN OPERATIONS
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

  IF p_new_status = 'Cancelled' AND v_order.current_status <> 'Cancelled' THEN
    PERFORM public.release_order_reservations(p_order_id, 'Admin cancellation');
  END IF;

  UPDATE public.orders
  SET current_status = p_new_status,
      updated_at = NOW()
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (order_id, status, title, description, created_by)
  VALUES (p_order_id, p_new_status, p_title, p_description, p_admin_id);

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

-- ==============================================================================
-- 9. MAINTENANCE & SECURITY TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res RECORD;
  v_count INT := 0;
BEGIN
  FOR v_res IN
    SELECT * FROM public.inventory_reservations
    WHERE status = 'active' AND expires_at < NOW()
    FOR UPDATE
  LOOP
    UPDATE public.inventory
    SET reserved_stock = GREATEST(0, reserved_stock - v_res.quantity),
        updated_at = NOW()
    WHERE product_size_id = v_res.product_size_id;

    UPDATE public.inventory_reservations
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = v_res.id;

    IF v_res.order_id IS NOT NULL THEN
      UPDATE public.orders
      SET current_status = 'Cancelled',
          payment_status = 'failed',
          updated_at = NOW()
      WHERE id = v_res.order_id AND payment_status = 'pending';

      INSERT INTO public.order_status_history (order_id, status, title, description)
      VALUES (
        v_res.order_id,
        'Cancelled',
        'Reservation Expired',
        'Payment was not completed within the 30-minute window. Reserved pair returned to vault.'
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') AND (OLD.role IS DISTINCT FROM NEW.role) THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only Super Admins can alter user roles.';
    END IF;
  END IF;

  IF (TG_OP = 'INSERT') AND (NEW.role IN ('admin', 'super_admin')) THEN
    IF NOT public.is_super_admin() THEN
      NEW.role := 'customer';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_role_guard ON public.profiles;
CREATE TRIGGER enforce_profile_role_guard
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_role_escalation();

CREATE OR REPLACE FUNCTION public.guard_immutable_order_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.order_code IS DISTINCT FROM NEW.order_code
     OR OLD.subtotal IS DISTINCT FROM NEW.subtotal
     OR OLD.discount IS DISTINCT FROM NEW.discount
     OR OLD.total IS DISTINCT FROM NEW.total
     OR OLD.customer_snapshot IS DISTINCT FROM NEW.customer_snapshot THEN
    RAISE EXCEPTION 'Order financial snapshot and identification are immutable.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_order_immutability ON public.orders;
CREATE TRIGGER enforce_order_immutability
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_immutable_order_fields();
