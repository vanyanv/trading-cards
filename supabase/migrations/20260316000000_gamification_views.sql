-- Gamification & Collection Features: RPC functions
-- All functions use SECURITY DEFINER to read across users without modifying RLS

-- 1. Leaderboard: top collectors by collection value
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INT DEFAULT 50)
RETURNS TABLE(
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_id TEXT,
  member_since TIMESTAMPTZ,
  unique_cards BIGINT,
  total_cards BIGINT,
  collection_value NUMERIC,
  rarest_card_name TEXT,
  rarest_card_rarity TEXT,
  rarest_card_image TEXT
) AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.price), 0) DESC) AS rank,
    uc.user_id,
    up.display_name,
    up.avatar_id,
    au.created_at AS member_since,
    COUNT(DISTINCT uc.card_id) AS unique_cards,
    COUNT(uc.id) AS total_cards,
    COALESCE(SUM(c.price), 0) AS collection_value,
    (SELECT c2.name FROM user_cards uc2 JOIN cards c2 ON c2.id = uc2.card_id WHERE uc2.user_id = uc.user_id ORDER BY c2.price DESC NULLS LAST LIMIT 1) AS rarest_card_name,
    (SELECT c2.rarity FROM user_cards uc2 JOIN cards c2 ON c2.id = uc2.card_id WHERE uc2.user_id = uc.user_id ORDER BY c2.price DESC NULLS LAST LIMIT 1) AS rarest_card_rarity,
    (SELECT c2.image_url FROM user_cards uc2 JOIN cards c2 ON c2.id = uc2.card_id WHERE uc2.user_id = uc.user_id ORDER BY c2.price DESC NULLS LAST LIMIT 1) AS rarest_card_image
  FROM user_cards uc
  JOIN cards c ON c.id = uc.card_id
  LEFT JOIN user_profiles up ON up.user_id = uc.user_id
  LEFT JOIN auth.users au ON au.id = uc.user_id
  GROUP BY uc.user_id, up.display_name, up.avatar_id, au.created_at
  ORDER BY collection_value DESC
  LIMIT p_limit;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. User profile stats
