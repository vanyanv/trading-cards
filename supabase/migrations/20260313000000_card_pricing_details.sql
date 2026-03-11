-- Detailed per-variant pricing from TCGPlayer and Cardmarket
CREATE TABLE IF NOT EXISTS card_pricing_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  variant TEXT NOT NULL DEFAULT 'normal',
  tcgplayer_low DECIMAL(10,2),
  tcgplayer_mid DECIMAL(10,2),
  tcgplayer_high DECIMAL(10,2),
  tcgplayer_market DECIMAL(10,2),
  tcgplayer_direct_low DECIMAL(10,2),
  cardmarket_avg DECIMAL(10,2),
  cardmarket_low DECIMAL(10,2),
  cardmarket_trend DECIMAL(10,2),
  cardmarket_avg7 DECIMAL(10,2),
  cardmarket_avg30 DECIMAL(10,2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(card_id, variant)
);

CREATE INDEX IF NOT EXISTS idx_pricing_card_id ON card_pricing_details(card_id);
