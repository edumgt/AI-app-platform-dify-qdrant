const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), "../../.env") });

const { query } = require("./pool");

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function hasMigration(name) {
  const r = await query("SELECT 1 FROM migrations WHERE name = $1", [name]);
  return r.rowCount > 0;
}

async function applyMigration(name, sql) {
  console.log("[MIGRATE] applying:", name);
  await query("BEGIN");
  try {
    await query(sql);
    await query("INSERT INTO migrations(name) VALUES($1)", [name]);
    await query("COMMIT");
  } catch (e) {
    await query("ROLLBACK");
    throw e;
  }
}

async function main() {
  await ensureMigrationsTable();

  const dir = path.resolve(process.cwd(), "..", "..", "db", "migrations");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

  for (const f of files) {
    if (await hasMigration(f)) continue;
    const sql = fs.readFileSync(path.join(dir, f), "utf-8");
    await applyMigration(f, sql);
  }

  console.log("[MIGRATE] done");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
