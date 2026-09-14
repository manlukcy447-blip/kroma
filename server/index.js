import express from 'express';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import nodemailer from 'nodemailer';

dotenv.config();
const { Pool } = pg;
const app = express();
const PORT = Number(process.env.PORT || 4000);
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const USER_JWT_SECRET = process.env.USER_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!DATABASE_URL) console.warn('DATABASE_URL is not set. The API will not start correctly until PostgreSQL is configured.');
if (!JWT_SECRET) console.warn('ADMIN_JWT_SECRET is not set. Admin authentication requires this secret.');

const pool = new Pool({ connectionString: DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const origin = process.env.FRONTEND_ORIGIN;
  if (origin && req.headers.origin === origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}
function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored || '').split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}
function b64url(value) { return Buffer.from(value).toString('base64url'); }
function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}
function verifyToken(token) {
  const [header, body, sig] = String(token || '').split('.');
  if (!header || !body || !sig) return null;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}


function base32Decode(input){
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; const clean=String(input||'').replace(/=+$/,'').toUpperCase(); let bits='';
  for(const c of clean){const i=alphabet.indexOf(c); if(i<0) throw new Error('Invalid base32'); bits+=i.toString(2).padStart(5,'0');}
  const out=[]; for(let i=0;i+8<=bits.length;i+=8) out.push(parseInt(bits.slice(i,i+8),2)); return Buffer.from(out);
}
function totp(secret,time=Date.now()){const counter=Math.floor(time/1000/30); const b=Buffer.alloc(8); b.writeBigUInt64BE(BigInt(counter)); const mac=crypto.createHmac('sha1',base32Decode(secret)).update(b).digest(); const off=mac[mac.length-1]&15; const code=((mac[off]&127)<<24|(mac[off+1]<<16)|(mac[off+2]<<8)|mac[off+3])%1000000; return String(code).padStart(6,'0');}
function verifyTotp(secret,code){const c=String(code||'').replace(/\D/g,''); for(const d of [-1,0,1]) if(totp(secret,Date.now()+d*30000)===c) return true; return false;}
function randomBase32(){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; const bytes=crypto.randomBytes(20); let out=''; let buffer=0,bits=0; for(const x of bytes){buffer=(buffer<<8)|x;bits+=8;while(bits>=5){bits-=5;out+=alphabet[(buffer>>bits)&31];}} if(bits) out+=alphabet[(buffer<<(5-bits))&31]; return out;}
async function ensureAdmin() {
  if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) return;
  const result = await pool.query('SELECT id FROM admin_users WHERE email=$1', [ADMIN_EMAIL]);
  if (result.rowCount === 0) {
    await pool.query('INSERT INTO admin_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)', [crypto.randomUUID(), ADMIN_EMAIL, ADMIN_PASSWORD_HASH, 'super_admin']);
  }
}


function signUserToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', USER_JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}
function verifyUserToken(token) {
  try {
    const [header, body, sig] = String(token || '').split('.');
    if (!header || !body || !sig) return null;
    const expected = crypto.createHmac('sha256', USER_JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now()/1000) || !payload.userId) return null;
    return payload;
  } catch { return null; }
}
function getCookie(req, name) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
}
function requireUser(req,res,next){
  const token=getCookie(req,'kroma_session'); const user=verifyUserToken(token);
  if(!user) return res.status(401).json({error:'Unauthorized'});
  req.user=user; next();
}
function passwordValid(password){ return typeof password==='string' && password.length>=10 && password.length<=128; }
function hashResetToken(token){ return crypto.createHash('sha256').update(token).digest('hex'); }
async function sendResetEmail(to, resetUrl) {
  const subject='Reset your Kroma password';
  const text=`Use this link to reset your Kroma password. It expires in 30 minutes:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html=`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Kroma password reset</h2><p>Use the button below to reset your password. The link expires in 30 minutes.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#22d3ee;color:#071019;text-decoration:none;border-radius:8px;font-weight:700">Reset password</a></p><p style="color:#64748b">If you did not request this, you can ignore this email.</p></div>`;
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.MAIL_FROM,to:[to],subject,text,html})});
    if(!r.ok) throw new Error('Transactional email provider rejected the message');
    return;
  }
  const required=['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','MAIL_FROM'];
  if(required.some(k=>!process.env[k])) throw new Error('Email service is not configured');
  const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT),secure:process.env.SMTP_SECURE==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
  await transporter.sendMail({from:process.env.MAIL_FROM,to,subject,text,html});
}

const authAttempts=new Map();
function authRateLimit(req,res,next){
  const key=`${req.ip}:${String(req.body?.email||'').toLowerCase()}`; const now=Date.now(); let x=authAttempts.get(key)||{count:0,reset:now+15*60_000};
  if(now>x.reset)x={count:0,reset:now+15*60_000}; if(x.count>=10)return res.status(429).json({error:'Too many attempts. Please try again later.'}); req.authAttempt={key,x}; next();
}
function bumpAuth(req){req.authAttempt.x.count++;authAttempts.set(req.authAttempt.key,req.authAttempt.x)}

function getAuthToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)kroma_admin=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}
function requireAdmin(req, res, next) {
  try {
    const token = getAuthToken(req);
    const user = verifyToken(token);
    if (!user || !user.adminId || !['admin', 'super_admin'].includes(user.role)) return res.status(401).json({ error: 'Unauthorized' });
    req.admin = user;
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
}

const loginAttempts = new Map();
function loginRateLimit(req, res, next) {
  const key = `${req.ip}:${String(req.body?.email || '').toLowerCase()}`;
  const now = Date.now();
  const existing = loginAttempts.get(key) || { count: 0, reset: now + 15 * 60_000 };
  if (now > existing.reset) { existing.count = 0; existing.reset = now + 15 * 60_000; }
  if (existing.count >= 10) return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
  req.loginAttempt = { key, existing };
  next();
}

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, database: 'connected' }); }
  catch { res.status(503).json({ ok: false, database: 'unavailable' }); }
});


