# CelestiaL SyndicatE site (Vercel)

Multi-page site: Hub, ASUKA, ZM, TOMAN, Leaderboard, Apply, Admin. Each gang page has its own theme and its own 3D scene (Three.js).

## Deploy on Vercel
1. Is folder ko GitHub repo mein push karo (purani repo `MANASMCPE/CelestiaLSite` replace kar sakte ho).
2. Vercel > Add New > Project > repo import karo. Framework: **Other**. Build command aur output directory khaali chhodo.
3. Apply form ki saving ke liye database chahiye: Vercel project > **Storage** > Marketplace > **Upstash Redis** > Create > project se connect karo. Env variables apne aap lag jaate hain. Phir **Redeploy** karo.

## Admin panel
- Address: `/admin`
- Password: `monkxnovo`
- Password code mein plain text nahi hai, sirf salted hash hai. Badalna ho toh Vercel > Settings > Environment Variables mein `ADMIN_PASSWORD` set karo aur redeploy karo.
- Galat password 8 baar se zyada ek minute mein try hua toh block ho jaata hai.

## Members add karna
Har gang ki apni JSON file hai: `celestial.json`, `asuka.json`, `zm.json`, `toman.json`. Abhi `members` khaali hai. Aise add karo:

```json
{
  "gang": "ZM",
  "created": "2020-07-22",
  "members": [
    { "name": "Kazu", "rank": "Zero (Leader)", "tier": "lead", "points": 96800, "kd": "4.44" },
    { "name": "Hiro", "rank": "Alpha", "tier": "high", "points": 89100, "kd": "3.72" },
    { "name": "Rin", "rank": "Member", "tier": "", "points": 79600, "kd": "2.94" }
  ]
}
```
- `tier`: `"lead"` (leader badge), `"high"` (senior badge) ya `""`.
- `points` aur `kd` leaderboard ke liye hain. Points nahi doge toh member roster mein dikhega, leaderboard mein 0 points se.
- Hub ka member count aur leaderboard dono in files se bante hain.

## Files
- `index.html`, `asuka.html`, `zm.html`, `toman.html`, `leaderboard.html`, `apply.html`, `admin.html`
- `base.css` (shared structure), `shared.js` (loading screen, nav, animations), `scenes.js` (5 Three.js scenes)
- `api/apply.js`, `api/admin.js`, `api/_lib.js` (serverless, Upstash Redis)
- `vercel.json`, `package.json`

---

## Naye pages (v2)

Ye sab **static JSON** se chalte hain — GitHub par file edit karo, Vercel auto-deploy karega. Koi database nahi chahiye.

| Page | Data file | Kaise edit karein |
|---|---|---|
| `/events` Wars & Events | `events.json` | niche format dekho |
| `/rules` Rules & Ranks | `site.json` (`rules`, `ranks`, `charter`) | text badal do |
| `/gallery` Gallery + Discord | `gallery.json`, `site.json` (`discord`) | niche dekho |
| `/member?g=<gang>&m=<id>` Profile | gang ki `.json` (members) | roster me member card par click = profile |

**events.json**
```json
{ "events": [
  { "title": "Grand War", "type": "war", "date": "2026-12-05T20:00:00+05:30",
    "gangs": ["celestial", "asuka"], "desc": "Full turnout", "result": "" }
] }
```
`type`: `war` / `event` / `meet`. `date` ISO format me (timezone ke saath). Jab war khatam ho, `"result": "Won 5-3"` likh do — wo Results tab me chala jayega. Sabse paas wale upcoming event ka countdown apne aap dikhta hai.

**gallery.json**
```json
{ "items": [ { "src": "img/war1.jpg", "caption": "War night" }, { "src": "img/clip.mp4", "caption": "Clip" } ] }
```
Images repo me `img/` folder bana ke daalo (ya https link). Video: `.mp4/.webm`.

**Discord** — `site.json` me `discord.invite` (`https://discord.gg/xxxx`) aur optional `discord.serverId` daalo. Live online count ke liye Discord server settings → Widget → *Enable Server Widget* on karo.

**Member profile fields** (har member object me, sab optional sirf `name` aur `rank` chahiye):
```json
{ "name": "Rex", "rank": "Leader", "tier": "lead", "points": 4200, "kd": "3.2",
  "joined": "2022-03-01", "wars": 14, "bio": "...", "avatar": "img/rex.png",
  "badges": ["War Hero"], "id": "rex" }
```
`id` na do to naam se slug ban jata hai (same naam ho to `rex-2`). Profile page apni gang ki theme me khulta hai.

---

## v3 — Planets & effects

- **/cosmos**: 3D planet explorer — Earth, Moon, Mars, Venus, Jupiter, Saturn (rings), Uranus, Neptune. Chips / arrows / swipe / keyboard, plus auto *Tour*. Planets bina kisi image file ke code se bante hain (`planets.js`), isliye load fast hai.
- Hub aur utility pages ke background me Jupiter, Mars, Saturn, Earth ghoomte hain.
- Naye effects: shooting stars, scroll progress bar, back-to-top, magnetic + ripple buttons, card spotlight, text scramble, marquee ticker.
- Mobile: hamburger menu (full-screen), 44px+ touch targets, kam particles, planets ke chhote textures. `prefers-reduced-motion` par animations band.

---

## Appeal -> Discord notification

Jab koi player Apply form submit kare, uski poori info Discord par aa jati hai.

**Easy tarika (webhook, recommended)**
1. Discord me ek private channel banao (sirf tum dekh sako), e.g. `#applications`.
2. Channel settings -> Integrations -> Webhooks -> New Webhook -> **Copy Webhook URL**.
3. Vercel -> Project -> Settings -> Environment Variables: `DISCORD_WEBHOOK_URL` = wo URL. Redeploy karo.
4. (Optional) Apna Discord **User ID** `DISCORD_USER_ID` me daalo to message me tumhe @ping bhi milega. (Discord Settings -> Advanced -> Developer Mode on, phir apni profile par right-click -> Copy User ID.)

**Direct DM (bot)** — `DISCORD_BOT_TOKEN` (Developer Portal -> New Application -> Bot -> Token) + `DISCORD_USER_ID`. Bot ko kisi server me add karna hoga jisme tum bhi ho, aur tumhare DMs open hone chahiye.

Dono ek saath on ho sakte hain. Redis na bhi ho, Discord notification pahunchte hi application "sent" maani jati hai.

**Instagram:** Instagram website se seedha message bhejne ki permission nahi deta, isliye submit ke baad "Send on Instagram" button aata hai. Wo application ka text copy karke `instagram.com/scripterzmonk` ki DM khol deta hai; player paste karke send karta hai. Username badalna ho to `apply.html` me `IG = 'scripterzmonk'`.
