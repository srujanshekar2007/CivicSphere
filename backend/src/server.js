import 'dotenv/config';
import app from './app.js';
import { startScheduler } from './jobs/scheduler.js';
import { pool } from './config/db.js';

const PORT = process.env.PORT || 5000;

try {
  await pool.query('SELECT 1');
} catch {
  console.error('[db] initial connectivity check failed; verify database URL and TLS configuration');
  process.exit(1);
}

let stopScheduler = () => {};
const server = app.listen(PORT, () => {
  console.log(`CivicSync API listening on port ${PORT}`);
  stopScheduler = startScheduler();
});
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received; shutting down`);
  stopScheduler();
  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();
  server.close(async (error) => {
    if (error) console.error('[server] HTTP close failed');
    try { await pool.end(); } catch { console.error('[db] pool shutdown failed'); }
    clearTimeout(forceExit);
    process.exit(error ? 1 : 0);
  });
}

process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });
