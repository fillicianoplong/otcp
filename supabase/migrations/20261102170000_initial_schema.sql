-- OTCP initial Supabase schema (Architecture §6.11). Idempotent for SQL editor paste.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  card_view_pref text CHECK (
    card_view_pref IS NULL
    OR card_view_pref IN ('list', 'grid', 'table')
  ),
  table_column_prefs jsonb
);

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

CREATE TABLE IF NOT EXISTS public.want_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS want_lists_owner_id_idx ON public.want_lists (owner_id);

CREATE TABLE IF NOT EXISTS public.want_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  want_list_id uuid NOT NULL REFERENCES public.want_lists (id) ON DELETE CASCADE,
  card_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  target_set text,
  target_rarity text,
  note text,
  acquired boolean NOT NULL DEFAULT false,
  purchase_price numeric(12, 2),
  condition text CHECK (
    condition IS NULL
    OR condition IN ('nm', 'lp', 'mp', 'hp', 'dmg')
  ),
  variant_eu boolean NOT NULL DEFAULT false,
  variant_1st boolean NOT NULL DEFAULT false,
  variant_faded boolean NOT NULL DEFAULT false,
  my_value numeric(12, 2)
);

CREATE INDEX IF NOT EXISTS want_list_items_want_list_id_idx ON public.want_list_items (
  want_list_id
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  card_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  set_code text NOT NULL,
  rarity text NOT NULL,
  purchase_price numeric(12, 2),
  condition text CHECK (
    condition IS NULL
    OR condition IN ('nm', 'lp', 'mp', 'hp', 'dmg')
  ),
  variant_eu boolean NOT NULL DEFAULT false,
  variant_1st boolean NOT NULL DEFAULT false,
  variant_faded boolean NOT NULL DEFAULT false,
  my_value numeric(12, 2),
  CONSTRAINT collection_items_owner_printing_unique UNIQUE (
    owner_id,
    card_id,
    set_code,
    rarity
  )
);

CREATE INDEX IF NOT EXISTS collection_items_owner_id_idx ON public.collection_items (
  owner_id
);

CREATE TABLE IF NOT EXISTS public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_kind text NOT NULL CHECK (target_kind IN ('deck', 'want_list')),
  target_id uuid NOT NULL,
  token_hash bytea NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS share_links_target_idx ON public.share_links (
  target_kind,
  target_id
);

-- ---------------------------------------------------------------------------
-- Share link cascade when parent deck or want list is deleted
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cascade_share_links_on_deck_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.share_links
  WHERE target_kind = 'deck' AND target_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS cascade_share_links_on_deck_delete ON public.decks;
CREATE TRIGGER cascade_share_links_on_deck_delete
  BEFORE DELETE ON public.decks
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_share_links_on_deck_delete();

CREATE OR REPLACE FUNCTION public.cascade_share_links_on_want_list_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.share_links
  WHERE target_kind = 'want_list' AND target_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS cascade_share_links_on_want_list_delete ON public.want_lists;
CREATE TRIGGER cascade_share_links_on_want_list_delete
  BEFORE DELETE ON public.want_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_share_links_on_want_list_delete();

-- ---------------------------------------------------------------------------
-- Profile row on new auth user
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- open_share RPC (token hash lookup; no direct anon table access)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.open_share(token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash bytea;
  v_link public.share_links%ROWTYPE;
  v_row jsonb;
BEGIN
  IF token IS NULL OR length(trim(token)) = 0 THEN
    RETURN NULL;
  END IF;

  v_hash := digest(token, 'sha256');

  SELECT *
  INTO v_link
  FROM public.share_links
  WHERE token_hash = v_hash
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_link.target_kind = 'deck' THEN
    SELECT to_jsonb(d.*)
    INTO v_row
    FROM public.decks d
    WHERE d.id = v_link.target_id;
  ELSIF v_link.target_kind = 'want_list' THEN
    SELECT to_jsonb(w.*)
    INTO v_row
    FROM public.want_lists w
    WHERE w.id = v_link.target_id;
  END IF;

  IF v_row IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'target_kind',
    v_link.target_kind,
    'target',
    v_row
  );
END;
$$;

