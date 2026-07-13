# Database & Security

> Last updated: July 2026  
> Stack: Astro (static output) · Supabase (PostgreSQL + Storage) · TailwindCSS · TypeScript

---

## 1. Security Overview

This project uses **Supabase Row Level Security (RLS)** as the primary access control mechanism for all database tables.

RLS is a PostgreSQL feature that enforces access rules **at the database engine level**, independently of the application layer. Even if a query reaches Supabase with a valid API key, the database itself will block any operation that is not explicitly permitted by a policy. This means:

- **The `anon` key** (embedded in the public frontend) can only ever read data — it cannot write, modify, or delete any row, in any table, regardless of how the request is constructed.
- **The `authenticated` role** (obtained after a successful login through the admin panel) is the only principal allowed to perform write operations.
- There is **no server-side application layer** to bypass — the Astro site is fully static and the admin panel talks directly to Supabase. RLS is therefore the single security boundary for all data mutations.

This architecture deliberately follows the [principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege): the public surface of the site is read-only by construction, and write access is gated exclusively behind authenticated sessions managed by Supabase Auth.

---

## 2. Protected Schema

All six application tables have RLS **enabled**. The table below reflects the current state after applying `supabase/migration-rls-all-tables.sql`.

| Table | RLS Enabled | Notes |
|---|---|---|
| `figures` | ✅ | Core catalogue entries. First table to receive RLS (defined in `schema.sql`). |
| `collections` | ✅ | Groups of related volumes. |
| `volumes` | ✅ | Individual volumes within a collection. |
| `pokemon` | ✅ | Pokémon reference data (Pokédex number, name, generation, form). |
| `tags` | ✅ | User-defined tags applied to figures (e.g. "Special Edition"). |
| `figure_tags` | ✅ | Many-to-many join table linking figures to tags. |

Additionally, the **Supabase Storage bucket `fotos-figuras`** has equivalent policies applied at the `storage.objects` level (public read, authenticated write/update/delete). This is documented in `schema.sql` alongside the table policies.

---

## 3. Access Policies

Every table follows the same four-policy pattern. The rules below apply uniformly to all six tables listed above.

### SELECT — Public read

```sql
create policy "Public read access to <table>"
on public.<table>
for select
to anon, authenticated
using (true);
```

- **Who:** Both the `anon` role and the `authenticated` role.
- **Why:** The Astro static build runs at deploy time using the public `anon` key. All five parallel `getCatalog()` queries (figures, collections, volumes, tags, figure_tags) must succeed without authentication. The catalogue and all detail pages are read-only by design.
- **Condition:** `using (true)` — no row-level filter; all rows in the table are visible.

---

### INSERT — Authenticated only

```sql
create policy "Authenticated users can insert <table>"
on public.<table>
for insert
to authenticated
with check (true);
```

- **Who:** `authenticated` role only (active session from the admin panel login).
- **Why:** Only the admin panel (`/panel-secreto`) creates new rows. The `anon` role has no insert capability.
- **Condition:** `with check (true)` — no additional row predicate; any row the authenticated user submits is accepted.

---

### UPDATE — Authenticated only

```sql
create policy "Authenticated users can update <table>"
on public.<table>
for update
to authenticated
using (true)
with check (true);
```

- **Who:** `authenticated` role only.
- **Why:** Editing existing figures (and their related data) is an admin-only operation.
- **Conditions:** Both `using (true)` (any existing row can be targeted) and `with check (true)` (any resulting row state is accepted).

---

### DELETE — Authenticated only

```sql
create policy "Authenticated users can delete <table>"
on public.<table>
for delete
to authenticated
using (true);
```

- **Who:** `authenticated` role only.
- **Why:** Deleting records is an admin-only operation. The `anon` role cannot remove any row from any table.
- **Condition:** `using (true)` — no row-level restriction on which rows can be deleted.

---

### Policy summary matrix

| Operation | `anon` role | `authenticated` role |
|---|---|---|
| SELECT | ✅ Allowed | ✅ Allowed |
| INSERT | ❌ Blocked | ✅ Allowed |
| UPDATE | ❌ Blocked | ✅ Allowed |
| DELETE | ❌ Blocked | ✅ Allowed |

This matrix applies identically to all six tables: `figures`, `collections`, `volumes`, `pokemon`, `tags`, and `figure_tags`.

---

## 4. Reference Files

The following files in the repository are the **authoritative sources of truth** for the database schema and security configuration. Any future changes to table structure or access policies must be reflected here.

| File | Purpose |
|---|---|
| `supabase/schema.sql` | Full database schema: table definitions, indexes, RLS activation, all policies for tables and storage. Re-runnable (`drop policy if exists` guards). |
| `supabase/migration-rls-all-tables.sql` | Standalone migration that enables RLS and creates the four policies on `collections`, `volumes`, `pokemon`, `tags`, and `figure_tags`. Safe to re-run. |
| `supabase/migration-linea-atributos.sql` | Adds the `line` / attribute boolean columns to `figures` and their constraints. |
| `supabase/migration-fotos-multiples.sql` | Adds the `images_urls` array column to `figures` for multi-photo support. |
| `supabase/migration-anio-mfc.sql` | Adds the `year` and `mfc_id` columns to `figures`. |

### Applying a migration

All SQL files are designed to be pasted directly into the **Supabase Dashboard → SQL Editor** and executed. They are idempotent — `drop policy if exists` and `create … if not exists` guards ensure they can be re-run safely without side effects.

> **No Supabase CLI is configured in this project.** Migrations are applied manually through the dashboard SQL editor.
