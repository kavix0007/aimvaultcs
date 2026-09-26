# AimVaultCS

AimVaultCS is the separate Counter-Strike 2 version of AimVault. It keeps the desktop-first AimVault-style architecture while using CS2 crosshair codes, CS2 settings, static manual player pages, a CS2 generator, Supabase crosshair storage, GitHub-backed player-page editing, and SEO-focused guides/categories.

## Core architecture

- `index.html` — homepage
- `crosshair-codes/` — CS2 crosshair library
- `crosshairs/` — category pages
- `pro-players/` — player directory
- player folders such as `/donk/` — manually created static player pages
- `guides/` — CS2 search-intent guides
- `generator/` — CS2 crosshair generator
- `assets/` — shared CSS/JS/images
- `supabase-schema.sql` — separate AimVaultCS database schema
- `supabase-copy-count-migration.sql` — live copy-count migration
- `sitemap.xml` / `robots.txt`

## Admin panel

Open `/admin/` after deployment.

### Crosshair Editor

The editor lets you manually add/edit/delete published CS2 crosshairs. It keeps the simple workflow requested for AimVaultCS:

- Name
- Player
- CS2 share code or console configuration
- Individual crosshair preview image URL
- Categories
- Tags
- Published toggle
- Generate a default CS2 console configuration
- Live CS2 code preview and Copy button

There are **no per-crosshair background URLs** and no duplicate slider/control section. One fixed background is used automatically everywhere.

### Fixed crosshair background

The single shared background is:

`assets/images/crosshair-background.webp`

Replace that one file to change the background used by crosshair previews/cards and the Admin live preview. No database background field is needed.

### Live copy counts

Crosshair cards and player pages show a live `Copied N times` counter. A successful Copy action calls the atomic Supabase RPC `increment_cs2_copy_count`. Supabase Realtime updates open pages when the count changes.

Run `supabase-copy-count-migration.sql` once in the separate AimVaultCS Supabase project if the `copy_count` column/RPC is not already installed.

### Static player-page system

Players remain **static HTML pages**, not a `player_profiles` table.

You create a page yourself, for example:

`/donk/index.html`

The page contains a `window.PLAYER` object. The Admin → Player Pages scanner detects existing pages with that object.

The Admin editor can then edit the detected page's:

- name
- real name
- slug
- team
- country/region
- role
- introduction
- CS2 share code
- player image URL
- crosshair image URL
- verified snapshot
- crosshair categories
- crosshair settings JSON
- SEO title
- SEO description

The editor **does not create player pages**. You create/copy the HTML page manually first, then scan it and edit it from Admin.

When a player page is saved, its CS2 crosshair is also synchronized into `cs2_crosshairs` as a published PRO crosshair and assigned the selected categories. This makes the player's crosshair appear in the Pro category and selected category pages.

### GitHub connection

Use a fine-grained GitHub token limited to the AimVaultCS repository with:

`Contents: Read and write`

The owner, repository, branch, and token are stored only in the browser's local storage. Never commit the token to the repository.

## Supabase

The public site can read published crosshairs. Authenticated admins can manage crosshairs through RLS. The frontend never uses a `service_role` key.

Create the administrator in Supabase Auth and add that Auth user's UUID to `public.admin_users`.

If you see `permission denied for table cs2_crosshairs`, run the current `supabase-schema.sql` in the AimVaultCS Supabase project.

## Player workflow

1. Copy an existing player folder.
2. Rename the folder.
3. Edit `index.html` and its `window.PLAYER` data.
4. Add real player/crosshair information and image URLs when available.
5. Commit/push the page to GitHub.
6. Open Admin → Player Pages → Scan GitHub repository.
7. Select the detected page if you want to edit its information from Admin.
8. Save the page to update the existing GitHub HTML.

Do not add unsupported or invented player facts.

## Pro Players main page editor
The Admin dashboard now includes a **Pro Players Page** tab. It edits the existing `/pro-players/index.html` through GitHub, including the page H1, intro, SEO title/description, and player cards (name, existing player URL, label/team, image URL, and crosshair code/config). It does not create player pages. Player pages remain manually created static HTML files and are edited through the Player Pages tab.

### Important pro-player draft pages

The project also includes ready-to-edit static draft folders for additional high-interest CS2 pro players:

`/device/`, `/ropz/`, `/sh1ro/`, `/jl/`, `/b1t/`, `/twistzz/`, `/broky/`, `/frozen/`, `/xantares/`, `/elige/`, `/rain/`, `/karrigan/`, `/yekindar/`, `/stavn/`, `/hunter/`

These drafts intentionally contain **no invented team, country, role, image, or crosshair data**. They use `noindex,nofollow` until you fill in and verify the information. After editing, change the page to `index,follow`, update the canonical/SEO fields, and add the published URL to `sitemap.xml`. The GitHub scanner detects these pages because each contains `window.PLAYER`.
