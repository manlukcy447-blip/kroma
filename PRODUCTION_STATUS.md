# Kroma Vault — implementation status

## Completed in this package

- PostgreSQL-backed user accounts, wallet ledger, transactions and orders.
- Server-authoritative balances; the browser cannot mint or directly set balances.
- HttpOnly authenticated user and admin sessions.
- Password hashing with scrypt and password-reset token hashing/expiry.
- Admin Control Center with deposit-address management and withdrawal approval/rejection/completion.
- Admin audit logs, feature flags, network registry, integration registry and risk-event monitoring.
- Deposit requests remain pending until blockchain verification or an authorized admin confirmation.
- Admin-controlled deposit wallet addresses, minimum deposits and network instructions.
- Withdrawal balance reservation/debit, risk checks, admin approval, rejection refund and completion by external tx hash.
- EVM JSON-RPC verification adapter for supported configured networks.
- Optional authenticator/TOTP protection for administrators.
- Spot order persistence without pretending orders are filled.
- Honest feature gates for P2P, fiat Buy/Sell, Convert, Earn and Rewards until their required external providers are connected.
- Removed client-side fake market-price ticking.
- UI polish: responsive surfaces, stronger hierarchy, consistent cards/forms, mobile-friendly spacing, clearer provider-status messaging and safer empty/disabled states.
- Free-trial deployment files: Dockerfile and Render configuration.
- Resend API support for password-reset email with SMTP fallback.

## Intentionally not simulated

Kroma does **not** fake live custody, blockchain signing, fiat payments, exchange liquidity/matching, KYC/AML provider decisions, P2P escrow, yield accrual, rewards crediting or real-time market feeds. Those require external providers, credentials, compliance controls and operational infrastructure.

## Before real-money launch

1. Managed PostgreSQL with backups/PITR.
2. Production secret manager and key rotation.
3. Independent security review and penetration testing.
4. Real custody/MPC/HSM or reputable custody provider isolated from the web API.
5. Blockchain indexers/RPCs and deposit/withdrawal reconciliation for every supported network.
6. Real exchange matching engine or liquidity provider.
7. Licensed fiat/payment rails where required.
8. KYC/AML, sanctions and blockchain address-screening provider.
9. Multi-person withdrawal approval and operational monitoring/alerting.
10. Legal/compliance review for the jurisdictions in which Kroma will operate.
