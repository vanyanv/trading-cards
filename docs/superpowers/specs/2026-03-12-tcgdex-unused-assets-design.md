# TCGdex Unused Assets Integration

## Context

The app already uses `@tcgdex/sdk` for card data, but only consumes a subset of what's available. TCGdex provides set symbols (small set icons), serie logos, card variant metadata, and WebP image formats — none of which are currently stored or displayed. This change enriches the app's visual identity with these free assets.

## Scope

1. **WebP images** — switch all stored image URLs from PNG to WebP for smaller file sizes
2. **Set symbols** — store and display the small set icon (e.g. the flame for Darkness Ablaze)
3. **Serie logos** — store the series logo (e.g. Sword & Shield branding)
4. **Card variants** — store which print variants exist per card (normal, holo, reverse, firstEdition)

## Database Changes

### Migration: add new columns

```sql
-- Cards: add variants metadata and set symbol URL
ALTER TABLE cards ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS set_symbol_url TEXT DEFAULT NULL;

-- Packs: add set symbol and serie logo URLs
ALTER TABLE packs ADD COLUMN IF NOT EXISTS set_symbol_url TEXT DEFAULT NULL;
ALTER TABLE packs ADD COLUMN IF NOT EXISTS serie_logo_url TEXT DEFAULT NULL;
```

No new tables. Image URL columns (`image_url`, `image_url_hires`, `packs.image_url`) keep their names — the sync script will write `.webp` URLs instead of `.png`.

### Files
- New migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_tcgdex_assets.sql`

## Sync Script Changes

### `lib/pokemon-tcg-api.ts`
- Update `TCGCard` type to include `variants` field (matches SDK's `variants` interface: `normal`, `reverse`, `holo`, `firstEdition`)
- Note: `variants_detailed` is also available but not needed for this feature

### `scripts/sync-cards.ts`

**Card sync (in `syncSet` function):**
- Change `${card.image}/low.png` → `${card.image}/low.webp`
- Change `${card.image}/high.png` → `${card.image}/high.webp`
- Store `card.variants` JSON in new `variants` column
- Store `${set.symbol}.webp` in `set_symbol_url` (TCGdex returns `set.symbol` as a full URL base like `https://assets.tcgdex.net/univ/swsh/swsh3/symbol` — we append `.webp` just like we currently append `.png` to `set.logo`)

**Pack sync (both modern and vintage paths):**

Both pack creation paths must be updated:
- **Modern path** (line ~398, `onConflict: 'set_id'`): add `set_symbol_url` and `serie_logo_url` to upsert
- **Vintage/edition path** (lines ~356-395, select-then-insert/update): add both fields to `packData` object

Changes for both paths:
- Change set logo from `.png` → `.webp`
- Store `${set.symbol}.webp` in `set_symbol_url`
- Store serie logo URL in `serie_logo_url`

**Serie logo fetching:**
- Deduplicate serie API calls: many sets share the same serie (e.g. all SWSH sets share the "swsh" serie). Build a `Map<string, string>` cache of `serieId → logoUrl` to avoid redundant calls.
- The set detail response includes `set.serie.id` — use this to key the cache
- Fetch `tcgdex.serie.get(serieId)` only on cache miss, then store `${serie.logo}.webp`

### Data flow
```
TCGdex API card.variants → cards.variants (JSONB)
TCGdex API set.symbol    → cards.set_symbol_url, packs.set_symbol_url (TEXT)
TCGdex API serie.logo    → packs.serie_logo_url (TEXT)
TCGdex API card.image    → cards.image_url (now .webp)
TCGdex API set.logo      → packs.image_url (now .webp)
```

## Type Changes

### `types/index.ts`

Add to `Card` interface:
```typescript
variants?: {
  normal?: boolean;
  holo?: boolean;
  reverse?: boolean;
  firstEdition?: boolean;
} | null;
set_symbol_url?: string | null;
```

Add to `Pack` interface:
```typescript
set_symbol_url?: string | null;
serie_logo_url?: string | null;
```

## UI Changes

### Set Symbol — Subtle Corner Badge

Display the set symbol as a small (~16px) semi-transparent icon on card renders.

**Components to update:**

- **`components/CardDisplay.tsx`** — add set symbol as small corner badge (bottom-left or top-right, avoiding collision with existing reverse-holo and edition badges). Use `card.set_symbol_url`.
- **`components/CardListItem.tsx`** — show set symbol icon inline next to `set_name` text. Use `card.set_symbol_url`.
- **`components/BrowsePacks.tsx`** — show set symbol in the set filter dropdown items next to set names. Use `pack.set_symbol_url`.
- **`components/PackCard.tsx`** — small set symbol badge in corner area. Use `pack.set_symbol_url`.

Implementation: Use Next.js `Image` component with `width={16} height={16}` and reduced opacity (~0.7).

### Serie Logo

- **`components/PackDetail.tsx`** — show serie logo in the pack info section using `pack.serie_logo_url`
- **`components/BrowsePacks.tsx`** — optionally show as group header when browsing by series

Note: TCGdex's serie `logo` field points to the first set's logo in the series, not a dedicated series branding image. This is still useful as a visual identifier for the era.

### Card Variants Display

- **`components/CardDetailContent.tsx`** — show available variants as small badges/chips (e.g. "Normal", "Holo", "Reverse Holo") in the card info section, alongside existing variant pricing tabs
- Only show variants that are `true` in the variants JSON
- Note: when `card.variants` is null, the set-level variants apply (TCGdex card variants override set variants). For simplicity, we only display variants when the card-level data is present.

## Backward Compatibility

The `.png` → `.webp` URL switch happens per-card during sync. Between migration and full sync completion, the DB will contain a mix of old `.png` and new `.webp` URLs. This is fine because:
- Next.js `Image` component handles both formats
- TCGdex CDN serves both formats at the same path
- No format-specific logic exists in the app

After full sync completes, all URLs will be `.webp`. The Next.js image optimization cache (`/_next/image`) will naturally expire old entries based on its default TTL.

## Next.js Config

No changes needed — `assets.tcgdex.net` is already allowed in `next.config.ts` remote patterns, and Next.js Image handles WebP natively.

## Verification

1. Run migration: `npx supabase migration up` or apply to hosted DB
2. Run sync on a single set: `npx tsx --env-file=.env.local scripts/sync-cards.ts --set sv09`
3. Verify in DB: cards have `variants` JSON, `set_symbol_url`, and `.webp` image URLs; packs have `set_symbol_url` and `serie_logo_url`
4. Check UI: card grid shows small set symbol badges, card detail shows variant chips, images load correctly as WebP
5. Full sync: `npx tsx --env-file=.env.local scripts/sync-cards.ts`
6. Run `npm run build` to verify no type errors
