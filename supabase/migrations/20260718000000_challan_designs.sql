-- Challan export designs.
-- A "design" is a tenant's scanned/printed challan layout (background image) plus
-- a relative-coordinate config describing where each data value is drawn. Stored
-- as data so a new tenant is configured from the UI instead of editing code
-- (previously hard-coded in src/components/ReceiptTemplate.tsx).

CREATE TABLE IF NOT EXISTS challan_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  -- Which item category this design is for. Mirrors plate_sizes.category.
  category text NOT NULL DEFAULT 'shuttering'
    CHECK (category IN ('shuttering', 'jack', 'cuplock', 'other')),
  -- Which challan flow it applies to.
  challan_type text NOT NULL DEFAULT 'both'
    CHECK (challan_type IN ('udhar', 'jama', 'both')),
  -- Background image as an inline base64 data URL (nullable while drafting).
  -- Stored in-row on purpose so it goes through PostgREST (same RLS as every
  -- other table) instead of Supabase Storage, whose storage-api can reject
  -- ES256-signed JWTs. Downscaled client-side to keep rows small.
  background_path text,
  -- Natural pixel size of the uploaded background; used to preserve aspect ratio.
  background_width integer NOT NULL DEFAULT 0,
  background_height integer NOT NULL DEFAULT 0,
  -- Relative-coordinate layout (fields + row band). See src/utils/challanDesign/types.ts.
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- When multiple designs match a (category, challan_type), the default wins auto-select.
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challan_designs_category
  ON challan_designs (category, challan_type);

ALTER TABLE challan_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated manage challan_designs" ON challan_designs;
CREATE POLICY "Authenticated manage challan_designs" ON challan_designs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Keep updated_at fresh on every write.
CREATE OR REPLACE FUNCTION set_challan_designs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_challan_designs_updated_at ON challan_designs;
CREATE TRIGGER trg_challan_designs_updated_at
  BEFORE UPDATE ON challan_designs
  FOR EACH ROW EXECUTE FUNCTION set_challan_designs_updated_at();

-- No Supabase Storage bucket: background images live inline in background_path
-- (see column comment above).
