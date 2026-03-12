-- Add TCGPlayer product mapping and price tracking columns to packs table
ALTER TABLE packs ADD COLUMN IF NOT EXISTS tcgplayer_product_id INTEGER DEFAULT NULL;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS price_source VARCHAR(20) DEFAULT NULL;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ DEFAULT NULL;
