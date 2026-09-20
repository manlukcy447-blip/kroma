import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;

let activePool = null;
let isPglite = false;

// Transaction lock queue for single-process PGlite transactions
let transactionQueue = Promise.resolve();
function acquireLock() {
  let releaseLock;
  const lockPromise = new Promise(resolve => { releaseLock = resolve; });
  const prevQueue = transactionQueue;
  transactionQueue = transactionQueue.then(() => lockPromise);
  return prevQueue.then(() => releaseLock);
}

const defaultDepositAddresses = [
  { asset: 'BTC', network: 'Bitcoin (BTC)', address: 'bc1q9v0z6h7v3x8n4k2m1p5q9v0z6h7v3x8n4k2m1p', minDeposit: 0.0001, label: 'Kroma Cold Reserve BTC' },
  { asset: 'ETH', network: 'Ethereum (ERC20)', address: '0x71C941A598D80F1668B880b9794E737299a9a3b6', minDeposit: 0.005, label: 'Kroma Cold Reserve ETH' },
  { asset: 'USDT', network: 'Ethereum (ERC20)', address: '0x71C941A598D80F1668B880b9794E737299a9a3b6', minDeposit: 10, label: 'Kroma Treasury USDT ERC20' },
  { asset: 'USDT', network: 'Tron (TRC20)', address: 'TYD988xKromaTreasuryVault7729104TRC20xAddr', minDeposit: 10, label: 'Kroma Treasury USDT TRC20' },
  { asset: 'USDC', network: 'Ethereum (ERC20)', address: '0x71C941A598D80F1668B880b9794E737299a9a3b6', minDeposit: 10, label: 'Kroma Treasury USDC' },
  { asset: 'SOL', network: 'Solana (SOL)', address: '7NxKromaTreasuryVaultSolanaAddressAlpha9921', minDeposit: 0.05, label: 'Kroma Solana Reserve' },
  { asset: 'SUI', network: 'Sui Network', address: '0x889a71bKromaSuiTreasuryVaultStorage992100', minDeposit: 1, label: 'Kroma Sui Reserve' },
  { asset: 'AVAX', network: 'Avalanche C-Chain', address: '0x71C941A598D80F1668B880b9794E737299a9a3b6', minDeposit: 0.1, label: 'Kroma Avalanche Reserve' },
  { asset: 'NEAR', network: 'NEAR Protocol', address: 'kroma-treasury.near', minDeposit: 0.5, label: 'Kroma NEAR Reserve' }
];

async function ensureSchema(db) {
  try {
    const tableCheck = await db.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'users'");
    if (!tableCheck.rowCount) {
      const sqlPath = path.resolve(process.cwd(), 'server', 'db.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        if (typeof db.exec === 'function') {
          await db.exec(sql);
        } else {
          await db.query(sql);
        }
      }
    }

    // Defensive schema migrations
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0');
    await db.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0');

    // Transactions migrations
    await db.query("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'transfer'");
    await db.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS network TEXT');
    await db.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tx_hash TEXT');

    // Spot orders migrations (support both order_type and type)
    await db.query("ALTER TABLE spot_orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'limit'");
    await db.query("ALTER TABLE spot_orders ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'limit'");
    await db.query("UPDATE spot_orders SET order_type = COALESCE(order_type, type, 'limit') WHERE order_type IS NULL");
    await db.query("UPDATE spot_orders SET type = COALESCE(type, order_type, 'limit') WHERE type IS NULL");

    // Seed default deposit addresses if empty
    const addrCheck = await db.query('SELECT count(*) as count FROM deposit_addresses');
    if (Number(addrCheck.rows[0]?.count || 0) === 0) {
      for (const item of defaultDepositAddresses) {
        await db.query(
          `INSERT INTO deposit_addresses(id, asset, network, address, min_deposit, label, enabled)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (asset, network) DO NOTHING`,
          [crypto.randomUUID(), item.asset, item.network, item.address, item.minDeposit, item.label]
        );
      }
    }
  } catch (err) {
    console.warn('[Kroma Database] Schema check note:', err.message);
  }
}

async function initPglite() {
  const dataDir = path.resolve(process.cwd(), '.data', 'pgdata');
  fs.mkdirSync(dataDir, { recursive: true });

  const pglite = new PGlite(dataDir);
  isPglite = true;

  await ensureSchema(pglite);

  activePool = {
    isPglite: true,
    async query(text, params) {
      return await pglite.query(text, params);
    },
    async connect() {
      const releaseLock = await acquireLock();
      let released = false;
      return {
        query: (text, params) => pglite.query(text, params),
        release: () => {
          if (!released) {
            released = true;
            releaseLock();
          }
        }
      };
    },
    on(event, handler) {
      // noop for PGlite
    }
  };

  return activePool;
}

let initPromise = null;
export async function getDbPool() {
  if (activePool) return activePool;
  if (initPromise) return await initPromise;

  initPromise = (async () => {
    if (DATABASE_URL) {
      try {
        const pgPool = new Pool({
          connectionString: DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
          connectionTimeoutMillis: 3000
        });
        // Fast probe
        await pgPool.query('SELECT 1');
        await ensureSchema(pgPool);
        activePool = pgPool;
        isPglite = false;
        console.log('[Kroma Database] Connected to external PostgreSQL database.');
        return activePool;
      } catch (err) {
        console.warn('[Kroma Database] External PostgreSQL connection failed, falling back to embedded PGlite:', err.message);
      }
    }

    console.log('[Kroma Database] Initializing embedded persistent PostgreSQL (PGlite)...');
    return await initPglite();
  })();

  return await initPromise;
}

// Lazy proxy pool so that existing imports `pool.query` work synchronously or await properly
export const pool = {
  get isPglite() {
    return isPglite;
  },
  async query(text, params) {
    const p = await getDbPool();
    return await p.query(text, params);
  },
  async connect() {
    const p = await getDbPool();
    return await p.connect();
  },
  on(event, handler) {
    if (activePool?.on) {
      activePool.on(event, handler);
    }
  }
};
