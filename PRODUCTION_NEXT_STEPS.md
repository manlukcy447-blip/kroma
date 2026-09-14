# Kroma production activation checklist

## Safe trial
1. Use Supabase PostgreSQL.
2. Configure `RPC_ETHEREUM_SEPOLIA_URL` from a legitimate RPC provider.
3. Run `node scripts/seed-production-sandbox.js`.
4. Configure a testnet receiving address through the existing Admin Control Center.
5. Submit testnet deposits with transaction hashes.
6. Use Admin -> verify-onchain to verify confirmations.
7. Test withdrawal risk checks and admin approval.
8. Enable admin TOTP at `/api/admin/2fa/setup` and `/api/admin/2fa/enable`.

## Real-money activation requires separate services
- institutional custody/HSM/MPC provider for signing
- KYC/AML and sanctions provider
- real liquidity/matching engine
- fiat payment provider
- transaction/address screening
- managed monitoring/alerting
- managed backups/PITR
- independent penetration test and legal/compliance review

Never put private keys in `DATABASE_URL`, `.env` committed to Git, browser code, or PostgreSQL.
