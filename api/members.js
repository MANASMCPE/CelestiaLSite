export default async function handler(req, res) {
res.setHeader("Content-Type", "application/json");
res.setHeader("Cache-Control", "no-store");

if (req.method !== "GET" && req.method !== "POST") {
res.setHeader("Allow", "GET, POST");
return res.status(405).json({ error: "Method not allowed" });
}

const token = process.env.GITHUB_TOKEN;
const owner = "MANASMCPE";
const repo = "CelestiaLSite";
const branch = "main";

if (!token) {
return res.status(500).json({
error: "Server configuration missing: GITHUB_TOKEN"
});
}

const gangs = {
celestial: "celestial.json",
asuka: "asuka.json",
zm: "zm.json",
toman: "toman.json"
};

const headers = {
Authorization: `Bearer ${token}`,
Accept: "application/vnd.github+json",
"X-GitHub-Api-Version": "2022-11-28"
};

try {
if (req.method === "GET") {
const result = {};

```
  for (const [gang, path] of Object.entries(gangs)) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers }
    );

    if (!response.ok) {
      return res.status(502).json({
        error: `Could not read ${path}`,
        details: await response.text()
      });
    }

    const file = await response.json();
    result[gang] = JSON.parse(
      Buffer.from(file.content, "base64").toString("utf8")
    );
  }

  return res.status(200).json(result);
}

return res.status(501).json({
  error: "Write operations are not enabled yet. Admin authentication must be configured first."
});
```

} catch (error) {
return res.status(500).json({ error: "Server error" });
}
}
