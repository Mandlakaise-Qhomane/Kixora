-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 0013 - PAYMENT LIFECYCLE EXTENSIONS
-- Description: Extends orders payment_status check constraint to support processing.
-- ==============================================================================

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'));
