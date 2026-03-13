# Auto-Buyback for Non-Rare Cards + Landing Page Updates

## Context

Users opening packs accumulate large numbers of Common and Uncommon cards they don't care about. These low-value cards clutter their collection and make it harder to find the rare hits they're actually hunting. This feature automatically sells non-rare, low-value cards during pack opening so users only keep cards worth keeping — while earning credit back automatically.

Additionally, the landing page hero section needs updated copy to align with the platform's evolving vision: real physical cards with sell/vault/ship options (vault and ship are future placeholders).

## Design Decisions

- **Rarity cutoff:** Common and Uncommon (TCG), OneDiamond and TwoDiamond (TCG Pocket) are auto-sold
- **Value override:** Cards priced at $5+ are always kept regardless of rarity
- **Sell rate:** Same 60% rate as manual selling (`SELL_RATE = 0.6`)
- **Default state:** On by default for all users, toggleable off in settings
- **Timing:** After pack opening animation completes — users see every card, then auto-sell happens during the reveal API call
- **Notification:** Lightweight toast at the bottom: "Auto-sold 7 cards for +$0.85", auto-dismiss after ~4s
- **Approach:** Integrated into existing `/api/packs/reveal` endpoint (Approach A) — single transaction, no new API endpoints for the core logic

## Database Changes

### Migration: `supabase/migrations/20260312200000_add_auto_buyback.sql`

```sql
ALTER TABLE user_profiles
  ADD COLUMN auto_buyback_enabled BOOLEAN NOT NULL DEFAULT true;
```

No new tables required.

## Backend Changes

### New: `lib/auto-buyback.ts`

Shared constants and helper:

```ts
import { Rarity } from '@/types';
import { SELL_RATE, RARITY_ESTIMATE_PRICES } from '@/lib/constants';

export const AUTO_BUYBACK_VALUE_THRESHOLD = 5.0;

export const AUTO_BUYBACK_RARITIES: Rarity[] = [
  Rarity.Common,
  Rarity.Uncommon,
  Rarity.OneDiamond,
  Rarity.TwoDiamond,
];

export function shouldAutoSell(rarity: Rarity, price: number): boolean {
  if (price >= AUTO_BUYBACK_VALUE_THRESHOLD) return false;
  return AUTO_BUYBACK_RARITIES.includes(rarity);
}

export function getCardPrice(card: { price?: number | null; rarity?: string }): number {
  return card.price ?? RARITY_ESTIMATE_PRICES[card.rarity ?? ''] ?? 0;
}

export function getAutoSellValue(price: number): number {
  return parseFloat((price * SELL_RATE).toFixed(2));
}
```

### Modified: `lib/constants.ts` — Extend `RARITY_ESTIMATE_PRICES`

Add TCG Pocket rarity fallback prices so auto-buyback value calculations don't produce `NaN`:

```ts
[Rarity.OneDiamond]: 0.10,
[Rarity.TwoDiamond]: 0.25,
[Rarity.ThreeDiamond]: 1.50,
[Rarity.FourDiamond]: 5.0,
[Rarity.OneStar]: 8.0,
[Rarity.TwoStar]: 15.0,
[Rarity.ThreeStar]: 30.0,
[Rarity.Crown]: 60.0,
[Rarity.OneShiny]: 5.0,
[Rarity.TwoShiny]: 15.0,
```

### Modified: `app/api/packs/reveal/route.ts`

The reveal endpoint currently joins card data via `.select('card_id, is_reverse_holo, edition, slot_number, card:cards(*)')`. The card's `rarity` and `price` are accessed via `pc.card.rarity` and `pc.card.price` (nested under the joined `card` object).

**Execution order** (critical for rollback safety):

1. Read card data (existing Step 2) — already joins `cards(*)` which includes `rarity` and `price`
2. Fetch `user_profiles.auto_buyback_enabled` for the authenticated user
3. If enabled, partition `packCards` using `shouldAutoSell(pc.card.rarity, getCardPrice(pc.card))`:
   - **keptCards** — rarity is Rare+ or price >= $5
   - **autoSoldCards** — Common/Uncommon (or OneDiamond/TwoDiamond) with price < $5
