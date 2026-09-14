# Kroma production setup

## What is now server-backed
- PostgreSQL user accounts and sessions
- Password reset tokens
- PostgreSQL wallet balances
- Ledger entries for balance-changing operations
- Internal Spot/Funding/Earn transfers
- Deposit requests (pending until verified)
- Withdrawal requests and admin review
- Persistent spot orders (open/canceled)
- Admin wallet/deposit/withdrawal monitoring
- Admin-controlled deposit addresses
- Feature flags and audit logs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a managed PostgreSQL database and set `DATABASE_URL`.

3. Configure secrets using `.env.example` as a template. Never commit `.env`.

4. Generate an admin password hash:
```bash
npm run db:generate-admin -- "YOUR-STRONG-PASSWORD"
```

5. Run the idempotent schema migration:
```bash
npm run db:migrate
```

6. Start the API/server:
```bash
npm run start
```

For local development with Vite and the API separately:
```bash
npm run dev
npm run server
```

## Important production boundary

The application does not pretend that blockchain custody, blockchain indexing, trading execution, fiat payment processing, or KYC/AML are live when those external services have not been configured.

Before real-money launch, connect:
- blockchain RPC/indexer or custody provider for every supported network
- isolated signing/custody infrastructure (HSM/MPC or reputable custody provider)
- deposit confirmation worker
- withdrawal broadcast/confirmation worker
- real trading matching engine or liquidity provider
- real fiat/payment providers
- KYC/AML and sanctions/address screening providers
- monitoring, alerting, backups and disaster recovery
- independent penetration/security review

The web API must never contain private keys or seed phrases.
