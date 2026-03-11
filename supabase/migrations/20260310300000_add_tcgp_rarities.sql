-- Add TCGP rarity values to the card_rarity enum
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'One Diamond';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Two Diamond';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Three Diamond';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Four Diamond';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'One Star';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Two Star';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Three Star';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Crown';
