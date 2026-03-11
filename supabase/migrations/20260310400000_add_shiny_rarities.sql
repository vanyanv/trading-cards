-- Add TCGP Shiny rarity values to the card_rarity enum
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'One Shiny';
ALTER TYPE card_rarity ADD VALUE IF NOT EXISTS 'Two Shiny';
