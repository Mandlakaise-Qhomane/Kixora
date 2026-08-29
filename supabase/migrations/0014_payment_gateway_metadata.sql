// ==============================================================================
// KIXORA DATABASE MIGRATION: 0014 - PAYMENT GATEWAY METADATA
// Description: Adds payment_provider and payment_metadata columns to orders table.
// ==============================================================================

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'mock',
  ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;
