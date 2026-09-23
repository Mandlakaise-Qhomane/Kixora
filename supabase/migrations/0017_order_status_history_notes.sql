ALTER TABLE public.order_status_history
  ADD COLUMN IF NOT EXISTS notes TEXT;
