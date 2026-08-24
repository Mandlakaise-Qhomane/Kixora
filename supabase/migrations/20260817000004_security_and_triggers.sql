-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 004 - SECURITY TRIGGERS & INTEGRITY GUARDS
-- Description: Enforces role immutability, order snapshot protection,
--              and audit triggers across administrative operations.
-- Architecture: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. ROLE SYNC & PRIVILEGE ESCALATION GUARD
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.guard_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is changing, verify that the caller is super_admin
  IF (TG_OP = 'UPDATE') AND (OLD.role IS DISTINCT FROM NEW.role) THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'Privilege escalation rejected: Only Super Admins can alter user roles.';
    END IF;
  END IF;

  -- On insert, default role must be 'customer' unless caller is super_admin
  IF (TG_OP = 'INSERT') AND (NEW.role IN ('admin', 'super_admin')) THEN
    IF NOT public.is_super_admin() THEN
      NEW.role := 'customer';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_profile_role_guard
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_role_escalation();

-- ==============================================================================
-- 2. IMMUTABLE ORDER SNAPSHOT INTEGRITY GUARD
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.guard_immutable_order_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent modifications to financial totals, code, or customer snapshots
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

CREATE TRIGGER enforce_order_immutability
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_immutable_order_fields();

-- ==============================================================================
-- 3. EXPIRED RESERVATIONS CLEANUP RPC (CRON / MAINTENANCE TASK)
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
    -- Return reserved stock to available
    UPDATE public.inventory
    SET reserved_stock = GREATEST(0, reserved_stock - v_res.quantity),
        updated_at = NOW()
    WHERE product_size_id = v_res.product_size_id;

    -- Mark reservation as expired
    UPDATE public.inventory_reservations
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = v_res.id;

    -- If attached order is still pending, mark order as cancelled
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
        'Payment was not completed within the 30-minute window. Reserved pair has been returned to vault inventory.'
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
