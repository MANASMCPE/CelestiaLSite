use strict';
const crypto = require('crypto');

/* ---------- storage: Upstash Redis over REST (Vercel Marketplace sets these env vars) ---------- */
const REDIS_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const url = REDIS_URL(), token = REDIS_TOKEN();
  if (!url || !token) { const e = new Error('Storage is not configured'); e.code = 'NO_STORAGE'; throw e; }
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || 'Redis error ' + r.status);
  return j.result;
}

/* ---------- admin password ----------
   Set ADMIN_PASSWORD in the Vercel dashboard to override. Until you do, the built-in
   salted hash below is used, so the plain password never appears in this repo. */
const DEFAULT_PW_HASH = '36dd248f09a92af9311c998efb0b0ce743ef805bfc34a43346511763ab17cfd3';
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const pwHash = () => (process.env.ADMIN_PASSWORD ? sha('celestial-syndicate:' + process.env.ADMIN_PASSWORD) : DEFAULT_PW_HASH);

function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function checkPassword(pw) { return typeof pw === 'string' && pw.length > 0 && pw.length < 200 && safeEq(sha('celestial-syndicate:' + pw), pwHash()); }

const secret = () => process.env.SESSION_SECRET || sha('session|' + pwHash());
const b64 = (s) => Buffer.from(s).toString('base64url');
function signToken(ttlMs) {
  const body = b64(JSON.stringify({ exp: Date.now() + ttlMs }));
  return body + '.' + crypto.createHmac('sha256', secret()).update(body).digest('base64url');
}
function verifyToken(tok) {
  if (typeof tok !== 'string' || tok.indexOf('.') < 0) return false;
  const [body, sig] = tok.split('.');
  const good = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  if (!safeEq(sig || '', good)) return false;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now(); } catch (e) { return false; }
}

/* ---------- misc ---------- */
function clientIp(req) { return String((req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')).split(',')[0].trim(); }
async function rateLimit(key, max, windowSec) {
  const n = await redis(['INCR', key]);
  if (n === 1) await redis(['EXPIRE', key, windowSec]);
  return n <= max;
}
function send(res, status, obj) { res.status(status).setHeader('Cache-Control', 'no-store').json(obj); }

module.exports = { redis, checkPassword, signToken, verifyToken, clientIp, rateLimit, send };