4. **Credit balance first** — calculate total sell value from autoSoldCards, update `user_balances` (same pattern as `app/api/cards/sell/route.ts`). If this fails, abort and return error (no cards lost since they're still in `unopened_pack_cards`)
5. Delete unopened pack (existing Step 3 — atomic claim)
6. Insert **keptCards only** into `user_cards` (existing Step 4, but filtered)
7. If insert fails, rollback: re-insert unopened pack + cards AND reverse the balance credit
8. Return response with existing `cards` array plus new `autoSold: { count: number, totalEarned: number }` field

When auto-buyback is disabled, the flow is identical to today — all cards go to `user_cards`, no `autoSold` in response.

### New: `app/api/user/preferences/route.ts`

**GET handler:** Returns `{ auto_buyback_enabled: boolean }` for the authenticated user by querying `user_profiles` where `user_id = auth.uid()`.

**PATCH handler:** Accepts `{ auto_buyback_enabled: boolean }`, updates `user_profiles` for the authenticated user. Must use `supabase.auth.getUser()` to get the user ID — never accept a user ID from the request body. Uses the admin client for the update but scoped to the authenticated user's ID.

### Existing: `app/api/cards/sell/route.ts`

No changes — manual selling continues to work independently.

## Frontend Changes

### Pack Opening Flow

**File:** `app/pack-opening/[packId]/page.tsx`

The current `revealPack` function (line 43) fires-and-forgets the reveal call. Changes needed:

1. `revealPack` must `return await res.json()` to surface the response data
2. `handleAnimationComplete` (line 147) must `await revealPack(id)` and check for `autoSold` in the result
3. If `autoSold` is present, show a toast: "Auto-sold {count} cards for +${totalEarned}"
4. Dispatch a `balance-update` custom event with the new balance so the navbar updates
5. **Unmount case** (line 64): When the component unmounts and auto-reveal fires, there's no way to show a toast since the page is gone. This is acceptable — the balance still gets credited server-side, user just won't see the toast. No change needed for the unmount path.

**Toast implementation:** Use a lightweight toast component (or add one if none exists). Green accent, fixed bottom position, auto-dismiss ~4 seconds.

### Settings Toggle

Add an auto-buyback toggle in the user's profile/settings area:
- On/off switch labeled "Auto-Buyback"
- Description: "Automatically sell Common and Uncommon cards worth less than $5 when opening packs"
- On page load, fetch GET `/api/user/preferences` to set initial toggle state
- On toggle, call PATCH `/api/user/preferences` to persist

### Landing Page Updates

**File:** `components/HomeContent.tsx`
- Update hero subtitle to reference the real-card vision, e.g.: "Open packs that represent real, physical cards. Keep the hits, auto-sell the rest."

**File:** `components/ValuePropStorytelling.tsx`
- Already has "Early Access / The Future of Collecting Starts Now" messaging with Sell/Vault/Ship — no structural changes needed
- Add a subtle auto-buyback mention under the Sell card or as a fourth trust badge: "Commons auto-sold for instant credit"

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/20260312200000_add_auto_buyback.sql` | New migration — add `auto_buyback_enabled` column |
| `lib/auto-buyback.ts` | New file — shared constants, `shouldAutoSell()`, `getCardPrice()` helpers |
| `lib/constants.ts` | Add TCG Pocket entries to `RARITY_ESTIMATE_PRICES` |
| `app/api/packs/reveal/route.ts` | Partition cards, credit balance first, auto-sell qualifying ones, return `autoSold` summary |
| `app/api/user/preferences/route.ts` | New endpoint — GET + PATCH for auto-buyback preference |
| `app/pack-opening/[packId]/page.tsx` | Return reveal response, show toast on `autoSold`, dispatch balance-update event |
| `components/HomeContent.tsx` | Update hero subtitle copy |
| `components/ValuePropStorytelling.tsx` | Add auto-buyback mention to Sell card or trust badges |

## Verification

1. **Database:** Run migration, verify `auto_buyback_enabled` column exists on `user_profiles` with default `true`
2. **Pack opening with auto-buyback ON:**
   - Open a pack containing Common/Uncommon cards
   - Verify kept cards (Rare+, or $5+ value) appear in `user_cards`
   - Verify Common/Uncommon cards < $5 do NOT appear in `user_cards`
   - Verify `user_balances` increased by the correct sell amount
   - Verify toast appears with correct count and amount
   - Verify navbar balance updates after reveal
3. **Pack opening with auto-buyback OFF:**
   - Toggle off in settings
   - Open a pack — all cards should enter collection as before, no toast
4. **Value override:** Ensure a Common card priced at $5+ is kept, not auto-sold
5. **TCG Pocket packs:** Verify OneDiamond/TwoDiamond cards are auto-sold correctly with fallback pricing
6. **Settings toggle:** Verify GET returns current state on page load, PATCH persists changes
7. **Unmount reveal:** Navigate away during animation — verify cards still get revealed and balance credited (no toast expected)
8. **Landing page:** Verify updated hero copy and auto-buyback mention render correctly
9. **Manual sell:** Verify existing manual sell flow still works independently
10. **Rollback:** Simulate a `user_cards` insert failure — verify balance credit is reversed and unopened pack is restored
