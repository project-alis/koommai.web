-- MEEPIAP discovery search index
-- Trigram FTS5 keeps substring search efficient as discovery_entities grows.

CREATE VIRTUAL TABLE IF NOT EXISTS discovery_fts USING fts5(
  name,
  description,
  category,
  district,
  province,
  content='discovery_entities',
  content_rowid='id',
  tokenize='trigram'
);

INSERT INTO discovery_fts(rowid, name, description, category, district, province)
SELECT id, COALESCE(name,''), COALESCE(description,''), COALESCE(category,''), COALESCE(district,''), COALESCE(province,'')
FROM discovery_entities
WHERE id NOT IN (SELECT rowid FROM discovery_fts);

CREATE TRIGGER IF NOT EXISTS discovery_fts_ai AFTER INSERT ON discovery_entities BEGIN
  INSERT INTO discovery_fts(rowid, name, description, category, district, province)
  VALUES (new.id, COALESCE(new.name,''), COALESCE(new.description,''), COALESCE(new.category,''), COALESCE(new.district,''), COALESCE(new.province,''));
END;

CREATE TRIGGER IF NOT EXISTS discovery_fts_ad AFTER DELETE ON discovery_entities BEGIN
  INSERT INTO discovery_fts(discovery_fts, rowid, name, description, category, district, province)
  VALUES ('delete', old.id, COALESCE(old.name,''), COALESCE(old.description,''), COALESCE(old.category,''), COALESCE(old.district,''), COALESCE(old.province,''));
END;

CREATE TRIGGER IF NOT EXISTS discovery_fts_au AFTER UPDATE ON discovery_entities BEGIN
  INSERT INTO discovery_fts(discovery_fts, rowid, name, description, category, district, province)
  VALUES ('delete', old.id, COALESCE(old.name,''), COALESCE(old.description,''), COALESCE(old.category,''), COALESCE(old.district,''), COALESCE(old.province,''));
  INSERT INTO discovery_fts(rowid, name, description, category, district, province)
  VALUES (new.id, COALESCE(new.name,''), COALESCE(new.description,''), COALESCE(new.category,''), COALESCE(new.district,''), COALESCE(new.province,''));
END;
