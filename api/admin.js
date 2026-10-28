'use strict';
const { redis, checkPassword, signToken, verifyToken, clientIp, rateLimit, send } = require('./_lib');

const KEY = 'celestial:apps';
const STATUSES = ['pending', 'accepted', 'rejected'];

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Method not allowed' }); }
  const b = req.body && typeof req.body === 'object' ? req.body : {};

  try {
    if (b.action === 'login') {
      if (!(await rateLimit('rl:login:' + clientIp(req), 8, 60))) return send(res, 429, { error: 'Too many attempts' });
      if (!checkPassword(b.password)) { await new Promise((r) => setTimeout(r, 600)); return send(res, 401, { error: 'Wrong password' }); }
      return send(res, 200, { token: signToken(8 * 3600 * 1000) });
    }

    const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!verifyToken(auth)) return send(res, 401, { error: 'Not signed in' });

    if (b.action === 'list') {
      const raw = await redis(['HGETALL', KEY]);
      const vals = Array.isArray(raw) ? raw.filter((_, i) => i % 2 === 1) : Object.values(raw || {});
      const apps = vals.map((v) => { try { return JSON.parse(v); } catch (e) { return null; } }).filter(Boolean)
        .sort((a, c) => new Date(c.date) - new Date(a.date));
      return send(res, 200, { apps });
    }
    if (b.action === 'status') {
      if (!STATUSES.includes(b.status) || typeof b.id !== 'string') return send(res, 400, { error: 'Bad request' });
      const cur = await redis(['HGET', KEY, b.id]);
      if (!cur) return send(res, 404, { error: 'Application not found' });
      const app = JSON.parse(cur); app.status = b.status;
      await redis(['HSET', KEY, b.id, JSON.stringify(app)]);
      return send(res, 200, { ok: true });
    }
    if (b.action === 'delete') {
      if (typeof b.id !== 'string') return send(res, 400, { error: 'Bad request' });
      await redis(['HDEL', KEY, b.id]);
      return send(res, 200, { ok: true });
    }
    if (b.action === 'clear') { await redis(['DEL', KEY]); return send(res, 200, { ok: true }); }
    return send(res, 400, { error: 'Unknown action' });
  } catch (e) {
    if (e.code === 'NO_STORAGE') return send(res, 503, { error: 'Storage is not configured. Connect an Upstash Redis database in Vercel (see README).' });
    return send(res, 500, { error: 'Server error' });
  }
};
