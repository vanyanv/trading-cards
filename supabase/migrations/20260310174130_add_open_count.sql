ALTER TABLE packs ADD COLUMN open_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_open_count(pack_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE packs SET open_count = open_count + 1 WHERE id = pack_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
