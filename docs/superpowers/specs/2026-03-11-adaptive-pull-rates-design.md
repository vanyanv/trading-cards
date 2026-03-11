# Adaptive Pull Rates with Bayesian Self-Tuning

## Context

Pull rates are currently hardcoded as a single set of Scarlet & Violet community-estimated rates in `lib/constants.ts`, applied identically to every set regardless of era. This is inaccurate — different eras had different pack structures and rarity tiers. Additionally, there's no mechanism to track actual pull outcomes or refine rates based on observed data.

This design introduces era-aware pull rate priors and a Dirichlet-Multinomial Bayesian engine that starts from community-verified rates and converges toward observed pull data as sample size grows, per-set.

## Design

### 1. Database: `pull_stats` Table

New table tracking aggregate pull counts per set, per rarity, per slot type.

```sql
CREATE TABLE pull_stats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id      text NOT NULL,
  rarity      card_rarity NOT NULL,
  slot_type   text NOT NULL CHECK (slot_type IN ('hit_slot', 'reverse_holo', 'tcgp_hit_slot')),
  pull_count  bigint NOT NULL DEFAULT 0,
  total_opens bigint NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(set_id, rarity, slot_type)
);

CREATE INDEX idx_pull_stats_set_slot ON pull_stats(set_id, slot_type);
```

**RPC function** `record_pull_stats(p_set_id, p_rarity, p_slot_type)`: Upserts — increments `pull_count` for the rarity row and `total_opens` for all rows of that set+slot_type. Uses `ON CONFLICT ... DO UPDATE` for atomicity.

### 2. Era-Based Pull Rate Priors

New config in `lib/constants.ts` mapping set ID prefixes to verified prior rates.

**Verified eras with distinct rates:**
- **Scarlet & Violet** (`sv`): Current `HIT_SLOT_RATES` — Rare 71.5%, Double Rare 14.3%, Illustration Rare 7.5%, Ultra Rare 6.7%, Special Art 3.0%, Hyper Rare 1.85%
- **Sword & Shield** (`swsh`): Rare 70%, V 15%, VMAX 5%, Full Art V 4.5%, Alt Art 3%, Secret/Gold 2.5%
- **Sun & Moon** (`sm`): Rare 70%, Holo Rare 15%, GX 7%, Full Art GX 4%, Rainbow Rare 2.5%, Secret 1.5%
- **TCG Pocket**: Current `TCGP_HIT_SLOT_RATES` (datamined, reliable)
- **Fallback** (all other eras: XY, BW, HGSS, DP, Platinum, EX, e-Card, Neo, WotC): Use SV rates as default prior

Structure:
```ts
type EraConfig = {
  prefixes: string[]
  hitSlotRates: { rarity: Rarity; weight: number }[]
}

const ERA_PULL_RATES: EraConfig[] = [...]
```

Lookup function `getPriorRatesForSet(setId: string)` matches set ID against prefixes, returns the first match or fallback.

### 3. Dirichlet-Multinomial Bayesian Engine

New file: `lib/pull-rate-engine.ts`

**Core algorithm:**
```
posterior_rate(rarity) = (prior_count + observed_count) / (prior_strength + total_opens)

where:
  prior_count = (community_rate / 100) * PRIOR_STRENGTH
  PRIOR_STRENGTH = 500 (configurable)
```

**Convergence behavior:**
- 0 opens: 100% community rates
- 500 opens: 50% community, 50% observed
- 2000 opens: ~80% observed
- 5000 opens: ~91% observed

**API:**
```ts
async function getEffectiveRates(
  supabase: SupabaseClient,
  setId: string,
  slotType: 'hit_slot' | 'reverse_holo' | 'tcgp_hit_slot'
): Promise<{ rarity: Rarity; weight: number }[]>
```

**Caching:** In-memory cache with 5-minute TTL, keyed by `${setId}:${slotType}`. Avoids querying `pull_stats` on every pack open.

### 4. Integration Changes

**Files modified:**

- **`lib/rarity.ts`**: Change `rollHitSlotRarity()` and `rollTCGPHitSlotRarity()` to accept rates as a parameter:
  ```ts
  function rollHitSlotRarity(rates: { rarity: Rarity; weight: number }[]): Rarity
  ```

- **`lib/pack-opening.ts`**: Accept rates parameter, pass to roll functions:
  ```ts
  async function openPack(supabase, setId, boosterId, cardsPerPack, edition, hitSlotRates?)
  ```

- **`app/api/packs/open/route.ts`**: Before opening, call `getEffectiveRates()` to get Bayesian-adjusted rates. After opening, fire-and-forget call to `record_pull_stats()` for the hit slot result.

- **`lib/constants.ts`**: Add `ERA_PULL_RATES` config, keep existing `HIT_SLOT_RATES` and `TCGP_HIT_SLOT_RATES` as the SV/TCGP priors.

**New files:**
- `lib/pull-rate-engine.ts` — Bayesian engine + caching
- `supabase/migrations/XXXXXX_add_pull_stats.sql` — Migration

### 5. Data Flow

```
Pack Open Request
  → getEffectiveRates(setId, slotType)
    → Check cache (5min TTL)
    → If miss: fetch pull_stats from DB
    → getPriorRatesForSet(setId) → era-matched priors
    → Compute posterior via Dirichlet-Multinomial
    → Cache result
  → openPack(..., effectiveRates)
    → rollHitSlotRarity(effectiveRates)
  → Record pull result → fire-and-forget record_pull_stats RPC
  → Return cards to user
```

## Verification

1. **Migration**: Run migration, verify `pull_stats` table exists with correct schema
2. **Unit test the Bayesian math**: With 0 observed data, output should equal priors. With large observed data skewed to one rarity, output should converge toward observed.
3. **Open packs across different eras**: Verify SV sets use SV priors, SwSh sets use SwSh priors, old sets fall back to SV
4. **Check pull_stats accumulation**: After opening packs, verify rows are being upserted correctly
5. **Cache behavior**: Open multiple packs quickly, verify DB isn't hit on every request