CREATE OR REPLACE FUNCTION get_user_profile_stats(p_user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_value', COALESCE((
      SELECT SUM(c.price) FROM user_cards uc JOIN cards c ON c.id = uc.card_id WHERE uc.user_id = p_user_id
    ), 0),
    'unique_cards', (
      SELECT COUNT(DISTINCT card_id) FROM user_cards WHERE user_id = p_user_id
    ),
    'total_cards', (
      SELECT COUNT(*) FROM user_cards WHERE user_id = p_user_id
    ),
    'packs_opened', (
      SELECT COUNT(DISTINCT (date_trunc('minute', obtained_at), pack_opened_from))
      FROM user_cards
      WHERE user_id = p_user_id AND pack_opened_from IS NOT NULL
    ),
    'sets_started', (
      SELECT COUNT(DISTINCT c.set_id)
      FROM user_cards uc JOIN cards c ON c.id = uc.card_id
      WHERE uc.user_id = p_user_id
    ),
    'member_since', (
      SELECT created_at FROM auth.users WHERE id = p_user_id
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Per-set completion for a user
CREATE OR REPLACE FUNCTION get_user_set_completion(p_user_id UUID)
RETURNS TABLE(set_id TEXT, set_name TEXT, owned_count BIGINT, total_count BIGINT) AS $$
  WITH user_sets AS (
    SELECT DISTINCT c.set_id
    FROM user_cards uc
    JOIN cards c ON c.id = uc.card_id
    WHERE uc.user_id = p_user_id
  )
  SELECT
    c.set_id,
    c.set_name,
    COUNT(DISTINCT CASE WHEN uc.card_id IS NOT NULL THEN c.id END) AS owned_count,
    COUNT(DISTINCT c.id) AS total_count
  FROM cards c
  INNER JOIN user_sets us ON us.set_id = c.set_id
  LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.user_id = p_user_id
  GROUP BY c.set_id, c.set_name
  ORDER BY owned_count DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Rarity breakdown for a user
CREATE OR REPLACE FUNCTION get_user_rarity_breakdown(p_user_id UUID)
RETURNS TABLE(rarity TEXT, count BIGINT) AS $$
  SELECT c.rarity::TEXT, COUNT(*)
  FROM user_cards uc
  JOIN cards c ON c.id = uc.card_id
  WHERE uc.user_id = p_user_id
  GROUP BY c.rarity
  ORDER BY COUNT(*) DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Most valuable card owned by a user
CREATE OR REPLACE FUNCTION get_user_rarest_card(p_user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'name', c.name,
    'rarity', c.rarity,
    'image_url', c.image_url
  )
  FROM user_cards uc
  JOIN cards c ON c.id = uc.card_id
  WHERE uc.user_id = p_user_id
  ORDER BY c.price DESC NULLS LAST
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Recent rare+ pulls for a user
CREATE OR REPLACE FUNCTION get_user_recent_pulls(p_user_id UUID, p_limit INT DEFAULT 10)
RETURNS TABLE(
  card_name TEXT,
  card_image_url TEXT,
  card_rarity TEXT,
  set_name TEXT,
  obtained_at TIMESTAMPTZ
) AS $$
  SELECT
    c.name,
    c.image_url,
    c.rarity::TEXT,
    c.set_name,
    uc.obtained_at
  FROM user_cards uc
  JOIN cards c ON c.id = uc.card_id
  WHERE uc.user_id = p_user_id
    AND c.rarity IN (
      'Rare', 'Double Rare', 'Illustration Rare', 'Ultra Rare',
      'Special Illustration Rare', 'Hyper Rare',
      'Three Diamond', 'Four Diamond', 'One Star', 'Two Star', 'Three Star', 'Crown'
    )
  ORDER BY uc.obtained_at DESC
  LIMIT p_limit;
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Most valuable cards owned by a user
CREATE OR REPLACE FUNCTION get_user_top_cards(p_user_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE(
  card_id UUID,
  card_name TEXT,
  card_image_url TEXT,
  card_rarity TEXT,
  card_price NUMERIC
) AS $$
  SELECT
    c.id,
    c.name,
    c.image_url,
    c.rarity::TEXT,
    c.price
  FROM user_cards uc
  JOIN cards c ON c.id = uc.card_id
  WHERE uc.user_id = p_user_id AND c.price IS NOT NULL
  ORDER BY c.price DESC
  LIMIT p_limit;
$$ LANGUAGE sql SECURITY DEFINER;

-- 8. All cards in a set with ownership flag for Pokédex
CREATE OR REPLACE FUNCTION get_set_cards_with_ownership(p_user_id UUID, p_set_id TEXT)
RETURNS TABLE(
  card_id UUID,
  card_name TEXT,
  card_image_url TEXT,
  card_rarity TEXT,
  owned BOOLEAN
) AS $$
  SELECT
    c.id,
    c.name,
    c.image_url,
    c.rarity::TEXT,
    EXISTS(
      SELECT 1 FROM user_cards uc
      WHERE uc.card_id = c.id AND uc.user_id = p_user_id
    ) AS owned
  FROM cards c
  WHERE c.set_id = p_set_id
  ORDER BY c.name;
$$ LANGUAGE sql SECURITY DEFINER;

-- 9. Pokédex leaderboard: ranked by total unique cards collected
CREATE OR REPLACE FUNCTION get_pokedex_leaderboard(p_limit INT DEFAULT 50)
RETURNS TABLE(
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_id TEXT,
  unique_cards BIGINT,
  sets_started BIGINT
) AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT uc.card_id) DESC) AS rank,
    uc.user_id,
    up.display_name,
    up.avatar_id,
    COUNT(DISTINCT uc.card_id) AS unique_cards,
    COUNT(DISTINCT c.set_id) AS sets_started
  FROM user_cards uc
  JOIN cards c ON c.id = uc.card_id
  LEFT JOIN user_profiles up ON up.user_id = uc.user_id
  GROUP BY uc.user_id, up.display_name, up.avatar_id
  ORDER BY unique_cards DESC
  LIMIT p_limit;
$$ LANGUAGE sql SECURITY DEFINER;
