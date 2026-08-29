-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 0016 - ORDER RECONCILIATION & ADMIN AUDIT
-- Description: State reconciliation triggers, payment sync audit logs,
--              and automated expiration refinements for Phase 3D.
-- ==============================================================================

-- 1. Payment Reconciliation Logs (Audit Trail for Manual Syncs)
CREATE TABLE IF NOT EXISTS public.payment_reconciliation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_payment_status TEXT,
  new_payment_status TEXT,
  previous_order_status TEXT,
  new_order_status TEXT,
  gateway_reference TEXT,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_recon_order ON public.payment_reconciliation_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_recon_admin ON public.payment_reconciliation_logs(admin_id);

-- 2. Enhanced Cleanup Routine for Orphaned Pending Orders
-- This function identifies orders that might have missed the reservation cleanup
-- or were created without reservations (if any) and have been 'Pending' for too long.
CREATE OR REPLACE FUNCTION public.cleanup_stale_pending_orders(
  p_ttl_minutes INTEGER DEFAULT 60
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_count INT := 0;
BEGIN
  FOR v_order_id IN
    SELECT id FROM public.orders
    WHERE current_status = 'Pending'
      AND payment_status = 'pending'
      AND created_at < (NOW() - (p_ttl_minutes * interval '1 minute'))
    FOR UPDATE SKIP LOCKED
  LOOP
    -- 1. Release any reservations if they exist
    PERFORM public.release_order_reservations(v_order_id, 'System auto-expiration of stale pending order');

    -- 2. Transition order state
    UPDATE public.orders
    SET current_status = 'Cancelled',
        payment_status = 'failed',
        updated_at = NOW()
    WHERE id = v_order_id;

    -- 3. Log history
    INSERT INTO public.order_status_history (order_id, status, title, description)
    VALUES (
      v_order_id,
      'Cancelled',
      'Order Expired (Stale)',
      'Payment was not detected within ' || p_ttl_minutes || ' minutes. Order automatically released from vault.'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 3. Admin Payment Sync RPC
-- Authoritatively aligns local order state with verified gateway data.
CREATE OR REPLACE FUNCTION public.admin_reconcile_payment_state(
  p_order_id UUID,
  p_new_payment_status TEXT,
  p_new_order_status TEXT,
  p_gateway_reference TEXT,
  p_admin_id UUID,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_order RECORD;
BEGIN
  -- 1. Security Check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- 2. Lock and Fetch Order
  SELECT * INTO v_old_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_old_order.id IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- 3. Atomic State Updates
  UPDATE public.orders
  SET payment_status = p_new_payment_status,
      current_status = p_new_order_status,
      payment_reference = COALESCE(p_gateway_reference, payment_reference),
      updated_at = NOW()
  WHERE id = p_order_id;

  -- 4. History Log
  INSERT INTO public.order_status_history (order_id, status, title, description, created_by)
  VALUES (
    p_order_id,
    p_new_order_status,
    'Manual Payment Reconciliation',
    p_reason || ' (New Status: ' || p_new_order_status || ')',
    p_admin_id
  );

  -- 5. Audit Log
  INSERT INTO public.payment_reconciliation_logs (
    order_id, admin_id,
    previous_payment_status, new_payment_status,
    previous_order_status, new_order_status,
    gateway_reference, reason, metadata
  ) VALUES (
    p_order_id, p_admin_id,
    v_old_order.payment_status, p_new_payment_status,
    v_old_order.current_status, p_new_order_status,
    p_gateway_reference, p_reason, p_metadata
  );

  -- 6. Inventory Logic if state implies failure/refund
  IF p_new_payment_status IN ('failed', 'cancelled', 'refunded') AND v_old_order.payment_status NOT IN ('failed', 'cancelled', 'refunded') THEN
    PERFORM public.release_order_reservations(p_order_id, 'Admin manual reconciliation to failed/refunded state');
  ELSIF p_new_payment_status = 'paid' AND v_old_order.payment_status <> 'paid' THEN
    PERFORM public.confirm_inventory_sale(p_order_id, COALESCE(p_gateway_reference, v_old_order.payment_reference));
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'old_status', v_old_order.current_status,
    'new_status', p_new_order_status
  );
END;
$$;
