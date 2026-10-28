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
