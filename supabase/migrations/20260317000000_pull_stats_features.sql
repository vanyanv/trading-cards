-- Pull stats features: RPC functions for pull rate display, luck stats, and card-level tracking

-- Index for card-level pull count queries
CREATE INDEX IF NOT EXISTS idx_user_cards_card_id ON user_cards(card_id);

-- 1. Observed pull counts for a set+slot (for pack detail page)
CREATE OR REPLACE FUNCTION get_pack_pull_stats(p_set_id TEXT, p_slot_type TEXT)
RETURNS TABLE(rarity TEXT, pull_count BIGINT, total_opens BIGINT) AS $$
  SELECT rarity::TEXT, pull_count, total_opens
  FROM pull_stats
  WHERE set_id = p_set_id AND slot_type = p_slot_type;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Per-pack open counts for a user
CREATE OR REPLACE FUNCTION get_user_pack_breakdown(p_user_id UUID)
RETURNS TABLE(
  pack_id UUID,
  pack_name TEXT,
  pack_image_url TEXT,
  set_name TEXT,
  times_opened BIGINT
) AS $$
  SELECT
    p.id,
    p.name,
    p.image_url,
    p.set_name,
    COUNT(DISTINCT (date_trunc('minute', uc.obtained_at), uc.pack_opened_from)) AS times_opened
  FROM user_cards uc
  JOIN packs p ON p.id = uc.pack_opened_from
  WHERE uc.user_id = p_user_id AND uc.pack_opened_from IS NOT NULL
  GROUP BY p.id, p.name, p.image_url, p.set_name
  ORDER BY times_opened DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. User luck stats: per-rarity counts for rare+ cards vs community rates
CREATE OR REPLACE FUNCTION get_user_luck_stats(p_user_id UUID)
RETURNS TABLE(
  rarity TEXT,
  user_count BIGINT,
  user_total BIGINT,
  community_rate NUMERIC
) AS $$
  WITH user_hit_pulls AS (
    SELECT c.rarity, COUNT(*) AS cnt
    FROM user_cards uc
    JOIN cards c ON c.id = uc.card_id
    WHERE uc.user_id = p_user_id
      AND c.rarity NOT IN ('Common', 'Uncommon', 'One Diamond', 'Two Diamond')
    GROUP BY c.rarity
  ),
  user_total AS (
    SELECT COALESCE(SUM(cnt), 0) AS total FROM user_hit_pulls
  ),
  community AS (
    SELECT rarity,
           CASE WHEN total_opens > 0 THEN pull_count::NUMERIC / total_opens ELSE 0 END AS rate
    FROM pull_stats
    WHERE slot_type IN ('hit_slot', 'tcgp_hit_slot')
  )
  SELECT
    uhp.rarity::TEXT,
    uhp.cnt AS user_count,
    ut.total AS user_total,
    COALESCE(AVG(cm.rate), 0) AS community_rate
  FROM user_hit_pulls uhp
  CROSS JOIN user_total ut
  LEFT JOIN community cm ON cm.rarity::TEXT = uhp.rarity::TEXT
  GROUP BY uhp.rarity, uhp.cnt, ut.total;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Community-wide pull count for a specific card
CREATE OR REPLACE FUNCTION get_card_pull_count(p_card_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'pull_count', (SELECT COUNT(*) FROM user_cards WHERE card_id = p_card_id),
    'total_opens', (
      SELECT COALESCE(SUM(p.open_count), 0)
      FROM packs p
      JOIN cards c ON c.set_id = p.set_id
      WHERE c.id = p_card_id
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Global pull summary for stats hub
CREATE OR REPLACE FUNCTION get_global_pull_summary()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_packs_opened', (SELECT COALESCE(SUM(open_count), 0) FROM packs),
    'total_cards_pulled', (SELECT COUNT(*) FROM user_cards),
    'total_users', (SELECT COUNT(DISTINCT user_id) FROM user_cards)
  );
$$ LANGUAGE sql SECURITY DEFINER;
