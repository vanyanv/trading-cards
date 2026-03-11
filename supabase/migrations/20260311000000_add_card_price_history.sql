CREATE TABLE card_price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'cardmarket',
  variant VARCHAR(30) DEFAULT 'normal',
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(card_id, source, variant, recorded_at)
);

CREATE INDEX idx_price_history_card_date ON card_price_history(card_id, recorded_at DESC);
