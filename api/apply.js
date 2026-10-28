'use strict';
const crypto = require('crypto');
const { redis, clientIp, rateLimit, send } = require('./_lib');

const GANGS = ['Celestial Syndicate', 'ASUKA', 'ZM', 'TOMAN'];
const RANKS = ['Member', 'Elite', 'Captain', 'Leader'];
const EXPS = ['New (under 3 months)', 'Intermediate (3-12 months)', 'Veteran (1+ years)', 'Elite (3+ years)'];
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

/* Sends the application to Discord. Two optional routes (env vars), both can be on:
   1) DISCORD_WEBHOOK_URL            -> posts an embed into a (private) channel
   2) DISCORD_BOT_TOKEN + DISCORD_USER_ID -> bot DMs the owner directly
   Returns true if at least one route delivered. */
const COL = { 'Celestial Syndicate': 0x7fd6ff, ASUKA: 0xff2b3a, ZM: 0xff4fa3, TOMAN: 0xf0c05a };
async function notify(app) {
  const f = (name, value, inline) => ({ name, value: String(value || '-').slice(0, 1000) || '-', inline: !!inline });
  const embed = {
    title: 'New application: ' + app.ign.slice(0, 60), color: COL[app.gang] || 0x7fd6ff, timestamp: app.date,
    fields: [f('Discord', app.discord, true), f('Gang', app.gang, true), f('Applying for', app.rank, true), f('Experience', app.experience, true), f('Why join?', app.reason), f('Application ID', app.id, true)],
    footer: { text: 'Celestial Syndicate site' }
  };
  const ok = [];
  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(hook || '')) {
    const ping = /^\d{15,22}$/.test(process.env.DISCORD_USER_ID || '') ? '<@' + process.env.DISCORD_USER_ID + '>' : '';
    ok.push(fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'Celestial Recruiter', content: ping, embeds: [embed], allowed_mentions: ping ? { users: [process.env.DISCORD_USER_ID] } : { parse: [] } }) }).then(r => r.ok).catch(() => false));
  }
  const tok = process.env.DISCORD_BOT_TOKEN, uid = process.env.DISCORD_USER_ID;
  if (tok && /^\d{15,22}$/.test(uid || '')) {
    const H = { 'Content-Type': 'application/json', Authorization: 'Bot ' + tok };
    ok.push((async () => {
      const ch = await fetch('https://discord.com/api/v10/users/@me/channels', { method: 'POST', headers: H, body: JSON.stringify({ recipient_id: uid }) });
      if (!ch.ok) return false;
      const { id } = await ch.json();
      const m = await fetch('https://discord.com/api/v10/channels/' + id + '/messages', { method: 'POST', headers: H, body: JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } }) });
      return m.ok;
    })().catch(() => false));
  }
  return (await Promise.all(ok)).some(Boolean);
}
const hasNotify = () => !!(process.env.DISCORD_WEBHOOK_URL || (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_USER_ID));

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

  let stored = false, noStorage = false;
  try {
    if (!(await rateLimit('rl:apply:' + clientIp(req), 5, 3600))) return send(res, 429, { error: 'Too many applications from this connection. Try again in an hour.' });
    await redis(['HSET', 'celestial:apps', app.id, JSON.stringify(app)]);
    stored = true;
  } catch (e) {
    if (e.code === 'NO_STORAGE') noStorage = true;
    else if (!hasNotify()) return send(res, 500, { error: 'Server error. Try again later.' });
  }
  const sent = hasNotify() ? await notify(app) : false;
  if (stored || sent) return send(res, 200, { ok: true });
  if (noStorage) return send(res, 503, { error: 'Applications are offline right now. Please contact an admin on Discord.' });
  return send(res, 500, { error: 'Server error. Try again later.' });
};