app.post('/api/auth/signup', authRateLimit, async (req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase(); const password=req.body?.password;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:'Enter a valid email address.'});
  if(!passwordValid(password)) return res.status(400).json({error:'Password must be 10-128 characters.'});
  try{
    const exists=await pool.query('SELECT id FROM users WHERE lower(email)=lower($1)',[email]);
    if(exists.rowCount)return res.status(409).json({error:'An account with that email already exists.'});
    const id=crypto.randomUUID(); const passwordHash=hashPassword(password);
    await pool.query('INSERT INTO users(id,email,password_hash,status,kyc_status) VALUES($1,$2,$3,$4,$5)',[id,email,passwordHash,'active','unverified']);
    const starterAssets=['BTC','ETH','USDT','USDC','SOL','SUI','AVAX','NEAR'];
    for (const asset of starterAssets) for (const accountType of ['spot','funding','earn']) await pool.query('INSERT INTO wallets(id,user_id,asset,account_type) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,asset,account_type) DO NOTHING',[crypto.randomUUID(),id,asset,accountType]);
    const token=signUserToken({userId:id,email,version:0,exp:Math.floor(Date.now()/1000)+60*60*24*7});
    res.setHeader('Set-Cookie',`kroma_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7*24*60*60}${process.env.NODE_ENV==='production'?'; Secure':''}`);
    res.status(201).json({user:{id,email,status:'active',kycStatus:'unverified'}});
  }catch(e){console.error(e);res.status(500).json({error:'Unable to create account.'})}
});

app.post('/api/auth/login', authRateLimit, async (req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase(); const password=req.body?.password||'';
  try{const {rows}=await pool.query('SELECT id,email,password_hash,status,kyc_status FROM users WHERE lower(email)=lower($1)',[email]); const u=rows[0];
    if(!u || !u.password_hash || !verifyPassword(password,u.password_hash)){bumpAuth(req);return res.status(401).json({error:'Invalid email or password.'});}
    if(u.status!=='active')return res.status(403).json({error:'This account is not active.'});
    await pool.query('UPDATE users SET last_login_at=NOW() WHERE id=$1',[u.id]);
    const token=signUserToken({userId:u.id,email:u.email,version:u.session_version||0,exp:Math.floor(Date.now()/1000)+60*60*24*7});
    res.setHeader('Set-Cookie',`kroma_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7*24*60*60}${process.env.NODE_ENV==='production'?'; Secure':''}`);
    res.json({user:{id:u.id,email:u.email,status:u.status,kycStatus:u.kyc_status}});
  }catch(e){console.error(e);res.status(500).json({error:'Unable to sign in.'})}
});
app.get('/api/auth/me', requireUser, async(req,res)=>{try{const {rows}=await pool.query('SELECT id,email,status,kyc_status AS "kycStatus",created_at AS "createdAt",session_version FROM users WHERE id=$1',[req.user.userId]);if(!rows[0] || Number(rows[0].session_version)!==Number(req.user.version||0))return res.status(401).json({error:'Session expired'});const {session_version,...safe}=rows[0];res.json({user:safe})}catch{res.status(500).json({error:'Unable to load session'})}});
app.post('/api/auth/logout', requireUser, async(_req,res)=>{res.setHeader('Set-Cookie','kroma_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');res.status(204).end()});

app.post('/api/auth/forgot-password', async(req,res)=>{
  const email=String(req.body?.email||'').trim().toLowerCase();
  if(!email)return res.status(400).json({error:'Email is required.'});
  try{
    const {rows}=await pool.query('SELECT id,email FROM users WHERE lower(email)=lower($1)',[email]);
    // Always return the same response to avoid account enumeration.
    if(rows[0]){
      const raw=crypto.randomBytes(32).toString('base64url'); const hash=hashResetToken(raw);
      await pool.query('DELETE FROM password_reset_tokens WHERE user_id=$1 OR expires_at<NOW()',[rows[0].id]);
      await pool.query('INSERT INTO password_reset_tokens(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL \'30 minutes\')',[crypto.randomUUID(),rows[0].id,hash]);
      const base=process.env.FRONTEND_ORIGIN || `http://localhost:${PORT}`; const resetUrl=`${base}/reset-password?token=${encodeURIComponent(raw)}`;
      try { await sendResetEmail(rows[0].email,resetUrl); }
      catch(e){ console.error('Reset email delivery failed:',e.message); if(process.env.NODE_ENV!=='production') console.log('DEV RESET URL:',resetUrl); else return res.status(503).json({error:'Password reset email service is temporarily unavailable.'}); }
    }
    res.json({message:'If an account exists for that email, reset instructions have been sent.'});
  }catch(e){console.error(e);res.status(500).json({error:'Unable to process reset request.'})}
});
app.post('/api/auth/reset-password', async(req,res)=>{
  const token=String(req.body?.token||''); const password=req.body?.password;
  if(!token || !passwordValid(password))return res.status(400).json({error:'Invalid reset request.'});
  const client=await pool.connect();
  try{await client.query('BEGIN'); const {rows}=await client.query('SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>NOW() FOR UPDATE',[hashResetToken(token)]); const t=rows[0]; if(!t){await client.query('ROLLBACK');return res.status(400).json({error:'This reset link is invalid or expired.'});}
    await client.query('UPDATE users SET password_hash=$1, session_version=session_version+1 WHERE id=$2',[hashPassword(password),t.user_id]); await client.query('UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1',[t.id]); await client.query('COMMIT'); res.json({message:'Password updated successfully.'});
  }catch(e){await client.query('ROLLBACK').catch(()=>{});console.error(e);res.status(500).json({error:'Unable to reset password.'})}finally{client.release()}
});



