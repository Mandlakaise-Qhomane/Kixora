-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 0007 - DROPS CALENDAR & RAFFLE ENTRIES
-- Description: Exclusive releases, shock drops, raffle drawings, hype levels.
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
