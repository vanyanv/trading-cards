-- Add TCGdex asset fields: card variants, set symbols, serie logos
-- Cards: variants metadata and set symbol URL
ALTER TABLE cards ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS set_symbol_url TEXT DEFAULT NULL;

-- Packs: set symbol and serie logo URLs
ALTER TABLE packs ADD COLUMN IF NOT EXISTS set_symbol_url TEXT DEFAULT NULL;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS serie_logo_url TEXT DEFAULT NULL;
