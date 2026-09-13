import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
export function database(through = 6) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  for (const file of readdirSync('migrations').filter(f => f.endsWith('.sql') && Number(f.slice(0,4)) <= through).sort()) sqlite.exec(readFileSync('migrations/' + file,'utf8'));
  const db = { sqlite, prepare(sql) {
    let args = [];
    const run = () => { const result = sqlite.prepare(sql).run(...args); return { meta:{ changes:result.changes, last_row_id:Number(result.lastInsertRowid) } }; };
    return { bind(...values) { args=values; return this; }, async first() { return sqlite.prepare(sql).get(...args) || null; },
      async all() { return {results:sqlite.prepare(sql).all(...args)}; }, async run() { return run(); },
      execute() { return sqlite.prepare(sql).columns().length ? {results:sqlite.prepare(sql).all(...args)} : run(); } };
  }, async exec(sql) { sqlite.exec(sql); }, async batch(statements) {
    sqlite.exec('BEGIN');
    try { const result=statements.map(s=>s.execute()); sqlite.exec('COMMIT'); return result; }
    catch(error) { sqlite.exec('ROLLBACK'); throw error; }
  } };
  return db;
}
