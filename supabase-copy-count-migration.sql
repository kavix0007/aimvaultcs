-- AimVaultCS live copy-count migration
-- Run this once in Supabase SQL Editor after your existing AimVaultCS schema.

ALTER TABLE public.cs2_crosshairs
  ADD COLUMN IF NOT EXISTS copy_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_cs2_copy_count(p_crosshair_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.cs2_crosshairs
     SET copy_count = COALESCE(copy_count, 0) + 1
   WHERE id = p_crosshair_id
     AND published = true
  RETURNING copy_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_cs2_copy_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_cs2_copy_count(uuid) TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'cs2_crosshairs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cs2_crosshairs;
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL;
END;
$$;
