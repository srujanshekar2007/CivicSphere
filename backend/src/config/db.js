import 'dotenv/config';
import fs from 'node:fs';
import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

// Keep CivicSync objects in public while resolving PostGIS types/functions
// from Supabase's recommended extensions schema when they are installed there.
const POSTGRES_OPTIONS = '-c search_path=public,extensions';

function parseConnectionString(connectionString) {
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  const url = new URL(connectionString);
  // Keep SSL policy in one explicit config object. pg otherwise lets sslmode
  // URL parameters override the certificate-verification settings below.
  for (const parameter of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'sslpassword']) {
    url.searchParams.delete(parameter);
  }
  const enableChannelBinding = url.searchParams.get('channel_binding') === 'require';
  url.searchParams.delete('channel_binding');
  return { connectionString: url.toString(), enableChannelBinding };
}

export function createDbPool(connectionString, { max = env.databasePoolMax } = {}) {
  const parsed = parseConnectionString(connectionString);
  let ssl;
  if (env.databaseSsl === 'require') ssl = { rejectUnauthorized: false };
  if (env.databaseSsl === 'verify-full') {
    ssl = { rejectUnauthorized: true };
    if (env.databaseSslCa) ssl.ca = fs.readFileSync(env.databaseSslCa, 'utf8');
  }

  const pool = new Pool({
    connectionString: parsed.connectionString,
    enableChannelBinding: parsed.enableChannelBinding,
    options: POSTGRES_OPTIONS,
    ssl,
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    maxLifetimeSeconds: 1_800,
  });
  pool.on('error', (error) => {
    // Never print a connection string, credentials, or SQL in process logs.
    console.error('[db] idle connection error', error.code || 'unknown');
  });
  return pool;
}

// A modest persistent pool works with direct or session-pooled PostgreSQL
// connections and avoids exhausting the project's connection limit.
export const pool = createDbPool(env.databaseUrl);

// $1, $2 placeholders keep user input separate from the SQL text (prevents SQL injection)
export const query = (text, params) => pool.query(text, params);
// Runs fn(client) inside one transaction: everything succeeds together or is rolled back.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
