import Database from 'better-sqlite3';

const db = new Database('legacy.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in legacy.db:');
console.log(tables.map(t => t.name).join(', '));

for (const table of tables) {
    if (table.name === 'sqlite_sequence') continue;
    const count = db.prepare(`SELECT count(*) as cnt FROM ${table.name}`).get();
    console.log(`${table.name}: ${count.cnt} rows`);
}
db.close();
