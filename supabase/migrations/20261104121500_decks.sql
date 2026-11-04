-- OTCP saved decks (W-40). Idempotent for Supabase SQL editor paste.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  deck_schema_version integer NOT NULL,
  name text NOT NULL,
  format_id text NOT NULL,
  main jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra jsonb NOT NULL DEFAULT '[]'::jsonb,
  side jsonb NOT NULL DEFAULT '[]'::jsonb,
  skill_id text,
  genesys_cap integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS decks_owner_id_idx ON public.decks (owner_id);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS decks_select_own ON public.decks;
CREATE POLICY decks_select_own ON public.decks
  FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS decks_insert_own ON public.decks;
CREATE POLICY decks_insert_own ON public.decks
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS decks_update_own ON public.decks;
CREATE POLICY decks_update_own ON public.decks
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS decks_delete_own ON public.decks;
CREATE POLICY decks_delete_own ON public.decks
  FOR DELETE
  USING (owner_id = auth.uid());

REVOKE ALL ON public.decks FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decks TO authenticated;