function positiveAmount(v) { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; }
async function getWalletBalances(userId) {
  const { rows } = await pool.query(`SELECT asset, account_type AS "accountType", available, locked FROM wallets WHERE user_id=$1 ORDER BY asset, account_type`, [userId]);
  const out = {};
  for (const r of rows) { out[r.asset] ||= { spot:0, funding:0, earn:0, locked:0 }; out[r.asset][r.accountType] = Number(r.available); out[r.asset].locked += Number(r.locked); }
  return out;
}
async function ensureWallet(client, userId, asset, accountType='spot') {
  const { rows } = await client.query(`INSERT INTO wallets(id,user_id,asset,account_type) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,asset,account_type) DO UPDATE SET updated_at=NOW() RETURNING id`, [crypto.randomUUID(), userId, asset, accountType]);
  return rows[0].id;
}
async function changeAvailable(client, userId, asset, accountType, delta, referenceType, referenceId, metadata={}) {
  const walletId = await ensureWallet(client,userId,asset,accountType);
  const amount = String(delta);
  const entryType = Number(delta) >= 0 ? 'credit' : 'debit';
  const updated = await client.query(`UPDATE wallets SET available=available + $1::numeric,updated_at=NOW() WHERE id=$2 AND available + $1::numeric >= 0 RETURNING available`,[amount,walletId]);
  if (!updated.rowCount) throw new Error(`INSUFFICIENT_${asset}`);
  await client.query(`INSERT INTO ledger_entries(user_id,wallet_id,asset,account_type,entry_type,amount,reference_type,reference_id,metadata) VALUES($1,$2,$3,$4,$5,$6::numeric,$7,$8,$9)`,[userId,walletId,asset,accountType,entryType,amount,referenceType,referenceId,JSON.stringify(metadata)]);
}


