import fs from 'node:fs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required'); process.exit(1); }
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL, ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined});
const sql=fs.readFileSync(new URL('../server/db.sql', import.meta.url),'utf8');
try {
  await pool.query(sql);
  // Existing installations may have the original users table without passwords.
  // Keep those rows intact; users without a password can recover access through the reset flow.
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0');
  await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0');
  await pool.query('CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email))');
  console.log('Database migration complete.');
} finally { await pool.end(); }
