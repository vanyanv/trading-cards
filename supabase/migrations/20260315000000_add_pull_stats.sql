-- Pull rate tracking: aggregate counts per set/rarity/slot for Bayesian rate adjustment

CREATE TABLE pull_stats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id      text NOT NULL,
  rarity      card_rarity NOT NULL,
  slot_type   text NOT NULL CHECK (slot_type IN ('hit_slot', 'reverse_holo', 'tcgp_hit_slot')),
  pull_count  bigint NOT NULL DEFAULT 0,
  total_opens bigint NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(set_id, rarity, slot_type)
);

CREATE INDEX idx_pull_stats_set_slot ON pull_stats(set_id, slot_type);

-- RPC: record a pull result. Increments pull_count for the pulled rarity
-- and total_opens for ALL rarities of that set+slot (so total_opens stays in sync).
CREATE OR REPLACE FUNCTION record_pull_stats(
  p_set_id text,
  p_rarity card_rarity,
  p_slot_type text
) RETURNS void AS $$
BEGIN
  -- Upsert the pulled rarity: +1 pull_count, +1 total_opens
  INSERT INTO pull_stats (set_id, rarity, slot_type, pull_count, total_opens, updated_at)
  VALUES (p_set_id, p_rarity, p_slot_type, 1, 1, now())
  ON CONFLICT (set_id, rarity, slot_type)
  DO UPDATE SET
    pull_count = pull_stats.pull_count + 1,
    total_opens = pull_stats.total_opens + 1,
    updated_at = now();

  -- Increment total_opens for all OTHER rarities of this set+slot (so they stay in sync)
  UPDATE pull_stats
  SET total_opens = total_opens + 1,
      updated_at = now()
  WHERE set_id = p_set_id
    AND slot_type = p_slot_type
    AND rarity != p_rarity;
END;
$$ LANGUAGE plpgsql;
