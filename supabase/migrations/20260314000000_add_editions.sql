-- Add edition support for vintage WotC-era pack variants
-- Valid editions: '1st-edition', 'shadowless', 'unlimited', NULL (modern sets)

-- Add edition column to packs
ALTER TABLE packs ADD COLUMN IF NOT EXISTS edition TEXT DEFAULT NULL;

-- Add edition column to user_cards (tracks which edition a pulled card belongs to)
ALTER TABLE user_cards ADD COLUMN IF NOT EXISTS edition TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_user_cards_edition ON user_cards(edition);

-- Replace unique constraints to allow multiple editions per set_id
DROP INDEX IF EXISTS packs_set_id_no_booster_unique;

-- Modern packs (no edition, no booster) - one per set
CREATE UNIQUE INDEX packs_set_only_unique
  ON packs (set_id) WHERE edition IS NULL AND booster_id IS NULL;

-- Edition variant packs (no booster) - one per set+edition
CREATE UNIQUE INDEX packs_set_edition_unique
  ON packs (set_id, edition) WHERE edition IS NOT NULL AND booster_id IS NULL;
