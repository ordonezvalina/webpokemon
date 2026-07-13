# Pokémon Tomy Collection Catalogue

A personal static web catalogue of Pokémon figures from the Takara Tomy Moncolle and T-Arts product lines.  
Built with [Astro](https://astro.build/), [Tailwind CSS v4](https://tailwindcss.com/) and [Supabase](https://supabase.com/).

---

## Features

- **Public catalogue** — figure grid with live client-side filtering by generation, line, attributes, collection, tags and free-text search.
- **State persistence** — active filters, search query and scroll position are saved to `sessionStorage` and restored when navigating back from a detail page.
- **Figure detail pages** — photo gallery with full-screen lightbox, Pokédex metadata, attributes, collection/volume membership and tags.
- **Collection & volume pages** — one static page per collection and one per volume, listing all associated figures.
- **Attribute filter pages** — dedicated pages for each special attribute (shiny, clear, pearl/brillante, with base).
- **Dark / light mode** — class-based toggle that respects `prefers-color-scheme` on first visit and persists via `localStorage`.
- **SEO** — per-page `<title>`, `<meta description>`, Open Graph, Twitter Cards, Schema.org structured data (`WebSite`, `ItemPage`, `CollectionPage`, `BreadcrumbList`), auto-generated sitemap and `robots.txt`.
- **Admin panel** — private interface for creating and editing figures, managing photos and tags (hidden from search engines).
- **Fully static output** — Astro pre-renders all public pages at build time; no server runtime required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro](https://astro.build/) (static output) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite` |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + Storage) |
| DB client | `@supabase/supabase-js` |
| Image processing | `browser-image-compression`, `sharp` |
| Sitemap | `@astrojs/sitemap` |
| Type checking | TypeScript + `@astrojs/check` |

---

## Architecture Summary

The site follows a **build-time fetch → static HTML → client-side interaction** pattern.

1. At build time, `getCatalog()` (`src/lib/catalogCache.ts`) fires five parallel Supabase queries (figures, collections, volumes, tags, figure_tags) and caches the result for the duration of the build.
2. Every page calls `getCatalog()` — subsequent calls hit the in-process cache; the database is never queried more than once per build.
3. The catalogue page serialises all data into `window.__FIGURES__`, `window.__COLECCIONES__` and `window.__ETIQUETAS__` via Astro's `define:vars`. The client-side script reads these globals — **no Supabase calls happen in the browser** on any public page.
4. The admin panel (`/panel-secreto`) is the sole exception: it queries Supabase live in the browser, gated behind Supabase Auth.

→ Full details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## Project Structure

```
├── public/
│   ├── favicon.svg
│   ├── og-default.svg          # Default Open Graph image
│   └── volume-covers/          # Static cover images for volumes
├── src/
│   ├── components/
│   │   ├── BaseLayout.astro    # HTML shell, SEO <head>, theme init script
│   │   ├── Breadcrumb.astro
│   │   ├── BackLink.astro
│   │   ├── FigureCard.astro
│   │   ├── FigureBadges.astro
│   │   ├── VolumeCard.astro
│   │   ├── CollectionNav.astro
│   │   ├── ThemeToggle.astro
│   │   ├── EmptyState.astro
│   │   └── JsonLd.astro
│   ├── lib/
│   │   ├── catalogCache.ts     # getCatalog() — single build-time data source
│   │   ├── figureTaxonomy.js   # Line/attribute constants and label helpers
│   │   ├── figurePhotos.js     # getFigurePhotos(), MAX_PHOTOS
│   │   ├── seo.ts              # SEO meta + Schema.org builders
│   │   ├── slug.ts             # createSlug() — URL-safe slug generator
│   │   └── supabaseClient.js   # Supabase client initialisation
│   ├── pages/
│   │   ├── index.astro                             # Catalogue (main page)
│   │   ├── figure/[slug].astro                     # Figure detail
│   │   ├── collection/[slug].astro                 # Collection index
│   │   ├── collection/[slug]/volume/[numero].astro # Volume detail
│   │   ├── attribute/[slug].astro                  # Attribute filter page
│   │   ├── panel-secreto.astro                     # Admin panel
│   │   └── robots.txt.ts                           # robots.txt generator
│   └── styles/
│       └── global.css          # Tailwind v4 entry point + base styles
├── supabase/
│   ├── schema.sql              # Full schema + all RLS policies (authoritative)
│   ├── migration-rls-all-tables.sql
│   ├── migration-linea-atributos.sql
│   ├── migration-fotos-multiples.sql
│   └── migration-anio-mfc.sql
├── tools/                      # One-off utility scripts (seed, cover download)
├── docs/
│   ├── ARCHITECTURE.md
│   └── DATABASE_AND_SECURITY.md
├── astro.config.mjs
└── package.json
```

---

## Environment Variables

Create a `.env` file at the project root with the following variables:

```env
# Supabase project credentials (required for build and admin panel)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

# Canonical site URL — used for SEO, sitemap and Open Graph (required for production)
PUBLIC_SITE_URL=https://your-domain.com
```

> Copy `.env.example` to `.env`, fill in your values, and never commit `.env`.  
> `PUBLIC_SITE_URL` defaults to `https://example.com` in `astro.config.mjs` if not set. Always configure it before deploying.

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd <project-folder>

# Install dependencies
npm install
```

---

## Development Workflow

```bash
# Start the local dev server (with hot reload)
npm run dev
```

The dev server runs at `http://localhost:4321` by default.  
During development, `getCatalog()` queries Supabase on every page request — ensure your `.env` credentials are set correctly.

---

## Build Process

```bash
# Run TypeScript/Astro type-check then generate the static site
npm run build

# Preview the production build locally
npm run preview
```

`npm run build` runs `astro check` (TypeScript diagnostics across all `.astro` and `.ts` files) followed by `astro build`. The output is written to `dist/`. All public pages are pre-rendered as static HTML; the admin panel is also statically rendered but its data loading happens entirely in the browser at runtime.

---

## Deployment

The `dist/` folder is a standard static site and can be deployed to any static hosting provider:

- **Netlify** — drag-and-drop or connect the repository; set environment variables in the Netlify dashboard.
- **Vercel** — import the project; framework preset: Astro.
- **Cloudflare Pages** — connect the repository; build command: `npm run build`; output directory: `dist`.
- **GitHub Pages** — any static host adapter works; set the `site` URL in `astro.config.mjs`.

Set `PUBLIC_SITE_URL` to the production domain in all cases. The sitemap and canonical URLs depend on it.

---

## Database Overview

Supabase is used as the sole data store. All six application tables reside in the `public` schema:

| Table | Description |
|---|---|
| `figures` | Core catalogue entries (one row per physical figure) |
| `pokemon` | Pokémon reference data (Pokédex number, name variants, generation, form) |
| `collections` | Named product lines (e.g. "Pokémon Yummy Sweets Mascot") |
| `volumes` | Individual volumes within a collection |
| `tags` | User-defined tags (e.g. "Special Edition") |
| `figure_tags` | Many-to-many join table linking figures to tags |

The Supabase Storage bucket **`fotos-figuras`** stores figure photos uploaded via the admin panel. Photos are compressed to WebP ≤ 150 KB client-side before upload.

Schema definition and all migrations are in `supabase/`. Apply them manually via the Supabase Dashboard SQL Editor.

→ Full details: [`docs/DATABASE_AND_SECURITY.md`](docs/DATABASE_AND_SECURITY.md)

---

## Security Overview

Row Level Security (RLS) is enabled on **all six tables**. The policy model is uniform:

- **SELECT** — allowed for both `anon` and `authenticated` roles (required for the static build and public browsing).
- **INSERT / UPDATE / DELETE** — restricted to the `authenticated` role exclusively (admin panel operations only).

The `anon` key embedded in the frontend can never write, modify or delete any data. The admin panel is additionally excluded from search engines via `<meta name="robots" content="noindex, nofollow">` and `robots.txt`.

→ Full policy definitions and rationale: [`docs/DATABASE_AND_SECURITY.md`](docs/DATABASE_AND_SECURITY.md)

---

## SEO Overview

Every page generates a full set of meta tags via `src/lib/seo.ts`:

- **Title** — `Page name | Pokémon Tomy Collection` pattern.
- **Description** — per-page, truncated to 160 characters.
- **Canonical URL** — derived from `Astro.site` + page path.
- **Open Graph** — title, description, type, URL, image. Falls back to `public/og-default.svg`.
- **Twitter Cards** — `summary_large_image` format with the same image.
- **Schema.org** — `WebSite` (home), `ItemPage` (figure detail), `CollectionPage` (collection/volume), `BreadcrumbList` (all detail pages). Injected as JSON-LD via the `JsonLd` component.
- **Sitemap** — auto-generated by `@astrojs/sitemap`; `/panel-secreto/` is excluded by the filter in `astro.config.mjs`.
- **robots.txt** — generated at build time by `src/pages/robots.txt.ts`; disallows `/panel-secreto/`.

---

## Admin Panel

The admin panel is accessible at `/panel-secreto`. It is a fully client-side interface built into a single Astro page. It is not linked from any public page.

**Capabilities:**
- Login / logout via Supabase Auth (email + password).
- Browse and search all figures with live filtering.
- Create and edit figures: Pokémon selection by generation, line, attributes, collection, volume, tags, details, year, MFC ID.
- Manage up to 4 photos per figure: select from gallery or camera, compress to WebP client-side, upload to Supabase Storage.
- Tag assignment via the `figure_tags` join table (full replace on each save).

**Access:** Requires a Supabase Auth user with the `authenticated` role. No service role key is used.

---

## Utility Scripts (`tools/`)

These are one-off Node.js scripts used during initial data setup. They are **not part of the build** and require manual credential configuration before running.

| Script | Purpose |
|---|---|
| `seed-pokemon.js` | Seeds the `pokemon` table with Pokédex data |
| `seed-database.js` | Bulk-inserts collection/volume data from `volumes-staging.json` |
| `download-covers.js` | Downloads volume cover images to `public/volume-covers/` |
| `extract-metadata.js` | Extracts metadata from local image files |

---

## Documentation Index

| Document | Contents |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Data flow, state persistence, page responsibilities |
| [`docs/DATABASE_AND_SECURITY.md`](docs/DATABASE_AND_SECURITY.md) | RLS setup, access policies, migration reference |

---

## License

Private project — all rights reserved. Not licensed for redistribution or reuse.
