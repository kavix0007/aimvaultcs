# AIMVAULT

CS2 Crosshairs, Pro Settings & Gaming Tools — a static, no-build website.

Live domain target: **https://aimvaultcs.online/**

## What this is

AIMVAULT is a plain **HTML5 + CSS3 + Vanilla JavaScript** site. There is no
framework, no bundler, no npm install, and no backend. Every page works by
opening the folder in a static file server (or GitHub Pages) — nothing needs
to be "built."

All crosshair previews are drawn live on `<canvas>` from JSON data. Nothing
is a screenshot or a copied asset.

## Project structure

```
AIMVAULT/
├── index.html            Homepage — hero, recently added, popular grid, SEO content
├── crosshairs.html        Full crosshair database (search/filter/sort)
├── crosshair.html          Single crosshair detail page  → crosshair.html?id=donk
├── generator.html         Live crosshair builder
├── pro-settings.html      Pro player settings grid
├── tools.html              eDPI / sensitivity / FOV / cm-360 calculators
├── guides.html              Guide index
├── guide.html                Single guide page          → guide.html?slug=...
├── styles.css               All styles (design tokens at the top)
├── app.js                    Shared logic: canvas rendering, command
│                              generation, copy counter, card + browser components
├── generator.js             generator.html only
├── tools.js                    tools.html only
├── pro-settings.js           pro-settings.html only
├── data/
│   ├── crosshairs.json      The crosshair database — edit this to add crosshairs
│   ├── players.json          Pro settings database
│   └── guides.json            Guide content
├── assets/
│   ├── logo/logo.svg
│   ├── icons/favicon.svg
│   └── images/og-cover.png   Social share image
├── robots.txt
├── sitemap.xml                Generated from the JSON data (see below)
└── README.md
```

## Adding a new crosshair (no HTML editing required)

Open `data/crosshairs.json` and add an object to the `crosshairs` array:

```json
{
  "id": "new-player",
  "name": "New Player",
  "team": "Team Name",
  "role": "Rifler",
  "category": "pro",
  "color": "cyan",
  "size": 2,
  "gap": -2,
  "thickness": 1,
  "outline": true,
  "outlineThickness": 1,
  "dot": false,
  "style": 4,
  "copies": 0,
  "dateAdded": "2026-01-01",
  "verified": false
}
```

- `id` must be unique and URL-safe (used in `crosshair.html?id=...`).
- `color` must be one of: `green, cyan, blue, yellow, red, white, pink, orange, purple`.
- `verified` should stay `false` unless you have personally confirmed the
  settings against the player's current, live configuration. The site's UI
  and copy intentionally avoid claiming unverified data is a player's real
  current setup — please keep it that way if you extend the content.

The card grids, carousels, detail page, and sitemap all read from this file
automatically. Adding pro player specs works the same way in
`data/players.json`, and guides in `data/guides.json`.

## Regenerating sitemap.xml

`sitemap.xml` is generated from the JSON data so it can't drift out of sync.
If you add or remove crosshairs/guides, regenerate it with any script that
reads `data/crosshairs.json` and `data/guides.json` and writes one `<url>`
per static page, per crosshair (`crosshair.html?id=`) and per guide
(`guide.html?slug=`). A minimal Node or Python script of ~20 lines will do —
the current file was generated exactly that way.

## The copy counter (and how to make it a real global counter)

Right now, "copies" shown on the site are **local to each visitor's browser**
via `localStorage` (see `COPY_COUNTER_KEY` in `app.js`). This is intentional —
there is no backend in this version, so a real shared counter isn't possible
without one. The code is written so this is a one-file change:

```js
// in app.js, replace the CopyCounter export:
const SupabaseCopyCounter = {
  async get(id) {
    const { data } = await supabase.from('copies').select('count').eq('id', id).single();
    return data?.count ?? 0;
  },
  async increment(id) {
    const { data } = await supabase.rpc('increment_copy', { crosshair_id: id });
    return data;
  }
};
// AIMVAULT.CopyCounter = SupabaseCopyCounter;
```

Every place in the codebase calls `AIMVAULT.CopyCounter.get(...)` and
`AIMVAULT.CopyCounter.increment(...)` — no other file needs to change.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository (root of the repo, or a `/docs` folder).
2. In the repo settings, enable **Pages** and point it at the branch/folder you used.
3. Add a `CNAME` file containing `aimvaultcs.online` if you're using the custom domain, and configure the domain's DNS per GitHub's instructions.
4. No build step is required — GitHub Pages serves the files as-is.

## Known limitations (by design, for a static-only v1)

- **Client-rendered detail pages and SEO.** `crosshair.html` and `guide.html`
  update `<title>`, meta description, canonical, and OG tags *after* the
  JSON loads via JavaScript. Search engines that execute JavaScript (Google)
  will generally index this fine, but crawlers that don't run JS will only
  see the generic fallback tags in the raw HTML. If this matters for your
  SEO goals, the natural next step is static pre-rendering (a small build
  script that writes one physical HTML file per crosshair/guide from the
  same JSON — the templates in this repo are already structured to make
  that a mechanical conversion, not a rewrite).
- **Sensitivity converter ratios** (`tools.js`) use commonly-cited,
  approximate per-game turn-rate constants. They're a reasonable estimate,
  not a guarantee — always confirm in your target game.
- **No accounts, no real global copy counts, no backend** — see above.

## Content & data disclaimer

Player names, teams, roles, and settings in `data/crosshairs.json` and
`data/players.json` are example/community-tracked data for demonstration
and are **not verified** against any player's current or official
configuration. The UI reflects this (each entry shows a "Community example"
badge unless `verified: true`). Please keep this honest if you populate the
database with real data — only mark entries `verified: true` once you've
confirmed them against a current, citable source.

CS2 and Counter-Strike are trademarks of Valve Corporation. AIMVAULT is a
fan-made, unofficial project and is not affiliated with or endorsed by Valve.
