-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 0015 - WEBHOOK IDEMPOTENCY & AUDIT TRAIL
-- Description: Stores processed payment gateway webhook events for deduplication,
--              replay protection, and financial audit logs.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  order_code TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'ignored')),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_webhook_provider_event UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_lookup ON public.webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_code ON public.webhook_events(order_code);
