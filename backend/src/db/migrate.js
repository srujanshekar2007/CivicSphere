import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDbPool } from '../config/db.js';
import { env } from '../config/env.js';

// In ES modules there is no __dirname, so we rebuild it.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// This file is backend/src/db, so go up two levels to reach backend/migrations
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

async function run() {
  const migrationUrl = env.databaseMigrationUrl || env.databaseUrl;
  if (!migrationUrl) throw new Error('Set DATABASE_URL before running migrations');
  // Use a direct or session-pooled connection: this runner holds one backend
  // session for its advisory lock throughout the migration run.
  const pool = createDbPool(migrationUrl, { max: 1 });
  let client;
  const lockKey = [814216, 1];
  try {
    client = await pool.connect();
    await client.query('SELECT pg_advisory_lock($1, $2)', lockKey);
    // A small table that remembers which migration files already ran
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = (await fs.readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort(); // 001, 002, 003... runs in order

    const { rows } = await client.query('SELECT filename FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.filename));

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip    ${file} (already applied)`);
        continue;
      }

      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        // A transaction: either the whole file succeeds, or nothing changes.
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`applied ${file}`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`FAILED  ${file}: ${err.message}`);
        process.exitCode = 1;
        break; // stop here, don't run later migrations
      }
    }

    if (process.exitCode !== 1) console.log(`Done. ${count} migration(s) applied.`);
  } finally {
    if (client) {
      await client.query('SELECT pg_advisory_unlock($1, $2)', lockKey).catch(() => {});
      client.release();
    }
    await pool.end();
  }
}

run();