function safeEqualText(a,b){
  const aa=Buffer.from(String(a||'')); const bb=Buffer.from(String(b||''));
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
function rpcUrlForNetwork(network){
  const key=String(network||'').toUpperCase().replace(/[^A-Z0-9]+/g,'_');
  return process.env[`RPC_${key}_URL`] || null;
}
async function rpcCall(url, method, params){
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  if(!r.ok) throw new Error(`RPC_HTTP_${r.status}`);
  const j=await r.json(); if(j.error) throw new Error(j.error.message||'RPC error'); return j.result;
}
function hexToBigInt(hex){ return BigInt(hex || '0x0'); }
function normalizeHexAddress(a){ return String(a||'').toLowerCase().replace(/^0x/,'0x'); }
async function verifyEvmDeposit({asset,network,txHash,expectedAddress,expectedAmount,tokenContract,tokenDecimals}){
  const url=rpcUrlForNetwork(network); if(!url) throw new Error('RPC_NOT_CONFIGURED');
  const tx=await rpcCall(url,'eth_getTransactionByHash',[txHash]);
  const receipt=await rpcCall(url,'eth_getTransactionReceipt',[txHash]);
  if(!tx || !receipt) return {verified:false,reason:'Transaction not found yet'};
  if(receipt.status!=='0x1') return {verified:false,reason:'Transaction failed'};
  const confirmationsRequired=Number(process.env[`CONFIRMATIONS_${String(network).toUpperCase().replace(/[^A-Z0-9]+/g,'_')}`]||12);
  const latest=await rpcCall(url,'eth_blockNumber',[]);
  const confirmations=Number(hexToBigInt(latest)-hexToBigInt(receipt.blockNumber));
  if(confirmations < confirmationsRequired) return {verified:false,reason:'Waiting for confirmations',confirmations};
  const expected=String(expectedAddress).toLowerCase();
  if(tokenContract){
    const topic0='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55aebf7d1b3b';
    for(const log of (receipt.logs||[])){
      if(String(log.address).toLowerCase()!==String(tokenContract).toLowerCase()) continue;
      if(!log.topics || log.topics[0]!==topic0 || !log.topics[2]) continue;
      const to='0x'+String(log.topics[2]).slice(-40);
      if(to.toLowerCase()!==expected) continue;
      const raw=hexToBigInt(log.data);
      const divisor=10n**BigInt(Number(tokenDecimals||18));
      const expectedRaw=expectedAmount==null?null:BigInt(Math.round(Number(expectedAmount)*10**Number(tokenDecimals||18)));
      if(expectedRaw!==null && raw < expectedRaw) continue;
      return {verified:true,confirmations,amount:Number(raw)/10**Number(tokenDecimals||18),txHash};
    }
    return {verified:false,reason:'Matching token transfer not found',confirmations};
  }
  if(normalizeHexAddress(tx.to)!==expected) return {verified:false,reason:'Destination address mismatch',confirmations};
  const value=Number(hexToBigInt(tx.value))/1e18;
  if(expectedAmount!=null && value+1e-12 < Number(expectedAmount)) return {verified:false,reason:'On-chain amount is below submitted amount',confirmations};
  return {verified:true,confirmations,amount:value,txHash};
}
async function runWithdrawalRiskChecks(w){
  const issues=[]; let score=0;
  if(Number(w.amount)>Number(process.env.WITHDRAWAL_HIGH_VALUE_THRESHOLD||10000)){score+=40;issues.push('high_value');}
  if(String(w.address||'').length<20){score+=50;issues.push('invalid_address_length');}
  const recent=await pool.query(`SELECT COUNT(*)::int AS n FROM withdrawal_requests WHERE user_id=$1 AND created_at>NOW()-INTERVAL '1 hour'`,[w.user_id]);
  if(Number(recent.rows[0].n)>Number(process.env.WITHDRAWAL_VELOCITY_LIMIT||5)){score+=35;issues.push('velocity_limit');}
  return {score,issues,severity:score>=70?'high':score>=35?'medium':'low'};
}
app.get('/api/wallet/balances', requireUser, async (req,res)=>{
  try { res.json({ balances: await getWalletBalances(req.user.userId) }); }
  catch(e){ console.error(e); res.status(500).json({error:'Unable to load wallet balances'}); }
});
app.get('/api/wallet/transactions', requireUser, async (req,res)=>{
  try { const {rows}=await pool.query(`SELECT id,type,asset,amount,status,tx_hash AS "txHash",network,created_at AS "createdAt" FROM transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200`,[req.user.userId]); res.json({transactions:rows}); }
  catch(e){ console.error(e); res.status(500).json({error:'Unable to load transactions'}); }
});
app.get('/api/wallet/orders', requireUser, async (req,res)=>{
  try { const {rows}=await pool.query(`SELECT id,pair,type AS "orderType",side,price,amount,filled,status,created_at AS "createdAt" FROM spot_orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200`,[req.user.userId]); res.json({orders:rows}); }
  catch(e){ console.error(e); res.status(500).json({error:'Unable to load orders'}); }
});

app.post('/api/wallet/internal-transfer', requireUser, async (req,res)=>{
  const asset=String(req.body?.asset||'').toUpperCase(), from=String(req.body?.fromAccount||''), to=String(req.body?.toAccount||''), amount=positiveAmount(req.body?.amount);
  if(!asset || !['spot','funding','earn'].includes(from) || !['spot','funding','earn'].includes(to) || from===to || !amount) return res.status(400).json({error:'Invalid transfer request'});
  const client=await pool.connect(); const id=crypto.randomUUID();
  try { await client.query('BEGIN'); await changeAvailable(client,req.user.userId,asset,from,-amount,'internal_transfer',id,{from,to}); await changeAvailable(client,req.user.userId,asset,to,amount,'internal_transfer',id,{from,to}); await client.query(`INSERT INTO internal_transfers(id,user_id,asset,from_account,to_account,amount) VALUES($1,$2,$3,$4,$5,$6)`,[id,req.user.userId,asset,from,to,amount]); await client.query(`INSERT INTO transactions(id,user_id,type,asset,amount,status,created_at) VALUES($1,$2,'transfer',$3,$4,'completed',NOW())`,[id,req.user.userId,asset,amount]); await client.query('COMMIT'); res.json({success:true,id,balances:await getWalletBalances(req.user.userId)}); }
  catch(e){ await client.query('ROLLBACK').catch(()=>{}); if(String(e.message).startsWith('INSUFFICIENT_')) return res.status(400).json({error:`Insufficient ${asset} balance.`}); console.error(e); res.status(500).json({error:'Transfer failed'}); } finally { client.release(); }
});

app.post('/api/wallet/deposit-intent', requireUser, async (req,res)=>{
  const asset=String(req.body?.asset||'').toUpperCase(), network=String(req.body?.network||'').trim(), amount=req.body?.amount==null?null:positiveAmount(req.body.amount), txHash=String(req.body?.txHash||'').trim()||null;
  if(!asset || !network) return res.status(400).json({error:'Asset and network are required'});
  try { const {rows}=await pool.query(`SELECT id,asset,network,address,min_deposit AS "minDeposit",instructions FROM deposit_addresses WHERE asset=$1 AND network=$2 AND enabled=true LIMIT 1`,[asset,network]); if(!rows[0]) return res.status(400).json({error:'No active deposit address is configured for this network.'}); const min=Number(rows[0].minDeposit||0); if(amount!==null && Number(amount)<min) return res.status(400).json({error:`Minimum deposit is ${min} ${asset}.`}); const id=crypto.randomUUID(); await pool.query(`INSERT INTO deposit_requests(id,user_id,asset,network,amount,tx_hash) VALUES($1,$2,$3,$4,$5,$6)`,[id,req.user.userId,asset,network,amount,txHash]); await pool.query(`INSERT INTO transactions(id,user_id,type,asset,amount,status,tx_hash,network) VALUES($1,$2,'deposit',$3,$4,'pending',$5,$6)`,[id,req.user.userId,asset,amount||0,txHash,network]); res.status(201).json({success:true,depositId:id,status:'pending',message:'Pending Verification — Your deposit has been received and is currently awaiting verification. Blockchain transactions can sometimes take longer than expected while network confirmations are being completed and the transaction is reviewed.'}); }
  catch(e){ if(e.code==='23505') return res.status(409).json({error:'This transaction hash is already being processed.'}); console.error(e); res.status(500).json({error:'Unable to submit deposit'}); }
});

app.post('/api/wallet/withdraw', requireUser, async (req,res)=>{
  const asset=String(req.body?.asset||'').toUpperCase(), network=String(req.body?.network||'').trim(), address=String(req.body?.address||'').trim(), amount=positiveAmount(req.body?.amount);
  if(!asset||!network||address.length<10||!amount)return res.status(400).json({error:'Invalid withdrawal request'});
  const client=await pool.connect(); const id=crypto.randomUUID();
  try { await client.query('BEGIN'); const net=await client.query(`SELECT fee FROM deposit_addresses WHERE asset=$1 AND network=$2 AND enabled=true LIMIT 1`,[asset,network]); const fee=0; await changeAvailable(client,req.user.userId,asset,'spot',-(amount+fee),'withdrawal',id,{network,address}); await client.query(`INSERT INTO withdrawal_requests(id,user_id,asset,network,address,amount,fee,status) VALUES($1,$2,$3,$4,$5,$6,$7,'pending_security')`,[id,req.user.userId,asset,network,address,amount,fee]); await client.query(`INSERT INTO transactions(id,user_id,type,asset,amount,status,network) VALUES($1,$2,'withdraw',$3,$4,'pending_security',$5)`,[id,req.user.userId,asset,amount,network]); await client.query('COMMIT'); res.status(201).json({success:true,id,status:'pending_security',message:'Withdrawal submitted for security review. It has not been broadcast to the blockchain yet.'}); }
  catch(e){ await client.query('ROLLBACK').catch(()=>{}); if(String(e.message).startsWith('INSUFFICIENT_')) return res.status(400).json({error:`Insufficient ${asset} balance.`}); console.error(e); res.status(500).json({error:'Unable to create withdrawal'}); } finally { client.release(); }
});

app.post('/api/wallet/orders', requireUser, async (req,res)=>{
  const pair=String(req.body?.pair||'').toUpperCase(), side=String(req.body?.side||''), orderType=String(req.body?.type||''), amount=positiveAmount(req.body?.amount), price=req.body?.price==null?null:Number(req.body.price);
  if(!/^([A-Z0-9]+)\/[A-Z0-9]+$/.test(pair)||!['buy','sell'].includes(side)||!['limit','market'].includes(orderType)||!amount||(orderType==='limit'&&(!price||price<=0)))return res.status(400).json({error:'Invalid order'});
  // Orders are recorded as OPEN only. No fake matching or instant fills are performed without a real matching engine/liquidity provider.
  try { const id=crypto.randomUUID(); await pool.query(`INSERT INTO spot_orders(id,user_id,pair,side,order_type,price,amount,status) VALUES($1,$2,$3,$4,$5,$6,$7,'open')`,[id,req.user.userId,pair,side,orderType,price,amount]); res.status(201).json({success:true,order:{id,pair,side,type:orderType,price,amount,filled:0,status:'open'}}); }
  catch(e){ console.error(e); res.status(500).json({error:'Unable to place order'}); }
});
app.post('/api/wallet/orders/:id/cancel', requireUser, async (req,res)=>{ try { const {rows}=await pool.query(`UPDATE spot_orders SET status='canceled',updated_at=NOW() WHERE id=$1 AND user_id=$2 AND status='open' RETURNING id`,[req.params.id,req.user.userId]); if(!rows[0])return res.status(404).json({error:'Open order not found'}); res.json({success:true}); } catch(e){console.error(e);res.status(500).json({error:'Unable to cancel order'});} });

app.post('/api/admin/login', loginRateLimit, async (req, res) => {
  const { email, password } = req.body || {};
  try {
    const result = await pool.query('SELECT id,email,password_hash,role,totp_secret,totp_enabled FROM admin_users WHERE lower(email)=lower($1)', [email || '']);
    const admin = result.rows[0];
    const valid = admin && verifyPassword(password || '', admin.password_hash);
    if (!valid) {
      req.loginAttempt.existing.count += 1; loginAttempts.set(req.loginAttempt.key, req.loginAttempt.existing);
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    if (admin.totp_enabled && !verifyTotp(admin.totp_secret, req.body?.otp)) return res.status(401).json({ error: 'Authenticator code required.' });
    if (process.env.REQUIRE_ADMIN_2FA === 'true' && !admin.totp_enabled) return res.status(403).json({ error: 'Admin 2FA enrollment is required before login.' });
    loginAttempts.delete(req.loginAttempt.key);
    const token = signToken({ adminId: admin.id, email: admin.email, role: admin.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 });
    res.setHeader('Set-Cookie', `kroma_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.json({ admin: { id: admin.id, email: admin.email, role: admin.role } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Login failed' }); }
});


app.get('/api/admin/2fa/setup', requireAdmin, async (req,res)=>{
  const q=await pool.query('SELECT email,totp_secret,totp_enabled FROM admin_users WHERE id=$1',[req.admin.adminId]); const a=q.rows[0];
  let secret=a.totp_secret; if(!secret){secret=randomBase32(); await pool.query('UPDATE admin_users SET totp_secret=$1 WHERE id=$2',[secret,a.email?req.admin.adminId:req.admin.adminId]);}
  res.json({enabled:a.totp_enabled,secret,otpauth:`otpauth://totp/Kroma:${encodeURIComponent(a.email)}?secret=${secret}&issuer=Kroma&algorithm=SHA1&digits=6&period=30`});
});
app.post('/api/admin/2fa/enable', requireAdmin, async (req,res)=>{
  const q=await pool.query('SELECT totp_secret FROM admin_users WHERE id=$1',[req.admin.adminId]); const secret=q.rows[0]?.totp_secret; if(!secret||!verifyTotp(secret,req.body?.otp)) return res.status(400).json({error:'Invalid authenticator code'});
  await pool.query('UPDATE admin_users SET totp_enabled=true WHERE id=$1',[req.admin.adminId]); await pool.query(`INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,'enable_2fa','admin',$1,'{}')`,[req.admin.adminId]); res.json({enabled:true});
});
app.get('/api/admin/me', requireAdmin, async (req, res) => res.json({ admin: req.admin }));
app.post('/api/admin/logout', requireAdmin, async (_req, res) => { res.setHeader('Set-Cookie', 'kroma_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.status(204).end(); });

app.get('/api/admin/deposit-addresses', requireAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT id,asset,network,address,label,min_deposit AS "minDeposit",instructions,enabled,created_at AS "createdAt",updated_at AS "updatedAt" FROM deposit_addresses ORDER BY asset,network');
  res.json({ addresses: rows });
});

app.get('/api/deposit-addresses/active', async (req, res) => {
  const asset = String(req.query.asset || '').toUpperCase();
  const network = String(req.query.network || '');
  if (!asset) return res.status(400).json({ error: 'asset is required' });
  const params = [asset];
  let sql = 'SELECT id,asset,network,address,label,min_deposit AS "minDeposit",instructions,enabled FROM deposit_addresses WHERE asset=$1 AND enabled=true';
  if (network) { params.push(network); sql += ' AND network=$2'; }
  sql += ' ORDER BY network LIMIT 20';
  const { rows } = await pool.query(sql, params);
  res.json({ addresses: rows });
});

app.post('/api/admin/deposit-addresses', requireAdmin, async (req, res) => {
  const { asset, network, address, label = '', minDeposit = 0, instructions = '', enabled = true } = req.body || {};
  if (!asset || !network || !address) return res.status(400).json({ error: 'asset, network and address are required' });
  const id = crypto.randomUUID();
  try {
    const { rows } = await pool.query(`INSERT INTO deposit_addresses(id,asset,network,address,label,min_deposit,instructions,enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [id, String(asset).toUpperCase(), network, address.trim(), label, Number(minDeposit) || 0, instructions, Boolean(enabled)]);
    await pool.query('INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [req.admin.adminId, 'create', 'deposit_address', id, JSON.stringify({ asset, network, label, enabled })]);
    res.status(201).json({ address: rows[0] });
  } catch (e) { if (e.code === '23505') return res.status(409).json({ error: 'An address already exists for this asset/network.' }); console.error(e); res.status(500).json({ error: 'Unable to create address' }); }
});

app.put('/api/admin/deposit-addresses/:id', requireAdmin, async (req, res) => {
  const { asset, network, address, label = '', minDeposit = 0, instructions = '', enabled = true } = req.body || {};
  try {
    const old = await pool.query('SELECT * FROM deposit_addresses WHERE id=$1', [req.params.id]);
    if (!old.rowCount) return res.status(404).json({ error: 'Address not found' });
    const { rows } = await pool.query(`UPDATE deposit_addresses SET asset=$1,network=$2,address=$3,label=$4,min_deposit=$5,instructions=$6,enabled=$7,updated_at=NOW() WHERE id=$8 RETURNING *`, [String(asset).toUpperCase(), network, address.trim(), label, Number(minDeposit) || 0, instructions, Boolean(enabled), req.params.id]);
    await pool.query('INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [req.admin.adminId, 'update', 'deposit_address', req.params.id, JSON.stringify({ previous: { asset: old.rows[0].asset, network: old.rows[0].network, address: old.rows[0].address, enabled: old.rows[0].enabled }, next: { asset, network, address, enabled } })]);
    res.json({ address: rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Unable to update address' }); }
});

app.delete('/api/admin/deposit-addresses/:id', requireAdmin, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM deposit_addresses WHERE id=$1', [req.params.id]);
    if (!old.rowCount) return res.status(404).json({ error: 'Address not found' });
    await pool.query('DELETE FROM deposit_addresses WHERE id=$1', [req.params.id]);
    await pool.query('INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [req.admin.adminId, 'delete', 'deposit_address', req.params.id, JSON.stringify({ asset: old.rows[0].asset, network: old.rows[0].network })]);
    res.status(204).end();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Unable to delete address' }); }
});

app.get('/api/features', async (_req, res) => {
  try { const { rows } = await pool.query('SELECT key,enabled FROM feature_settings'); const flags = Object.fromEntries(rows.map(r => [r.key, r.enabled])); res.json({ features: flags }); }
  catch { res.json({ features: {} }); }
});

app.get('/api/admin/features', requireAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT key,enabled,updated_at AS "updatedAt" FROM feature_settings ORDER BY key');
  res.json({ features: rows });
});
app.put('/api/admin/features/:key', requireAdmin, async (req, res) => {
  const enabled = Boolean(req.body?.enabled);
  const { rows } = await pool.query(`INSERT INTO feature_settings(key,enabled,updated_by) VALUES($1,$2,$3) ON CONFLICT(key) DO UPDATE SET enabled=EXCLUDED.enabled,updated_by=EXCLUDED.updated_by,updated_at=NOW() RETURNING key,enabled,updated_at AS "updatedAt"`, [req.params.key, enabled, req.admin.adminId]);
  await pool.query('INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [req.admin.adminId, 'set', 'feature', req.params.key, JSON.stringify({ enabled })]);
  res.json({ feature: rows[0] });
});

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT id,email,status,kyc_status AS "kycStatus",created_at AS "createdAt" FROM users ORDER BY created_at DESC LIMIT 200');
  res.json({ users: rows });
});
app.get('/api/admin/transactions', requireAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT id,user_id AS "userId",type,asset,amount,status,tx_hash AS "txHash",network,created_at AS "createdAt" FROM transactions ORDER BY created_at DESC LIMIT 200');
  res.json({ transactions: rows });
});

app.get('/api/admin/wallets', requireAdmin, async (_req,res)=>{
  try { const {rows}=await pool.query(`SELECT w.user_id AS "userId",u.email,w.asset,w.account_type AS "accountType",w.available,w.locked,w.updated_at AS "updatedAt" FROM wallets w JOIN users u ON u.id=w.user_id ORDER BY w.updated_at DESC LIMIT 500`); res.json({wallets:rows}); }
  catch(e){console.error(e);res.status(500).json({error:'Unable to load wallets'});}
});
app.get('/api/admin/deposits', requireAdmin, async (_req,res)=>{
  try { const {rows}=await pool.query(`SELECT d.id,d.user_id AS "userId",u.email,d.asset,d.network,d.amount,d.tx_hash AS "txHash",d.status,d.confirmations,d.created_at AS "createdAt" FROM deposit_requests d JOIN users u ON u.id=d.user_id ORDER BY d.created_at DESC LIMIT 500`); res.json({deposits:rows}); }
  catch(e){console.error(e);res.status(500).json({error:'Unable to load deposits'});}
});
app.get('/api/admin/withdrawals', requireAdmin, async (_req,res)=>{
  try { const {rows}=await pool.query(`SELECT w.id,w.user_id AS "userId",u.email,w.asset,w.network,w.address,w.amount,w.fee,w.status,w.tx_hash AS "txHash",w.failure_reason AS "failureReason",w.created_at AS "createdAt" FROM withdrawal_requests w JOIN users u ON u.id=w.user_id ORDER BY w.created_at DESC LIMIT 500`); res.json({withdrawals:rows}); }
  catch(e){console.error(e);res.status(500).json({error:'Unable to load withdrawals'});}
});


app.post('/api/admin/deposits/:id/verify-onchain', requireAdmin, async (req,res)=>{
  try{
    const {rows}=await pool.query(`SELECT d.*,a.address AS expected_address,a.min_deposit,a.asset AS configured_asset,a.network AS configured_network,n.token_contract,n.token_decimals FROM deposit_requests d LEFT JOIN deposit_addresses a ON a.asset=d.asset AND a.network=d.network AND a.enabled=true LEFT JOIN network_configs n ON n.asset=d.asset AND n.network=d.network WHERE d.id=$1`,[req.params.id]);
    const d=rows[0]; if(!d) return res.status(404).json({error:'Deposit not found'}); if(!d.tx_hash) return res.status(400).json({error:'Deposit has no transaction hash'}); if(!d.expected_address) return res.status(400).json({error:'No active admin deposit address exists for this network'});
    const result=await verifyEvmDeposit({asset:d.asset,network:d.network,txHash:d.tx_hash,expectedAddress:d.expected_address,expectedAmount:d.amount,tokenContract:d.token_contract,tokenDecimals:d.token_decimals});
    await pool.query(`UPDATE deposit_requests SET confirmations=$1,updated_at=NOW() WHERE id=$2`,[Number(result.confirmations||0),d.id]);
    if(result.verified) await pool.query(`INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,'verify_onchain','deposit',$2,$3)`,[req.admin.adminId,d.id,JSON.stringify(result)]);
    res.json(result);
  }catch(e){console.error(e);res.status(502).json({error:e.message==='RPC_NOT_CONFIGURED'?'Network RPC is not configured for this environment.':'Blockchain verification failed.'});}
});

app.post('/api/admin/deposits/:id/confirm', requireAdmin, async (req,res)=>{
  const txHash=String(req.body?.txHash||'').trim(); const amount=req.body?.amount;
  if(!txHash)return res.status(400).json({error:'Blockchain transaction hash is required.'});
  const client=await pool.connect();
  try { await client.query('BEGIN'); const q=await client.query(`SELECT * FROM deposit_requests WHERE id=$1 FOR UPDATE`,[req.params.id]); const d=q.rows[0]; if(!d)return res.status(404).json({error:'Deposit not found'}); if(d.status==='confirmed'){await client.query('ROLLBACK');return res.status(409).json({error:'Deposit is already confirmed'});} const credit=amount==null?d.amount:amount; if(credit==null||Number(credit)<=0){await client.query('ROLLBACK');return res.status(400).json({error:'A verified deposit amount is required.'});} await changeAvailable(client,d.user_id,d.asset,'spot',String(credit),'deposit',d.id,{txHash,adminId:req.admin.adminId,verifiedManually:true}); await client.query(`UPDATE deposit_requests SET status='confirmed',amount=$1,tx_hash=$2,confirmations=GREATEST(confirmations,1),updated_at=NOW() WHERE id=$3`,[credit,txHash,d.id]); await client.query(`UPDATE transactions SET status='completed',amount=$1,tx_hash=$2 WHERE id=$3`,[credit,txHash,d.id]); await client.query(`INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,'confirm','deposit',$2,$3)`,[req.admin.adminId,d.id,JSON.stringify({amount:credit,txHash})]); await client.query('COMMIT'); res.json({success:true,message:'Deposit confirmed and credited to Spot Wallet.'}); }
  catch(e){await client.query('ROLLBACK').catch(()=>{});console.error(e);res.status(500).json({error:'Unable to confirm deposit'});} finally{client.release();}
});

app.post('/api/admin/withdrawals/:id/complete', requireAdmin, async (req,res)=>{
  const txHash=String(req.body?.txHash||'').trim(); if(!txHash)return res.status(400).json({error:'Blockchain transaction hash is required.'});
  try { const {rows}=await pool.query(`UPDATE withdrawal_requests SET status='completed',tx_hash=$1,updated_at=NOW() WHERE id=$2 AND status='approved_for_broadcast' RETURNING id`,[txHash,req.params.id]); if(!rows[0])return res.status(409).json({error:'Withdrawal must be approved for broadcast before completion.'}); await pool.query(`UPDATE transactions SET status='completed',tx_hash=$1 WHERE id=$2`,[txHash,req.params.id]); await pool.query(`INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,'complete','withdrawal',$2,$3)`,[req.admin.adminId,req.params.id,JSON.stringify({txHash})]); res.json({success:true}); }
  catch(e){console.error(e);res.status(500).json({error:'Unable to complete withdrawal'});}
});

app.post('/api/admin/withdrawals/:id/reject', requireAdmin, async (req,res)=>{
  const client=await pool.connect();
  try { await client.query('BEGIN'); const q=await client.query(`SELECT * FROM withdrawal_requests WHERE id=$1 FOR UPDATE`,[req.params.id]); const w=q.rows[0]; if(!w)return res.status(404).json({error:'Withdrawal not found'}); if(!['pending_security','approved_for_broadcast'].includes(w.status))return res.status(409).json({error:'Withdrawal is not reviewable'}); await changeAvailable(client,w.user_id,w.asset,'spot',Number(w.amount)+Number(w.fee),'withdrawal_reversal',w.id,{reason:String(req.body?.reason||'Rejected by admin')}); await client.query(`UPDATE withdrawal_requests SET status='rejected',failure_reason=$1,updated_at=NOW() WHERE id=$2`,[String(req.body?.reason||'Rejected by admin'),w.id]); await client.query(`UPDATE transactions SET status='failed' WHERE id=$1`,[w.id]); await client.query(`INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,'reject','withdrawal',$2,$3)`,[req.admin.adminId,w.id,JSON.stringify({reason:req.body?.reason||'Rejected by admin'})]); await client.query('COMMIT'); res.json({success:true}); }
  catch(e){await client.query('ROLLBACK').catch(()=>{});console.error(e);res.status(500).json({error:'Unable to reject withdrawal'});} finally{client.release();}
});
app.post('/api/admin/withdrawals/:id/approve', requireAdmin, async (req,res)=>{
  try { const q=await pool.query(`SELECT * FROM withdrawal_requests WHERE id=$1`,[req.params.id]); const w=q.rows[0]; if(!w)return res.status(404).json({error:'Withdrawal not found'}); const risk=await runWithdrawalRiskChecks(w); await pool.query(`INSERT INTO risk_events(user_id,withdrawal_id,event_type,severity,score,status,details) VALUES($1,$2,'withdrawal_review',$3,$4,$5,$6)`,[w.user_id,w.id,risk.severity,risk.score,risk.score>=70?'blocked':'open',JSON.stringify({issues:risk.issues})]); if(risk.score>=70)return res.status(409).json({error:'Withdrawal requires enhanced risk review.',risk}); const {rows}=await pool.query(`UPDATE withdrawal_requests SET status='approved_for_broadcast',updated_at=NOW() WHERE id=$1 AND status='pending_security' RETURNING id` , [req.params.id]); if(!rows[0])return res.status(409).json({error:'Withdrawal is not pending security review'}); await pool.query(`INSERT INTO audit_logs(admin_id,action,entity_type,entity_id,details) VALUES($1,'approve','withdrawal',$2,$3)`,[req.admin.adminId,req.params.id,JSON.stringify({status:'approved_for_broadcast'})]); res.json({success:true,message:'Approved for broadcast. A trusted blockchain worker/provider must broadcast and confirm it.'}); }
  catch(e){console.error(e);res.status(500).json({error:'Unable to approve withdrawal'});}
});


app.get('/api/admin/risk-events', requireAdmin, async (_req,res)=>{
  const {rows}=await pool.query(`SELECT id,user_id AS "userId",withdrawal_id AS "withdrawalId",event_type AS "eventType",severity,score,status,details,created_at AS "createdAt" FROM risk_events ORDER BY created_at DESC LIMIT 200`); res.json({events:rows});
});
app.get('/api/admin/integrations', requireAdmin, async (_req,res)=>{
  const {rows}=await pool.query(`SELECT key,provider,enabled,mode,public_config AS "publicConfig",updated_at AS "updatedAt" FROM integration_settings ORDER BY key`); res.json({integrations:rows});
});
app.get('/api/admin/networks', requireAdmin, async (_req,res)=>{
  const {rows}=await pool.query(`SELECT id,asset,network,chain_type AS "chainType",chain_id AS "chainId",explorer_url AS "explorerUrl",confirmations_required AS "confirmationsRequired",enabled,testnet,native_asset AS "nativeAsset",token_contract AS "tokenContract",token_decimals AS "tokenDecimals" FROM network_configs ORDER BY asset,network`); res.json({networks:rows});
});

app.get('/api/admin/audit-logs', requireAdmin, async (_req, res) => {
  const { rows } = await pool.query('SELECT id,action,entity_type AS "entityType",entity_id AS "entityId",details,created_at AS "createdAt" FROM audit_logs ORDER BY created_at DESC LIMIT 200');
  res.json({ logs: rows });
});

// Serve the built frontend when deployed as a single service.
const distPath = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

ensureAdmin().catch(err => console.error('Admin bootstrap failed:', err));
app.listen(PORT, () => console.log(`Kroma API listening on port ${PORT}`));
