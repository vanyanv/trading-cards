-- Track where card prices come from
ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_source VARCHAR(20) DEFAULT NULL;

-- Add real USD price to packs
ALTER TABLE packs ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2) DEFAULT NULL;

-- Convert user_balances from coins to USD
ALTER TABLE user_balances ADD COLUMN IF NOT EXISTS balance_usd DECIMAL(10,2) DEFAULT 10.00;

-- Migrate existing coin balances to USD (rough conversion: 150 coins = $4.49)
UPDATE user_balances SET balance_usd = ROUND((coins * 0.03)::numeric, 2) WHERE balance_usd = 10.00 AND coins != 0;

-- Drop the coins column
ALTER TABLE user_balances DROP COLUMN IF EXISTS coins;

-- Update the trigger function for new user signup to use balance_usd instead of coins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_balances (user_id, balance_usd, updated_at)
  VALUES (NEW.id, 10.00, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
