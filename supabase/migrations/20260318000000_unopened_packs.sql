-- Unopened packs system: allows users to save packs and open them later
-- Cards are stored server-side only until the user watches the reveal animation

-- Table 1: Metadata (client-accessible via RLS)
CREATE TABLE IF NOT EXISTS unopened_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_unopened_packs_user ON unopened_packs(user_id);

ALTER TABLE unopened_packs ENABLE ROW LEVEL SECURITY;

-- Users can see their own unopened packs metadata
CREATE POLICY "Users can view own unopened packs"
  ON unopened_packs FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies — all mutations via service-role client only

-- Table 2: Card data (NO client access at all)
CREATE TABLE IF NOT EXISTS unopened_pack_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unopened_pack_id UUID NOT NULL REFERENCES unopened_packs(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id),
  is_reverse_holo BOOLEAN DEFAULT false,
  edition TEXT,
  slot_number INTEGER NOT NULL
);

CREATE INDEX idx_unopened_pack_cards_pack ON unopened_pack_cards(unopened_pack_id);

ALTER TABLE unopened_pack_cards ENABLE ROW LEVEL SECURITY;
-- NO policies — only service-role/admin client can access this table
