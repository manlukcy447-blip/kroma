import crypto from 'node:crypto';
const key = process.argv[2];
if (!key || key.length < 24) { console.error('Usage: npm.cmd run db:generate-recovery -- YourRecoveryKeyOfAtLeast24Characters'); process.exit(1); }
console.log(`ADMIN_RECOVERY_KEY_HASH=${crypto.createHash('sha256').update(key).digest('hex')}`);
console.log('Store the recovery key itself offline. Do not commit it to Git or paste it into chat.');
