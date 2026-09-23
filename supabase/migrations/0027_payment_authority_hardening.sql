-- Payment amounts are authoritative on orders. Legacy mock provider values are
-- not valid production payment authority.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'ZAR';

UPDATE public.orders SET payment_provider = NULL WHERE payment_provider = 'mock';
ALTER TABLE public.orders ALTER COLUMN payment_provider DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN payment_provider DROP DEFAULT;
