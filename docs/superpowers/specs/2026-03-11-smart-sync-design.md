# Smart Sync: Auto-Discovery & Pricing Improvements

## Problem

The card sync system uses a hardcoded list of 130 set IDs that must be manually updated when new sets release. Pricing has gaps — many cards fall back to rarity-based estimates because the extraction logic only tries `marketPrice` on a few variants. There is no sync reporting, so it's hard to know what's missing.

## Goals

1. Auto-discover all booster expansion sets from TCGdex (no more hardcoded list)
2. Improve pricing completeness by trying more variant/field combinations
3. Record price history on each sync run
4. Print a clear summary report after each sync
5. Deduplicate shared utilities between sync scripts

## Non-Goals

- Automated/scheduled syncs (staying manual)
- Era-adjusted rarity fallback prices (future enhancement)
- Price prediction or trend analysis

---

## Design

### 1. Auto-Discovery of Booster Sets

**Location:** `lib/pokemon-tcg-api.ts` (new `fetchBoosterSetIds()` function)

**Approach:** Series-based enumeration with pattern filtering.

**Step 1:** Call `tcgdex.serie.list()` — returns `SerieResume[]` (only `id`, `name`, `logo`; no sets).

**Step 2:** Filter the resume list against the booster series allowlist:
```
base, gym, neo, ecard, ex, dp, pl, hgss, bw, xy, sm, swsh, sv
```

**Step 3:** For each matching series ID only, call `tcgdex.serie.get(serieId)` — returns full `Serie` object with `sets: SetResume[]` (each has `id`, `name`, `cardCount`).

**Step 4:** From each series' sets, exclude non-booster sets matching these patterns:
- `/p$/` — promo sets (swshp, smp, xyp, etc.)
- `/^pop/` — POP series
- `/^mcd/` — McDonald's promos
- `/^tk/` — Trainer kits
- `/^si$/` — Southern Islands

**Important:** Dot-decimal IDs (e.g., `sm3.5`, `swsh3.5`, `sv03.5`) are valid booster sets and must NOT be filtered out.

**Step 5:** Add standalone booster sets not in standard series. Before adding, verify against the live API that these aren't already discovered under their parent series:
- `g1` (Generations — may be under `xy` series)
- `cel25` (Celebrations — may be under `swsh` series)
- `col1` (Call of Legends — may be under `hgss` series)

If any of these already appear via series enumeration, skip the standalone add to avoid duplicates.

**Step 6:** Apply a small explicit blocklist for edge cases that pass pattern filters but aren't purchasable booster packs.

**In `sync-cards.ts`:**
- Remove the hardcoded `TARGET_SET_IDS` array (lines 22–152)
- Call `fetchBoosterSetIds()` at the start of `main()`
- Compare discovered sets against existing DB packs to identify new additions
- Add `--set <id>` CLI flag for targeted single-set syncs

**Total API overhead:** ~15 calls (one list + one per matching series), well within rate limits.

### 2. Pricing Improvements

**Location:** `scripts/sync-cards.ts` — `extractPricing()` function

**Broader variant fallback chain:**

For TCGPlayer, try each variant in order (holofoil → normal → reverse-holofoil → 1stEditionHolofoil → 1stEditionNormal), and within each variant try:
```
marketPrice → midPrice → lowPrice
```

For Cardmarket, try:
```
avg → trend → avg1 → avg7 → avg30 → low
```

For holo-rarity cards, also try Cardmarket holo-specific fields (accessed via bracket notation due to hyphenated keys):
```
avg-holo → trend-holo → avg1-holo → avg7-holo → avg30-holo → low-holo
```

**Price history recording:**

After upserting each card with a non-null price, also upsert into `card_price_history`. The `extractPricing()` function must return both the price value AND the winning variant name + source.

```typescript
// extractPricing() returns:
{ price: number, source: 'tcgplayer' | 'cardmarket', variant: string }
// e.g. { price: 12.50, source: 'tcgplayer', variant: 'holofoil' }
```

Then insert into history:
```sql
INSERT INTO card_price_history (card_id, price, source, variant, recorded_at)
VALUES ($1, $2, 'tcgplayer', 'holofoil', CURRENT_DATE)
ON CONFLICT (card_id, source, variant, recorded_at) DO UPDATE SET price = $2;
```

The `source` value must be `'tcgplayer'` or `'cardmarket'` (matching the `price_source` type). The `variant` must be the actual TCGPlayer variant key (e.g., `'holofoil'`, `'normal'`, `'reverse-holofoil'`) or `'normal'` as default for Cardmarket-sourced prices.

Requires changing card upsert to use `.select('id').single()` to get the DB UUID back.

**Note:** The existing `card_pricing_details` upsert pass (which stores full variant-level breakdowns) is preserved as-is. The price history addition is supplementary — it tracks the primary market price over time, while `card_pricing_details` stores the full snapshot of all variant prices.

### 3. Sync Reporting

**Location:** `scripts/sync-cards.ts` — new `SyncReport` interface

Accumulate stats throughout the run, print formatted summary at end:

```
=== SYNC SUMMARY ===
Duration: 12m 34s
Sets discovered: 134 (2 new: sv11, sv11.5)
Cards: 18,432 (412 new, 18,020 updated)
Pricing coverage:
  API price:      14,201 (77.1%)
  Estimate:        4,012 (21.8%)
  No price:          219 (1.2%)
Price history:    14,201 entries recorded

Sets needing attention (>50% estimate pricing):
  ecard1 (Expedition Base Set): 103/165 estimate (62.4%)
  ecard2 (Aquapolis): 99/147 estimate (67.3%)

Failed sets: none
```

The "needing attention" section shows sets where more than 50% of cards used rarity-based estimate pricing (denominator is total cards in the set).

### 4. Code Deduplication

**Move to `lib/constants.ts`:**
- `RARITY_ESTIMATE_PRICES` map (currently inline in sync-cards.ts)
- Era-based fallback price function — standardize on the name `getEraFallbackPrice()` (currently called `getPackPriceUsd()` in sync-cards.ts and `getEraFallbackPrice()` in sync-pack-prices.ts)

Both sync scripts import from the shared location. Remove local copies from both scripts.

---

## Files to Modify

| File | Changes |
|------|---------|
| `lib/pokemon-tcg-api.ts` | Add `fetchBoosterSetIds()`, series constants, filtering logic |
| `scripts/sync-cards.ts` | Remove hardcoded sets, use discovery, improve pricing (broader fallbacks + return variant/source), add price history recording, add reporting, add `--set` flag. Rename `getPackPriceUsd()` → import `getEraFallbackPrice()` |
| `lib/constants.ts` | Add `RARITY_ESTIMATE_PRICES`, `getEraFallbackPrice()` |
| `scripts/sync-pack-prices.ts` | Import shared `getEraFallbackPrice()` instead of local copy |

## Verification

1. Run `fetchBoosterSetIds()` standalone and compare output against the current 130 hardcoded IDs — should be a superset (any extras are newly discovered sets)
2. Run full sync: `npx tsx --env-file=.env.local scripts/sync-cards.ts`
3. Check summary report for pricing coverage improvements
4. Verify `card_price_history` table has new entries for today's date with correct `source` and `variant` values
5. Test `--set sv09` flag for single-set sync
6. Test `--set nonexistent` to verify graceful error handling
7. Run `sync-pack-prices.ts` to confirm shared imports work
8. Verify `card_pricing_details` still populates correctly (existing behavior preserved)
