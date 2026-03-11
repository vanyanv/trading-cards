-- Add TCGP rarity values to the card_rarity enum
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'One Diamond';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Two Diamond';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Three Diamond';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Four Diamond';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'One Star';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Two Star';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Three Star';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Crown';

-- Add TCG Pocket booster support to packs table
ALTER TABLE packs ADD COLUMN IF NOT EXISTS booster_id TEXT DEFAULT NULL;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS featured_card_image TEXT DEFAULT NULL;

-- Add booster membership to cards table (which TCGP boosters a card appears in)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS booster_ids TEXT[] DEFAULT NULL;

-- Allow multiple packs per set (boosters share a set_id)
-- Drop the old unique constraint on set_id alone
ALTER TABLE packs DROP CONSTRAINT IF EXISTS packs_set_id_key;

-- For non-booster packs: unique on set_id where booster_id is null
CREATE UNIQUE INDEX IF NOT EXISTS packs_set_id_no_booster_unique ON packs (set_id) WHERE booster_id IS NULL;

-- For booster packs: unique on (set_id, booster_id)
CREATE UNIQUE INDEX IF NOT EXISTS packs_set_booster_unique ON packs (set_id, booster_id) WHERE booster_id IS NOT NULL;
