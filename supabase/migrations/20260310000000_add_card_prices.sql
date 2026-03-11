-- Add price, trend, and condition columns to cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_trend VARCHAR(10) DEFAULT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS condition VARCHAR(10) DEFAULT 'NM';

-- NOTE: Prices are now sourced from TCGPlayer/CardMarket via sync-cards.ts
-- The old random mock prices have been removed. Run the sync script to populate real prices.
