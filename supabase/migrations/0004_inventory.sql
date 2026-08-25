-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 0004 - INVENTORY & CONCURRENT RESERVATION SUBSYSTEM
-- Description: Real-time size-level stock, reservations, and oversell protection.
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
  order_id UUID,
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