REVOKE ALL ON FUNCTION public.open_share(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_share(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.want_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.want_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

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

DROP POLICY IF EXISTS want_lists_select_own ON public.want_lists;
CREATE POLICY want_lists_select_own ON public.want_lists
  FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS want_lists_insert_own ON public.want_lists;
CREATE POLICY want_lists_insert_own ON public.want_lists
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS want_lists_update_own ON public.want_lists;
CREATE POLICY want_lists_update_own ON public.want_lists
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS want_lists_delete_own ON public.want_lists;
CREATE POLICY want_lists_delete_own ON public.want_lists
  FOR DELETE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS want_list_items_select_own ON public.want_list_items;
CREATE POLICY want_list_items_select_own ON public.want_list_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.want_lists wl
      WHERE wl.id = want_list_items.want_list_id
        AND wl.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS want_list_items_insert_own ON public.want_list_items;
CREATE POLICY want_list_items_insert_own ON public.want_list_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.want_lists wl
      WHERE wl.id = want_list_items.want_list_id
        AND wl.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS want_list_items_update_own ON public.want_list_items;
CREATE POLICY want_list_items_update_own ON public.want_list_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.want_lists wl
      WHERE wl.id = want_list_items.want_list_id
        AND wl.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.want_lists wl
      WHERE wl.id = want_list_items.want_list_id
        AND wl.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS want_list_items_delete_own ON public.want_list_items;
CREATE POLICY want_list_items_delete_own ON public.want_list_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.want_lists wl
      WHERE wl.id = want_list_items.want_list_id
        AND wl.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS collection_items_select_own ON public.collection_items;
CREATE POLICY collection_items_select_own ON public.collection_items
  FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS collection_items_insert_own ON public.collection_items;
CREATE POLICY collection_items_insert_own ON public.collection_items
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS collection_items_update_own ON public.collection_items;
CREATE POLICY collection_items_update_own ON public.collection_items
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS collection_items_delete_own ON public.collection_items;
CREATE POLICY collection_items_delete_own ON public.collection_items
  FOR DELETE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS share_links_select_own ON public.share_links;
CREATE POLICY share_links_select_own ON public.share_links
  FOR SELECT
  USING (
    (
      target_kind = 'deck'
      AND EXISTS (
        SELECT 1
        FROM public.decks d
        WHERE d.id = share_links.target_id
          AND d.owner_id = auth.uid()
      )
    )
    OR (
      target_kind = 'want_list'
      AND EXISTS (
        SELECT 1
        FROM public.want_lists w
        WHERE w.id = share_links.target_id
          AND w.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS share_links_insert_own ON public.share_links;
CREATE POLICY share_links_insert_own ON public.share_links
  FOR INSERT
  WITH CHECK (
    (
      target_kind = 'deck'
      AND EXISTS (
        SELECT 1
        FROM public.decks d
        WHERE d.id = share_links.target_id
          AND d.owner_id = auth.uid()
      )
    )
    OR (
      target_kind = 'want_list'
      AND EXISTS (
        SELECT 1
        FROM public.want_lists w
        WHERE w.id = share_links.target_id
          AND w.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS share_links_update_own ON public.share_links;
CREATE POLICY share_links_update_own ON public.share_links
  FOR UPDATE
  USING (
    (
      target_kind = 'deck'
      AND EXISTS (
        SELECT 1
        FROM public.decks d
        WHERE d.id = share_links.target_id
          AND d.owner_id = auth.uid()
      )
    )
    OR (
      target_kind = 'want_list'
      AND EXISTS (
        SELECT 1
        FROM public.want_lists w
        WHERE w.id = share_links.target_id
          AND w.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    (
      target_kind = 'deck'
      AND EXISTS (
        SELECT 1
        FROM public.decks d
        WHERE d.id = share_links.target_id
          AND d.owner_id = auth.uid()
      )
    )
    OR (
      target_kind = 'want_list'
      AND EXISTS (
        SELECT 1
        FROM public.want_lists w
        WHERE w.id = share_links.target_id
          AND w.owner_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Table grants (authenticated only; anon uses open_share RPC)
-- ---------------------------------------------------------------------------

REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.decks FROM anon, authenticated;
REVOKE ALL ON public.want_lists FROM anon, authenticated;
REVOKE ALL ON public.want_list_items FROM anon, authenticated;
REVOKE ALL ON public.collection_items FROM anon, authenticated;
REVOKE ALL ON public.share_links FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.want_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.want_list_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.share_links TO authenticated;
