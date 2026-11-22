import 'dotenv/config';

const sslErrorCodes = new Set([
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA',
  'ERR_SSL_WRONG_VERSION_NUMBER',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
]);

function diagnose(error) {
  const rawCode = typeof error?.code === 'string' ? error.code : '';
  const code = /^[A-Za-z0-9_]+$/.test(rawCode) ? rawCode : 'UNKNOWN';
  const message = typeof error?.message === 'string' ? error.message : '';

  if (sslErrorCodes.has(rawCode) || /\b(?:ssl|tls|certificate)\b/i.test(message)) {
    return {
      code,
      category: 'SSL/TLS',
      diagnostic: 'The encrypted connection or certificate verification failed. Keep SSL enabled and verify the configured CA certificate and connection endpoint.',
    };
  }
  if (rawCode === 'ENOTFOUND' || rawCode === 'EAI_AGAIN') {
    return {
      code,
      category: 'hostname/DNS',
      diagnostic: 'The database hostname could not be resolved. Verify the endpoint copied from Supabase Connect and check DNS availability.',
    };
  }
  if (rawCode.startsWith('28') || /password authentication failed|authentication failed|no pg_hba\.conf entry/i.test(message)) {
    return {
      code,
      category: 'authentication',
      diagnostic: 'PostgreSQL rejected the login. Verify the database password and the username from the Supabase connection details locally.',
    };
  }
  if (['ERR_INVALID_URL', 'ENOENT'].includes(rawCode) || /DATABASE_URL is not configured|invalid url/i.test(message)) {
    return {
      code,
      category: 'connection configuration',
      diagnostic: 'The database URL or a configured local connection file is missing or invalid. Check backend/.env without sharing its values.',
    };
  }
  if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'EPIPE'].includes(rawCode) || rawCode.startsWith('08')) {
    return {
      code,
      category: 'network/connection',
      diagnostic: 'The database endpoint did not establish a connection. Check network reachability and the selected Supabase connection mode.',
    };
  }
  if (rawCode === '3D000') {
    return {
      code,
      category: 'database configuration',
      diagnostic: 'The requested database does not exist on the connected server. Verify the database name from Supabase Connect.',
    };
  }
  if (rawCode === '53300') {
    return {
      code,
      category: 'connection capacity',
      diagnostic: 'PostgreSQL has no available connection slots. Check the pool size and Supabase connection limits.',
    };
  }
  return {
    code,
    category: 'database connection',
    diagnostic: 'The connection failed for an unclassified reason. Use the error code to investigate; raw server details and credentials were withheld.',
  };
}

let pool;
try {
  // Dynamic import also lets this command safely classify URL/configuration
  // errors raised while the pool is being constructed.
  ({ pool } = await import('../config/db.js'));
  const { rows } = await pool.query('SELECT current_database() AS database_name');
  console.log(`Database connection OK (${rows[0].database_name}).`);
} catch (error) {
  const diagnostic = diagnose(error);
  console.error('Database connection failed.');
  console.error(`Error code: ${diagnostic.code}`);
  console.error(`Category: ${diagnostic.category}`);
  console.error(`Diagnostic: ${diagnostic.diagnostic}`);
  process.exitCode = 1;
} finally {
  if (pool) await pool.end().catch(() => {});
}
