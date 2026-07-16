# Architecture

> Last updated: July 2026  
> Stack: Astro (static output) · Supabase (PostgreSQL + Storage) · TailwindCSS · TypeScript

---

## 1. General Data Flow

The site is built entirely as a **static site** (`output: "static"`). All Supabase queries run **at build time on the server**, never in the browser on page load. The runtime client-side JS only consumes data that was already embedded into the HTML by Astro.

### Build-time fetching — `src/lib/catalogCache.ts`

All data is fetched through a single entry point: `getCatalog()`.

```
getCatalog()
  ├─ figures   (with nested pokemon + volumes + collections)
  ├─ collections
  ├─ volumes
  ├─ tags
  └─ figure_tags  (join table figure ↔ tag)
```

`getCatalog()` uses a **module-level promise cache** (`catalogPromise`). The first call fires all five Supabase queries in parallel with `Promise.all`. Every subsequent call within the same build process reuses the resolved promise, so the database is never queried more than once per build regardless of how many pages call `getCatalog()`.

### How data reaches the catalogue page

`src/pages/index.astro` calls `getCatalog()` in its frontmatter (server/build context). It then:

1. Sorts figures by Pokédex number → line priority (`tomy` first, then `t_arts`) → `visual_order`.
2. Attaches a `tagIds` array to every figure using `getTagsForFigure()`.
3. Serialises the three datasets into three Astro `define:vars` variables passed to an `is:inline` script:

```html
<script is:inline define:vars={{ initialFigures, initialColecciones, initialEtiquetas }}>
  window.__FIGURES__    = initialFigures;
  window.__COLECCIONES__ = initialColecciones;
  window.__ETIQUETAS__  = initialEtiquetas;
</script>
```

The client-side module script reads these globals on startup:

```js
async function loadFigures()     { state.figures     = window.__FIGURES__     || []; }
async function loadCollections() { state.collections = window.__COLECCIONES__ || []; }
async function loadTags()        { state.tags        = window.__ETIQUETAS__   || []; }
```

**No Supabase calls are made in the browser on the catalogue page.**

### How data reaches detail pages

Every detail page (`figure/[slug].astro`, `collection/[slug].astro`, `collection/[slug]/volume/[numero].astro`, `attribute/[slug].astro`) uses the same pattern:

1. `getStaticPaths()` calls `getCatalog()` to enumerate all valid slugs and generate one static HTML file per entity.
2. The page-level frontmatter calls `getCatalog()` again (hitting the cache) to look up the specific entity and build its props.
3. The rendered HTML is fully static — no client-side data fetching occurs on these pages.

---

## 2. State Persistence

The catalogue page maintains a **client-side in-memory state object**:

```js
const state = {
  figures: [],        // full figure list (from window.__FIGURES__)
  collections: [],    // all collections (from window.__COLECCIONES__)
  tags: [],           // all tags (from window.__ETIQUETAS__)
  generation: "1",    // active generation tab ("all" | "1"–"9")
  line: null,         // active line filter ("tomy" | "t_arts" | null)
  attributes: [],     // active attribute filters (array of strings)
  collection: null,   // active collection filter (numeric ID | null)
  selectedTags: [],   // active tag filters (array of numeric IDs)
  search: "",         // current search query string
  lightbox: { photos: [], index: 0, caption: "" }
};
```

### Saving state when leaving the page

Two events trigger `saveCatalogState()`:

```js
window.addEventListener("beforeunload", saveCatalogState);
window.addEventListener("pagehide",     saveCatalogState);
```

`saveCatalogState()` writes the following snapshot to **`sessionStorage`** under the key `"catalogState"`:

```json
{
  "generation": "1",
  "line": null,
  "attributes": ["shiny"],
  "collection": null,
  "selectedTags": [3],
  "search": "",
  "scrollY": 1240
}
```

### Restoring state when returning to the catalogue

On `init()`, `loadCatalogState()` reads from `sessionStorage`. If a snapshot is found:

1. All state fields are restored from the snapshot.
2. The snapshot is **immediately deleted** (`clearCatalogState()`) so it is only consumed once.
3. `render()` runs with the restored state.
4. `scrollY` is restored via `window.scrollTo({ top: savedState.scrollY, behavior: "instant" })` inside a `requestAnimationFrame` callback, after the DOM has been painted.

This means the user who navigates to a figure detail page and then clicks **Back** will land on the catalogue with the exact same generation, filters, search query, and scroll position they had before leaving.

`sessionStorage` is scoped to the browser tab and is cleared when the tab is closed, so state never leaks between sessions.

---

## 3. Key Pages

### `src/pages/index.astro` — Catalogue

The main entry point of the site. Responsible for:

- Fetching and pre-sorting the full figure dataset at build time.
- Embedding all data into the page as `window.__FIGURES__`, `window.__COLECCIONES__`, and `window.__ETIQUETAS__`.
- Rendering the generation tab bar, filter panel (line, attributes, collection, tags), search bar, and the figure card grid.
- Managing all client-side interactivity: filtering, searching, card rendering (via `innerHTML`), lightbox, and state persistence via `sessionStorage`.

All card HTML is generated dynamically by the JS `renderCards()` function using `innerHTML` — the `#catalog-grid` element is empty in the static HTML.

---

### `src/pages/figure/[slug].astro` — Figure Detail

One static page per figure, routed by its `slug` column from the database.

