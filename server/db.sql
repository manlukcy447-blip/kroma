CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  totp_secret TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  session_version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS deposit_addresses (
  id UUID PRIMARY KEY,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT,
  min_deposit NUMERIC(36,18) NOT NULL DEFAULT 0,
  instructions TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset, network)
);

CREATE TABLE IF NOT EXISTS feature_settings (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  kyc_status TEXT NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  password_hash TEXT NOT NULL,
  last_login_at TIMESTAMPTZ,
  session_version INTEGER NOT NULL DEFAULT 0
);



CREATE TABLE IF NOT EXISTS user_deposit_addresses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT,
  min_deposit NUMERIC(36,18) NOT NULL DEFAULT 0,
  instructions TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, asset, network)
);
CREATE INDEX IF NOT EXISTS user_deposit_addresses_user_idx ON user_deposit_addresses(user_id, asset, network);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount NUMERIC(36,18) NOT NULL,
  status TEXT NOT NULL,
  tx_hash TEXT,
  network TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO feature_settings(key, enabled) VALUES
('deposits', true), ('withdrawals', true), ('trading', true), ('p2p', true),
('buySell', true), ('convert', true), ('earn', true), ('rewards', true),
('referrals', true), ('kyc', true)
ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled;


-- Production wallet/ledger foundation. Amounts are stored as NUMERIC, never JS floats.
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL, account_type TEXT NOT NULL DEFAULT 'spot',
  available NUMERIC(36,18) NOT NULL DEFAULT 0, locked NUMERIC(36,18) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, asset, account_type),
  CHECK(account_type IN ('spot','funding','earn'))
);
CREATE INDEX IF NOT EXISTS wallets_user_idx ON wallets(user_id);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGSERIAL PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id), asset TEXT NOT NULL, account_type TEXT NOT NULL,
  entry_type TEXT NOT NULL, amount NUMERIC(36,18) NOT NULL, reference_type TEXT, reference_id TEXT,
  idempotency_key TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ledger_user_idx ON ledger_entries(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ledger_idempotency_idx ON ledger_entries(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS deposit_requests (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL, network TEXT NOT NULL, amount NUMERIC(36,18), tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending', confirmations INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(network, tx_hash)
);
CREATE INDEX IF NOT EXISTS deposit_requests_user_idx ON deposit_requests(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL, network TEXT NOT NULL, address TEXT NOT NULL, amount NUMERIC(36,18) NOT NULL,
  fee NUMERIC(36,18) NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending_security',
  tx_hash TEXT, failure_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS withdrawal_requests_user_idx ON withdrawal_requests(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS internal_transfers (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, asset TEXT NOT NULL,
  from_account TEXT NOT NULL, to_account TEXT NOT NULL, amount NUMERIC(36,18) NOT NULL, status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spot_orders (
  id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, pair TEXT NOT NULL,
  side TEXT NOT NULL, order_type TEXT NOT NULL, price NUMERIC(36,18), amount NUMERIC(36,18) NOT NULL,
  filled NUMERIC(36,18) NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS spot_orders_user_idx ON spot_orders(user_id, created_at DESC);


-- Production integration/control layer. Provider credentials are stored only in environment/secret managers.
CREATE TABLE IF NOT EXISTS network_configs (
  id UUID PRIMARY KEY,
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  chain_type TEXT NOT NULL DEFAULT 'evm',
  chain_id TEXT,
  rpc_url TEXT,
  explorer_url TEXT,
  confirmations_required INTEGER NOT NULL DEFAULT 12,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  testnet BOOLEAN NOT NULL DEFAULT TRUE,
  native_asset TEXT,
  token_contract TEXT,
  token_decimals INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset, network)
);

CREATE TABLE IF NOT EXISTS integration_settings (
  key TEXT PRIMARY KEY,
  provider TEXT,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mode TEXT NOT NULL DEFAULT 'sandbox',
  public_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS kyc_cases (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  risk_level TEXT NOT NULL DEFAULT 'unknown',
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kyc_cases_user_idx ON kyc_cases(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS risk_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  withdrawal_id UUID REFERENCES withdrawal_requests(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS risk_events_open_idx ON risk_events(status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_approval_steps (
  id UUID PRIMARY KEY,
  withdrawal_id UUID NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  admin_id UUID REFERENCES admin_users(id),
  decision TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(withdrawal_id, step)
);

CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

-- Fee clearance balance hold control table
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
);
CREATE INDEX IF NOT EXISTS user_fee_clearances_user_idx ON user_fee_clearances(user_id);
