-- Rarity enum matching Pokemon TCG rarities
CREATE TYPE card_rarity AS ENUM (
  'Common',
  'Uncommon',
  'Rare',
  'Double Rare',
  'Illustration Rare',
  'Ultra Rare',
  'Special Illustration Rare',
  'Hyper Rare'
);

-- Cards table (synced from Pokemon TCG API)
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_url_hires TEXT,
  rarity card_rarity NOT NULL DEFAULT 'Common',
  set_id TEXT NOT NULL,
  set_name TEXT NOT NULL,
  hp TEXT,
  types TEXT[] DEFAULT '{}',
  subtypes TEXT[] DEFAULT '{}',
  supertype TEXT NOT NULL DEFAULT 'Pokémon',
  tcg_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Packs table (one per set)
CREATE TABLE packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_coins INTEGER NOT NULL DEFAULT 150,
  image_url TEXT NOT NULL,
  cards_per_pack INTEGER NOT NULL DEFAULT 10,
  set_id TEXT UNIQUE NOT NULL,
  set_name TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User balances (virtual currency)
CREATE TABLE user_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 500 CHECK (coins >= 0),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User's owned cards
CREATE TABLE user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  is_reverse_holo BOOLEAN DEFAULT false,
  obtained_at TIMESTAMPTZ DEFAULT now(),
  pack_opened_from UUID REFERENCES packs(id)
);

-- Indexes
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX idx_user_cards_card_id ON user_cards(card_id);
CREATE INDEX idx_cards_set_id ON cards(set_id);
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_tcg_id ON cards(tcg_id);

-- Row Level Security
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balance"
  ON user_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own balance"
  ON user_balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own balance"
  ON user_balances FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own cards"
  ON user_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards"
  ON user_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cards are publicly readable" ON cards FOR SELECT USING (true);
CREATE POLICY "Packs are publicly readable" ON packs FOR SELECT USING (true);

-- Auto-create balance on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_balances (user_id, coins)
  VALUES (NEW.id, 500);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
