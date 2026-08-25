-- ==============================================================================
-- KIXORA DATABASE MIGRATION: 0001 - EXTENSIONS & BASE UTILITIES
-- Description: Core cryptographic and UUID extensions, universal updated_at handler.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
