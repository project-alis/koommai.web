-- MEEPIAP Discovery search scale-up
-- Adds curated Thai search terms, FTS5, and location bounding-box index.

ALTER TABLE discovery_entities ADD COLUMN search_terms TEXT;

CREATE INDEX IF NOT EXISTS idx_discovery_entities_active_lat_lng
ON discovery_entities(active, latitude, longitude);

CREATE VIRTUAL TABLE IF NOT EXISTS discovery_entities_fts USING fts5(
  name,
  description,
  category,
  search_terms,
  district,
  province,
  content='discovery_entities',
  content_rowid='id',
  tokenize='unicode61'
);

-- Build the first index from existing rows.
INSERT INTO discovery_entities_fts(discovery_entities_fts) VALUES('rebuild');

CREATE TRIGGER IF NOT EXISTS discovery_entities_fts_ai
AFTER INSERT ON discovery_entities BEGIN
  INSERT INTO discovery_entities_fts(rowid, name, description, category, search_terms, district, province)
  VALUES (new.id, new.name, new.description, new.category, new.search_terms, new.district, new.province);
END;

CREATE TRIGGER IF NOT EXISTS discovery_entities_fts_ad
AFTER DELETE ON discovery_entities BEGIN
  INSERT INTO discovery_entities_fts(discovery_entities_fts, rowid, name, description, category, search_terms, district, province)
  VALUES ('delete', old.id, old.name, old.description, old.category, old.search_terms, old.district, old.province);
END;

CREATE TRIGGER IF NOT EXISTS discovery_entities_fts_au
AFTER UPDATE ON discovery_entities BEGIN
  INSERT INTO discovery_entities_fts(discovery_entities_fts, rowid, name, description, category, search_terms, district, province)
  VALUES ('delete', old.id, old.name, old.description, old.category, old.search_terms, old.district, old.province);
  INSERT INTO discovery_entities_fts(rowid, name, description, category, search_terms, district, province)
  VALUES (new.id, new.name, new.description, new.category, new.search_terms, new.district, new.province);
END;
