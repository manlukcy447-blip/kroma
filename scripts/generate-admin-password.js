import crypto from 'node:crypto';
const password = process.argv[2];
if (!password) { console.error('Usage: npm run db:generate-admin -- YourStrongPassword'); process.exit(1); }
const salt = crypto.randomBytes(16).toString('hex');
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`);
