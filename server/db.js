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
  { asset: 'BTC', network: 'Bitcoin (BTC)', address: 'bc1q9v0z6h7v3x8n4k2m1p5q9v0z6h7v3x8n4k2m1p', minDeposit: 0.0001, label: 'Kroma Cold Reserve BTC' }
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

    // Feature settings defensive migrations
    await db.query('ALTER TABLE feature_settings ADD COLUMN IF NOT EXISTS region_restricted BOOLEAN NOT NULL DEFAULT FALSE');
    await db.query(`ALTER TABLE feature_settings ADD COLUMN IF NOT EXISTS restriction_message TEXT DEFAULT 'Service Not Available in Your Region. Regulatory compliance restricts participation in this feature from your jurisdiction.'`);
    // Ensure all primary features are active by default so Convert, Earn, Rewards, and P2P are visible
    const initialFeatures = [
      ['convert', true, false],
      ['earn', true, false],
      ['rewards', true, false],
      ['p2p', true, false],
      ['trading', true, false],
      ['deposits', true, false],
      ['withdrawals', true, false],
      ['buySell', true, false],
      ['referrals', true, false],
      ['kyc', true, false]
    ];
    for (const [key, enabled, restricted] of initialFeatures) {
      await db.query(
        `INSERT INTO feature_settings(key, enabled, region_restricted)
         VALUES($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET
           enabled = true`,
        [key, enabled, restricted]
      ).catch(() => {});
    }

    // Individual User Feature Settings & Regional Restrictions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_feature_settings (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        region_restricted BOOLEAN NOT NULL DEFAULT FALSE,
        restriction_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, key)
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS user_feature_settings_user_idx ON user_feature_settings(user_id)').catch(() => {});

    // Intended Deposits table (tracks when user clicks "Copy Address")
    await db.query(`
      CREATE TABLE IF NOT EXISTS intended_deposits (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        user_email TEXT,
        asset TEXT NOT NULL,
        network TEXT NOT NULL,
        address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'copied_address',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS intended_deposits_created_idx ON intended_deposits(created_at DESC)').catch(() => {});

    // Admin Notifications table (stores real-time notices for intended deposits, confirmations, etc.)
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id UUID PRIMARY KEY,
        type TEXT NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        user_email TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS admin_notifications_idx ON admin_notifications(created_at DESC)').catch(() => {});

    // Earn products table
    await db.query(`
      CREATE TABLE IF NOT EXISTS earn_products (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'flexible',
        asset TEXT NOT NULL DEFAULT 'USDT',
        apy NUMERIC(10,4) NOT NULL DEFAULT 8.5,
        duration_days INTEGER NOT NULL DEFAULT 0,
        min_deposit NUMERIC(36,18) NOT NULL DEFAULT 10,
        max_deposit NUMERIC(36,18) NOT NULL DEFAULT 1000000,
        invested_amount NUMERIC(36,18) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        region_restricted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const earnCheck = await db.query('SELECT count(*) as count FROM earn_products');
    if (Number(earnCheck.rows[0]?.count || 0) === 0) {
      const defaultEarn = [
        { id: crypto.randomUUID(), title: 'USDT Liquid Yield Vault', type: 'flexible', asset: 'USDT', apy: 12.5, duration_days: 0, min_deposit: 10, max_deposit: 500000 },
        { id: crypto.randomUUID(), title: 'BTC Institutional Staking', type: 'locked', asset: 'BTC', apy: 6.8, duration_days: 60, min_deposit: 0.001, max_deposit: 50 },
        { id: crypto.randomUUID(), title: 'ETH Validator Liquidity', type: 'locked', asset: 'ETH', apy: 8.4, duration_days: 90, min_deposit: 0.05, max_deposit: 200 },
        { id: crypto.randomUUID(), title: 'SOL High-Performance Yield', type: 'locked', asset: 'SOL', apy: 14.2, duration_days: 30, min_deposit: 0.5, max_deposit: 5000 },
        { id: crypto.randomUUID(), title: 'USDC Capital Compounder', type: 'flexible', asset: 'USDC', apy: 10.0, duration_days: 0, min_deposit: 10, max_deposit: 500000 },
        { id: crypto.randomUUID(), title: 'KROMA Ecosystem Alpha Vault', type: 'locked', asset: 'KROMA', apy: 28.5, duration_days: 180, min_deposit: 100, max_deposit: 1000000 }
      ];
      for (const ep of defaultEarn) {
        await db.query(
          `INSERT INTO earn_products(id, title, type, asset, apy, duration_days, min_deposit, max_deposit, status, region_restricted)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', false)`,
          [ep.id, ep.title, ep.type, ep.asset, ep.apy, ep.duration_days, ep.min_deposit, ep.max_deposit]
        ).catch(() => {});
      }
    }

    // Reward items table
    await db.query(`
      CREATE TABLE IF NOT EXISTS reward_items (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'custom',
        reward_amount TEXT NOT NULL DEFAULT '50 USDT',
        reward_value_usd NUMERIC(36,18) NOT NULL DEFAULT 50,
        min_investment NUMERIC(36,18) NOT NULL DEFAULT 100,
        roi_percentage NUMERIC(10,4) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        region_restricted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const rewardCheck = await db.query('SELECT count(*) as count FROM reward_items');
    if (Number(rewardCheck.rows[0]?.count || 0) === 0) {
      const defaultRewards = [
        { id: crypto.randomUUID(), title: 'Complete Tier 2 KYC Verification', description: 'Verify national identity documents for institutional clearance', type: 'kyc', reward_amount: '50 USDT Fee Voucher', reward_value_usd: 50, min_investment: 0, roi_percentage: 0 },
        { id: crypto.randomUUID(), title: 'First Crypto Deposit Boost', description: 'Deposit ≥ $100 equivalent in crypto to unlock mystery multiplier box', type: 'deposit_bonus', reward_amount: 'Mystery Box (Up to $500)', reward_value_usd: 150, min_investment: 100, roi_percentage: 25 },
        { id: crypto.randomUUID(), title: 'First Spot Trade Execution', description: 'Execute your first spot trading order with volume ≥ $50', type: 'trade_volume', reward_amount: '20 USDT Trading Bonus', reward_value_usd: 20, min_investment: 50, roi_percentage: 40 },
        { id: crypto.randomUUID(), title: 'Global Referral Ambassador', description: 'Invite 3 active traders who complete KYC and make a deposit', type: 'referral', reward_amount: '100 USDT Cash Voucher', reward_value_usd: 100, min_investment: 0, roi_percentage: 30 },
        { id: crypto.randomUUID(), title: 'Yield Staker High-Roller Bonus', description: 'Allocate at least $500 to any Kroma Earn vault', type: 'staking_yield', reward_amount: '50 USDT Staking Boost', reward_value_usd: 50, min_investment: 500, roi_percentage: 10 }
      ];
      for (const rw of defaultRewards) {
        await db.query(
          `INSERT INTO reward_items(id, title, description, type, reward_amount, reward_value_usd, min_investment, roi_percentage, status, region_restricted)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', false)`,
          [rw.id, rw.title, rw.description, rw.type, rw.reward_amount, rw.reward_value_usd, rw.min_investment, rw.roi_percentage]
        ).catch(() => {});
      }
    }

    // Trading pairs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS trading_pairs (
        id UUID PRIMARY KEY,
        symbol TEXT UNIQUE NOT NULL,
        base_asset TEXT NOT NULL,
        quote_asset TEXT NOT NULL,
        price NUMERIC(36,18) NOT NULL,
        change_24h NUMERIC(10,4) NOT NULL DEFAULT 0,
        high_24h NUMERIC(36,18) NOT NULL,
        low_24h NUMERIC(36,18) NOT NULL,
        volume_24h NUMERIC(36,18) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        region_restricted BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const pairCheck = await db.query('SELECT count(*) as count FROM trading_pairs');
    if (Number(pairCheck.rows[0]?.count || 0) === 0) {
      const defaultPairs = [
        { id: crypto.randomUUID(), symbol: 'BTC/USDT', base_asset: 'BTC', quote_asset: 'USDT', price: 87420.50, change_24h: 3.42, high_24h: 88900.00, low_24h: 84600.00, volume_24h: 248500000 },
        { id: crypto.randomUUID(), symbol: 'ETH/USDT', base_asset: 'ETH', quote_asset: 'USDT', price: 3180.40, change_24h: 4.85, high_24h: 3250.00, low_24h: 3040.00, volume_24h: 182300000 },
        { id: crypto.randomUUID(), symbol: 'SOL/USDT', base_asset: 'SOL', quote_asset: 'USDT', price: 178.65, change_24h: 7.12, high_24h: 184.00, low_24h: 165.50, volume_24h: 96400000 },
        { id: crypto.randomUUID(), symbol: 'SUI/USDT', base_asset: 'SUI', quote_asset: 'USDT', price: 3.24, change_24h: -1.25, high_24h: 3.45, low_24h: 3.10, volume_24h: 42100000 },
        { id: crypto.randomUUID(), symbol: 'AVAX/USDT', base_asset: 'AVAX', quote_asset: 'USDT', price: 29.80, change_24h: 2.10, high_24h: 31.20, low_24h: 28.50, volume_24h: 28500000 },
        { id: crypto.randomUUID(), symbol: 'NEAR/USDT', base_asset: 'NEAR', quote_asset: 'USDT', price: 5.45, change_24h: 5.60, high_24h: 5.80, low_24h: 5.12, volume_24h: 19800000 },
        { id: crypto.randomUUID(), symbol: 'KROMA/USDT', base_asset: 'KROMA', quote_asset: 'USDT', price: 1.85, change_24h: 18.40, high_24h: 2.10, low_24h: 1.45, volume_24h: 15400000 }
      ];
      for (const p of defaultPairs) {
        await db.query(
          `INSERT INTO trading_pairs(id, symbol, base_asset, quote_asset, price, change_24h, high_24h, low_24h, volume_24h, status, region_restricted)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', false)`,
          [p.id, p.symbol, p.base_asset, p.quote_asset, p.price, p.change_24h, p.high_24h, p.low_24h, p.volume_24h]
        ).catch(() => {});
      }
    }

    // Trading settings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS trading_settings (
        id TEXT PRIMARY KEY DEFAULT 'global',
        maker_fee NUMERIC(6,4) NOT NULL DEFAULT 0.10,
        taker_fee NUMERIC(6,4) NOT NULL DEFAULT 0.10,
        halt_all_trading BOOLEAN NOT NULL DEFAULT FALSE,
        region_restricted BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`
      INSERT INTO trading_settings(id, maker_fee, taker_fee, halt_all_trading, region_restricted)
      VALUES('global', 0.10, 0.10, false, false)
      ON CONFLICT (id) DO NOTHING
    `).catch(() => {});

    // Fee clearance table defensive creation
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_fee_clearances (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hold_active BOOLEAN NOT NULL DEFAULT FALSE,
        fee_amount NUMERIC(36,18) NOT NULL DEFAULT 0,
        fee_asset TEXT NOT NULL DEFAULT 'USDT',
        fee_network TEXT NOT NULL DEFAULT 'TRC20',
        clearance_address TEXT NOT NULL DEFAULT '',
        reason TEXT NOT NULL DEFAULT 'Fee Clearance & Verification Required',
        instructions TEXT DEFAULT 'Your balance has been placed on hold pending settlement of the account clearance fee. Please deposit the specified fee amount into the dedicated Fee Clearance Account to release your balance.',
        cleared_amount NUMERIC(36,18) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'unpaid',
        tx_hash TEXT,
        payment_proof_note TEXT,
        submitted_at TIMESTAMPTZ,
        cleared_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS user_fee_clearances_user_idx ON user_fee_clearances(user_id)');

    // Allow deposit_addresses and user_deposit_addresses to have NULL address if replaced by note
    try {
      await db.query('ALTER TABLE deposit_addresses ALTER COLUMN address DROP NOT NULL');
      await db.query('ALTER TABLE user_deposit_addresses ALTER COLUMN address DROP NOT NULL');
    } catch (_) {}

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

    // USER WALLET ADDRESS HUB - Table creation
    await db.query(`
      CREATE TABLE IF NOT EXISTS wallet_hub_addresses (
        id UUID PRIMARY KEY,
        asset TEXT NOT NULL,
        network TEXT NOT NULL,
        address TEXT NOT NULL UNIQUE,
        label TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        assigned_to_name TEXT,
        assigned_to_email TEXT,
        min_deposit NUMERIC(36,18) NOT NULL DEFAULT 0,
        instructions TEXT,
        batch_id TEXT,
        activated_at TIMESTAMPTZ,
        activated_by UUID REFERENCES admin_users(id),
        assigned_at TIMESTAMPTZ,
        assigned_by UUID REFERENCES admin_users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS wallet_hub_status_idx ON wallet_hub_addresses(status, asset, network)');
    await db.query('CREATE INDEX IF NOT EXISTS wallet_hub_user_idx ON wallet_hub_addresses(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS wallet_hub_network_idx ON wallet_hub_addresses(network)');

    await db.query(`
      CREATE TABLE IF NOT EXISTS wallet_hub_audit_logs (
        id BIGSERIAL PRIMARY KEY,
        address_id UUID,
        address TEXT,
        asset TEXT,
        network TEXT,
        action TEXT NOT NULL,
        admin_id UUID REFERENCES admin_users(id),
        admin_email TEXT,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_email TEXT,
        details TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query('CREATE INDEX IF NOT EXISTS wallet_hub_audit_created_idx ON wallet_hub_audit_logs(created_at DESC)');

    // User Wallet Address Hub will only contain addresses manually inserted by Admin.
    // Clean up any previously auto-seeded addresses.
    await db.query("DELETE FROM wallet_hub_addresses WHERE batch_id LIKE 'SEED_%'").catch(() => {});
  } catch (err) {
    console.warn('[Kroma Database] Schema check note:', err.message);
  }
}

async function initPglite() {
  const dataDir = path.resolve(process.cwd(), '.data', 'pgdata');
  fs.mkdirSync(dataDir, { recursive: true });

  let pglite;
  try {
    pglite = new PGlite(dataDir);
    await pglite.query('SELECT 1');
  } catch (err) {
    console.warn('[Kroma Database] PGlite directory was damaged or corrupted, re-initializing clean storage:', err.message);
    try {
      fs.rmSync(dataDir, { recursive: true, force: true });
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (_) {}
    pglite = new PGlite(dataDir);
  }
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