Responsible for:
- Displaying all photos of the figure in a thumbnail gallery with a full-screen lightbox.
- Showing Pokédex metadata, line, attributes (badges), collection/volume membership, and tags.
- Rendering a breadcrumb trail (`Home → Collection → Volume → Figure name`).
- Generating full SEO metadata (`<title>`, `<meta description>`, Open Graph, Schema.org `ItemPage`).

Navigation back to the catalogue uses a plain `<a href="/">` link, which triggers `pagehide` / `beforeunload` on the catalogue page before the user left it, enabling scroll and filter restoration on return.

---

### `src/pages/collections.astro` — Collections Index

A static overview page listing every collection as `CollectionCard` components.

Responsible for:
- Sorting collections chronologically (`release_year`, then `release_month`) using `sortCollections()`.
- Computing per-collection metadata: lowest-volume cover image, figure count, volume count and involved lines (`tomy`, `t_arts` or both).
- Generating SEO metadata and Schema.org `ItemList` structured data.

The page is reachable from the main navigation via `SiteHeader`.

---

### `src/pages/collection/[slug].astro` — Collection Index

One static page per collection.

Responsible for:
- Listing all volumes of the collection as `VolumeCard` components.
- Listing all figures belonging to any volume of that collection as `FigureCard` components.
- Computing and rendering chronological previous/next collection navigation via `PrevNextNav`.
- Generating SEO metadata and Schema.org `CollectionPage` structured data.

Slug is derived at build time from the collection `name` field via `createSlug()`. Collection order is driven by the optional `release_year` / `release_month` columns; collections without a date are placed at the end and sorted alphabetically.

---

### `src/pages/collection/[slug]/volume/[numero].astro` — Volume Detail

One static page per volume, nested under its collection slug.

Responsible for:
- Displaying the volume cover image and listing all figures in that volume.
- Rendering breadcrumb `Home → Collection → Vol. N`.
- Generating SEO metadata and Schema.org `CollectionPage` structured data.

The `[numero]` param is derived from `volume.name_eng` (slugified) if present, otherwise from the numeric `volume.volume` field.

---

### `src/pages/attribute/[slug].astro` — Attribute Filter Page

One static page per attribute value that is actually used by at least one figure (`shiny`, `clear`, `brillante`, `con-base`). Pages are only generated for attributes present in the dataset.

Responsible for:
- Listing all figures that have a specific boolean attribute set to `true` in the database.
- Mapping the URL slug back to the correct database boolean column (`is_shiny`, `is_clear`, `is_pearl`, `has_base`).
- Generating SEO metadata with figure count.

---

### `src/pages/panel-secreto.astro` — Admin Panel

A private, fully client-side admin interface. It is excluded from search engines via `<meta name="robots" content="noindex, nofollow">` and blocked in `robots.txt` (`Disallow: /panel-secreto/`).

Responsible for:
- **Authentication** via Supabase Auth (`signInWithPassword`). All data operations are gated behind an authenticated session.
- **Listing figures** fetched live from Supabase (not from the build-time cache) with real-time search.
- **Creating and editing figures**: Pokémon selection by generation, line radio buttons, attribute checkboxes, collection/volume dropdowns, tag checkboxes, detail text, year, MFC ID.
- **Photo management**: selecting photos from the gallery or camera, compressing them client-side with `browser-image-compression` to WebP ≤ 150 KB, uploading to the Supabase Storage bucket `fotos-figuras`, and writing the resulting public URLs to the `images_urls` / `image_url` columns.
- **Tag relations**: managing the `figure_tags` join table (delete all then re-insert selected) on each save.

Unlike all other pages, this page makes **live Supabase queries in the browser** — it intentionally bypasses the static build-time cache.

---

## Appendix: File Map

```
src/
├── lib/
│   ├── catalogCache.ts      # getCatalog() — single build-time data source
│   ├── collectionSort.ts    # sortCollections() — chronological ordering helper
│   ├── figureTaxonomy.js    # LINES, ATTRIBUTES constants; label/filter helpers
│   ├── figurePhotos.js      # getFigurePhotos(), MAX_PHOTOS
│   ├── seo.ts               # SEO meta + Schema.org builders
│   ├── slug.ts              # createSlug() — URL-safe slug generator
│   └── supabaseClient.js    # Supabase client initialisation
├── pages/
│   ├── index.astro                              # Catalogue (main page)
│   ├── figure/[slug].astro                      # Figure detail
│   ├── collections.astro                        # Collections index
│   ├── collection/[slug].astro                  # Collection index
│   ├── collection/[slug]/volume/[numero].astro  # Volume detail
│   ├── attribute/[slug].astro                   # Attribute filter page
│   ├── panel-secreto.astro                      # Admin panel
│   └── robots.txt.ts                            # robots.txt generator
└── components/
    ├── BaseLayout.astro      # HTML shell, SEO <head>, theme init
    ├── SiteHeader.astro      # Main navigation header (Home, Collections, theme toggle)
    ├── Breadcrumb.astro      # Breadcrumb trail
    ├── BackLink.astro        # "Back to catalogue" link
    ├── FigureCard.astro      # Figure card (used in static list pages)
    ├── FigureBadges.astro    # Attribute + line badge strip
    ├── VolumeCard.astro      # Volume card (used in collection pages)
    ├── CollectionCard.astro  # Collection card (used on /collections)
    ├── CollectionNav.astro   # Collection/volume membership chips
    ├── PrevNextNav.astro     # Previous/next navigation arrows
    ├── ThemeToggle.astro     # Dark/light mode toggle button
    ├── EmptyState.astro      # Empty results placeholder
    └── JsonLd.astro          # JSON-LD <script> injector
```
