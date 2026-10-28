'use strict';
const crypto = require('crypto');
const { redis, clientIp, rateLimit, send } = require('./_lib');

const GANGS = ['Celestial Syndicate', 'ASUKA', 'ZM', 'TOMAN'];
const RANKS = ['Member', 'Elite', 'Captain', 'Leader'];
const EXPS = ['New (under 3 months)', 'Intermediate (3-12 months)', 'Veteran (1+ years)', 'Elite (3+ years)'];
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Method not allowed' }); }
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  if (b.website) return send(res, 200, { ok: true }); /* honeypot: bots fill this hidden field */

  const app = {
    id: Date.now().toString(36) + crypto.randomBytes(4).toString('hex'),
    ign: clean(b.ign, 30), discord: clean(b.discord, 40), gang: clean(b.gang, 40), rank: clean(b.rank, 20),
    experience: clean(b.experience, 40), reason: clean(b.reason, 600), status: 'pending', date: new Date().toISOString()
  };
  if (!app.ign || !app.discord || !app.reason) return send(res, 400, { error: 'Please fill in every required field.' });
  if (!GANGS.includes(app.gang) || !RANKS.includes(app.rank) || !EXPS.includes(app.experience)) return send(res, 400, { error: 'Please pick valid options from the lists.' });

  try {
    if (!(await rateLimit('rl:apply:' + clientIp(req), 5, 3600))) return send(res, 429, { error: 'Too many applications from this connection. Try again in an hour.' });
    await redis(['HSET', 'celestial:apps', app.id, JSON.stringify(app)]);
    return send(res, 200, { ok: true });
  } catch (e) {
    if (e.code === 'NO_STORAGE') return send(res, 503, { error: 'Applications are offline right now. Please contact an admin on Discord.' });
    return send(res, 500, { error: 'Server error. Try again later.' });
  }
};
