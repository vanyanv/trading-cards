# Release Dates for Pack Browse

## Context

The browse page currently has no concept of when a pack was actually released — it only tracks `created_at` (when added to the system). This means the "New" badge, "newest" sort, and pack display all lack real release date information. Users cannot easily discover the newest booster packs by actual release date.

## Goal

Add real release dates to packs, display them on pack cards, and make the "newest" sort use actual release dates so users can browse the latest sets.

## Data Source

The TCGdex SDK's `Set` type already exposes `releaseDate: string`. Both sync scripts (`sync-cards.ts`, `sync-tcgp.ts`) already fetch full set detail during their sync flow, so the release date is available at sync time with no additional API calls.

## Changes

### 1. Database: Add `release_date` column

**File:** New migration in `supabase/migrations/`

```sql
ALTER TABLE packs ADD COLUMN IF NOT EXISTS release_date DATE DEFAULT NULL;
```

Nullable because some packs may not have a known release date.

### 2. TypeScript Type

**File:** `types/index.ts`

Add to `Pack` interface after `created_at` (line 72), as the last field:

```typescript
release_date?: string | null;
```

### 3. Shared TCG Pocket Release Dates Map

**File:** `lib/constants.ts`

Add a shared `TCGP_RELEASE_DATES` map used by both the backfill script and `sync-tcgp.ts`:

```typescript
export const TCGP_RELEASE_DATES: Record<string, string> = {
  'A1': '2024-10-30',
  'A1a': '2024-12-17',
  'A2': '2025-01-29',
  'A2a': '2025-03-01',
  'A2b': '2025-05-29',
  // Add more as released
};
```

### 4. New API Export: `fetchSetDetail()`

**File:** `lib/pokemon-tcg-api.ts`

Add a new exported function to fetch a full `Set` object (which includes `releaseDate`). This is needed because `fetchCardsBySet()` fetches the set internally but only returns cards, and `cards[0].set` is a `SetResume` which lacks `releaseDate`.

```typescript
export async function fetchSetDetail(setId: string): Promise<SDKSet> {
  const set = await tcgdex.set.get(setId);
  if (!set) throw new Error(`Set ${setId} not found`);
  return set;
}
```

Note: This calls the same endpoint that `fetchCardsBySet()` calls, so with the SDK's 1-hour cache it won't result in duplicate API calls during sync.

### 5. Backfill Script

**File:** New `scripts/backfill-release-dates.ts`

- Query all distinct `set_id` from `packs` table
- For each, call `fetchSetDetail(setId)` to get `releaseDate`
- Fall back to `TCGP_RELEASE_DATES` map from `lib/constants.ts`
- Add 300ms delay between API calls to respect rate limits
- Batch-update `packs SET release_date = ? WHERE set_id = ?`
- Print summary of sets updated vs sets with no date found

### 6. Sync Script Integration

**File:** `scripts/sync-cards.ts`

In `syncSet()`, add a call to `fetchSetDetail(setId)` at the start of the function to get the full `Set` object with `releaseDate`. Then include `release_date` in both pack upsert paths:

- **Vintage edition packs** (lines 371-395, the `packData` object at lines 384-394): add `release_date: fullSet.releaseDate || null`
- **Modern packs** (lines 398-410, the upsert object): add `release_date: fullSet.releaseDate || null`

Import `fetchSetDetail` from `../lib/pokemon-tcg-api`.

**File:** `scripts/sync-tcgp.ts`

In `syncTCGPSet()`, `setDetail` is already a full `Set` object from `fetchTCGPSetDetail(setId)` (line 71). Add to the `packData` object (lines 171-182):

```typescript
release_date: setDetail.releaseDate || TCGP_RELEASE_DATES[setDetail.id] || null,
```

Import `TCGP_RELEASE_DATES` from `../lib/constants`.

### 7. PackCard Display

**File:** `components/PackCard.tsx`

Add between the pack name `<h3>` (line 99-101) and the price divider (line 103):

```tsx
{pack.release_date && (
  <p className="mt-1 text-[10px] text-muted-dim">
    {formatReleaseDate(pack.release_date)}
  </p>
)}
```

Date formatter (inline in PackCard.tsx):

```typescript
function formatReleaseDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
```

Output: "Aug 2023", "Jan 1999", etc. Uses UTC to avoid timezone boundary issues.

### 8. BrowsePacks Inline Card Display

**File:** `components/BrowsePacks.tsx`

The browse page renders its own inline pack cards (lines 334-404) and does NOT use `PackCard`. Add the same release date display between the `<h3>` (lines 372-374) and the price divider (lines 376):

```tsx
{pack.release_date && (
  <p className="mt-1 text-[10px] text-muted-dim">
    {formatReleaseDate(pack.release_date)}
  </p>
)}
```

Import/define the same `formatReleaseDate` helper.

### 9. "New" Badge Logic

**File:** `components/PackCard.tsx`

Change `isNew()` (lines 11-14) to accept a `Pack` and use `release_date` with `created_at` fallback:

```typescript
function isNew(pack: Pack): boolean {
  const dateStr = pack.release_date || pack.created_at;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 30 * 24 * 60 * 60 * 1000; // 30 days for release dates
}
```

Update call site at line 42 from `const packIsNew = isNew(pack.created_at)` to `const packIsNew = isNew(pack)`.

Note: With real release dates, 7 days is too tight — a set released 8 days ago is still "new." 30 days is more appropriate for TCG set releases.

### 10. "Newest" Sort

**File:** `components/BrowsePacks.tsx`

Change the `'newest'` case (lines 116-117):

```typescript
case 'newest': {
  const aDate = a.release_date || a.created_at;
  const bDate = b.release_date || b.created_at;
  return new Date(bDate).getTime() - new Date(aDate).getTime();
}
```

### 11. No Fetcher Changes Needed

`fetchAvailablePacks()` in `lib/query/fetchers.ts` uses `select('*')`, so the new column is automatically included. Same for the server-side query in `app/browse/page.tsx`.

## Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/2026XXXX_add_release_date.sql` | New migration |
| `types/index.ts` | Add `release_date` to Pack interface |
| `lib/constants.ts` | Add shared `TCGP_RELEASE_DATES` map |
| `lib/pokemon-tcg-api.ts` | Add `fetchSetDetail()` export |
| `scripts/backfill-release-dates.ts` | New backfill script |
| `scripts/sync-cards.ts` | Call `fetchSetDetail()`, include `release_date` in pack upserts |
| `scripts/sync-tcgp.ts` | Include `release_date` in pack upsert with TCGP fallback |
| `components/PackCard.tsx` | Display date, update `isNew()`, add `formatReleaseDate()` |
| `components/BrowsePacks.tsx` | Display date in inline cards, update "newest" sort |

## Verification

1. Run the migration against local Supabase
2. Run the backfill script — verify packs have release dates populated
3. Check the browse page: release dates visible under pack names (both `PackCard` and inline cards in `BrowsePacks`)
4. Sort by "newest" — verify packs are ordered by actual release date
5. Check "New" badge appears on recently released packs (within 30 days)
6. Run `sync-cards.ts --set sv09` — verify new pack gets `release_date` populated
7. Run `sync-tcgp.ts` — verify TCGP packs get release dates (from API or fallback map)
8. Verify packs without release dates render gracefully (no date shown, sort falls back to `created_at`)
