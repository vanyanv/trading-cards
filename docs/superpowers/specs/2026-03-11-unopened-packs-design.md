# Unopened Packs & Balance Display Improvements

## Problem

Currently, opening a pack is a single atomic action — clicking "Open Pack" immediately deducts the balance, generates cards, inserts them into `user_cards`, and starts the animation. If a user navigates away during the animation, the cards are already in their collection but they never saw the reveal. There's no way to "save" a pack for later.

Additionally, the balance display in the navbar is hard to read — small text, purple tint, and no comma formatting for larger numbers. The balance also doesn't appear until a page refresh after login.

## Goals

1. Allow users to save packs and open them later
2. Keep generated card data server-side until the user actually watches the reveal
3. Show unopened pack count in navbar + collection page
4. Improve balance display readability
5. Fix balance not showing after login

## Design

### Database: Split Table Approach

To prevent `cards_data` from being accessible via client-side Supabase queries (RLS cannot restrict individual columns), we use two tables:

**Table 1: `unopened_packs`** (metadata only, client-accessible via RLS)
```sql
CREATE TABLE unopened_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pack_id UUID NOT NULL REFERENCES packs(id),
  purchased_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_unopened_packs_user ON unopened_packs(user_id);
ALTER TABLE unopened_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own unopened packs"
  ON unopened_packs FOR SELECT
  USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policies — all mutations via admin/service-role client only
```

**Table 2: `unopened_pack_cards`** (card data, NO client access at all)
```sql
CREATE TABLE unopened_pack_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unopened_pack_id UUID NOT NULL REFERENCES unopened_packs(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id),
  is_reverse_holo BOOLEAN DEFAULT false,
  edition TEXT,
  slot_number INTEGER NOT NULL
);

CREATE INDEX idx_unopened_pack_cards_pack ON unopened_pack_cards(unopened_pack_id);
ALTER TABLE unopened_pack_cards ENABLE ROW LEVEL SECURITY;
-- NO policies — only service-role/admin client can access this table
```

This provides defense-in-depth: even if a developer accidentally queries `unopened_packs` from the client, there's no `cards_data` column to leak. The card data lives in a completely separate table with zero client-facing RLS policies.

### Modified Flow

#### Current Flow
```
Click "Open Pack" → Deduct balance → Generate cards → Insert user_cards → Animation → Done
```

#### New Flow
```
Click "Open Pack" → Deduct balance → Generate cards → Insert unopened_packs + unopened_pack_cards → Animation page
  ├── User stays → Call /api/packs/reveal → Get cards → Animation → Move to user_cards → Done
  └── User leaves → Pack stays in unopened_packs → Navbar badge shows count
                     └── User returns → Collection page "Unopened Packs" → Click "Open" → Animation → Done
```

### API Changes

#### Modified: `POST /api/packs/open` (`app/api/packs/open/route.ts`)

Changes:
- Instead of inserting into `user_cards`, insert into `unopened_packs` (metadata) + `unopened_pack_cards` (card data) using admin client
- If the insert fails, refund the balance (same pattern as current refund logic)
- Return `{ unopenedPackId, newBalance, packCost }` — **no card data**
- Keep all existing logic: auth, balance check, deduction, card generation
- **Timing decision**: `pull_stats` and `open_count` fire at purchase time (card generation has already happened, stats should reflect actual pulls regardless of reveal status)

#### New: `POST /api/packs/reveal` (`app/api/packs/reveal/route.ts`)

- Input: `{ unopenedPackId: string }`
- Auth: verify user is authenticated
- **Atomic claim pattern** to prevent double-reveal race condition:
  ```sql
  DELETE FROM unopened_packs WHERE id = $unopenedPackId AND user_id = $userId RETURNING *
  ```
  If this returns no rows → pack was already claimed (return 404)
- Read cards from `unopened_pack_cards` where `unopened_pack_id = $unopenedPackId` (admin client)
- Join with `cards` table to get full card details (name, image, rarity, price, etc.)
- Insert all cards into `user_cards` with `pack_opened_from` derived from `unopened_packs.pack_id`
- `CASCADE` delete on `unopened_pack_cards` handles cleanup automatically when the parent row is deleted
- Return `{ cards: PulledCard[] }` with full card data for the animation
- If `user_cards` insert fails: re-insert the `unopened_packs` row and cards (rollback), return 500

#### New: `GET /api/packs/unopened` (`app/api/packs/unopened/route.ts`)

- Auth required
- Query using user's Supabase client (RLS-protected):
  ```sql
  SELECT up.id, up.pack_id, up.purchased_at, p.name, p.image_url, p.cards_per_pack, p.edition, p.set_name
  FROM unopened_packs up
  JOIN packs p ON up.pack_id = p.id
  WHERE up.user_id = auth.uid()
  ORDER BY up.purchased_at DESC
  ```
- No card data is accessible — `unopened_pack_cards` has no RLS policies for the user
- Used by navbar component and collection page

### UI Changes

#### Navbar (`components/Navbar.tsx`)

1. **Unopened packs badge** — new element between nav links and balance:
   - Gold/yellow themed pill: `📦 3`
   - Only renders when count > 0
   - Clicking navigates to `/collection` (scrolls to unopened section)
   - Listens for custom `unopened-packs-update` event for real-time count updates
   - Fetches count from `/api/packs/unopened` on mount and on `SIGNED_IN` auth event

2. **Improved balance display**:
   - Green-tinted background (`rgba(34,197,94,0.12)`) with green border
   - Larger, higher-contrast text in green (`#4ade80`)
   - Clear `$X,XXX.XX` format with comma separators via `toLocaleString()`
   - Remove the DollarSign icon — just show the formatted amount

3. **Fix balance not showing after login**:
   - In the `onAuthStateChange` listener, when event is `SIGNED_IN`, immediately fetch balance and unopened packs count
   - This ensures both appear as soon as login completes without requiring a page refresh

#### Collection Page (`app/collection/page.tsx` + `components/CollectionGrid.tsx`)

1. **Unopened Packs section** — rendered at top of collection page, above the card grid:
   - Gold/purple gradient border container
   - Header: "Unopened Packs" with count badge
   - Horizontal scrollable row of pack cards
   - Each pack card shows: pack image, pack name, edition (if applicable), cards count, "Open" button
   - "Open" button navigates to `/pack-opening/[packId]?unopenedId=[id]`
   - Section hidden when user has 0 unopened packs

#### Pack Opening Page (`app/pack-opening/[packId]/page.tsx`)

1. Check for `unopenedId` query param
2. If present (opening saved pack): call `POST /api/packs/reveal` with `unopenedPackId` to get card data
3. If not present (fresh purchase): call `POST /api/packs/open` (returns `unopenedPackId`), then immediately call `/api/packs/reveal`
4. On successful reveal: dispatch `unopened-packs-update` event to update navbar badge
5. **Validate pack match**: The reveal endpoint returns the `pack_id` — if it doesn't match the URL's `packId`, derive pack metadata from the reveal response rather than the URL
6. **Error/retry**: If reveal fails (network error), show a retry button. The pack remains in `unopened_packs` so clicking retry or returning from collection works.

#### Pack Opening Animation (`components/PackOpeningAnimation.tsx`)

- No major changes needed — it already receives `PulledCard[]` as props
- **"Open Another" handler**: Update `onOpenAnother` callback to perform the two-step flow: call `/api/packs/open` then `/api/packs/reveal`

### Custom Events

New event: `unopened-packs-update`
```typescript
window.dispatchEvent(new CustomEvent('unopened-packs-update', {
  detail: { count: newCount }
}));
```
Dispatched when:
- A pack is purchased (count +1)
- A pack is revealed (count -1)

Listened by:
- Navbar component (updates badge count)

### Balance Formatting

Add comma-separated number formatting to the navbar balance display:
```typescript
const formatBalance = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// $1234.56 → "1,234.56" displayed as "$1,234.56"
```

### TypeScript Types

Add to `types/index.ts`:
```typescript
export interface UnopenedPack {
  id: string;
  pack_id: string;
  purchased_at: string;
  // Joined from packs table
  pack?: {
    name: string;
    image_url: string;
    cards_per_pack: number;
    edition?: Edition;
    set_name?: string;
  };
}
```

### Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/NEW.sql` | Create `unopened_packs` + `unopened_pack_cards` tables with RLS |
| `app/api/packs/open/route.ts` | Insert into `unopened_packs` + `unopened_pack_cards` instead of `user_cards` |
| `app/api/packs/reveal/route.ts` | **New** — atomic claim + move cards to `user_cards` |
| `app/api/packs/unopened/route.ts` | **New** — fetch user's unopened packs metadata |
| `app/pack-opening/[packId]/page.tsx` | Support `unopenedId` param, two-step open+reveal flow |
| `components/PackOpeningAnimation.tsx` | Update `onOpenAnother` for two-step flow |
| `components/Navbar.tsx` | Add pack badge, improve balance display, fix login balance fetch |
| `app/collection/page.tsx` | Fetch and pass unopened packs |
| `components/CollectionGrid.tsx` | Add unopened packs section at top |
| `types/index.ts` | Add `UnopenedPack` type |

### Verification

1. **Buy a pack** → Verify balance deducted, row in `unopened_packs` + `unopened_pack_cards`, no cards in `user_cards`
2. **Navigate away from animation** → Verify pack shows in navbar badge and collection section
3. **Open from collection** → Verify animation plays, cards move to `user_cards`, rows removed from both `unopened_*` tables
4. **Stay through animation** → Verify same end result (cards in `user_cards`, unopened rows cleaned up)
5. **Double-reveal protection** → Open same pack in two tabs simultaneously, verify only one succeeds
6. **Client security** → Verify direct Supabase query `from('unopened_pack_cards').select('*')` returns empty (no RLS policy)
7. **Balance display** → Verify comma formatting works for amounts like $1,234.56
8. **Balance after login** → Verify balance and pack badge appear immediately after sign-in without page refresh
9. **Badge count** → Verify navbar badge updates in real-time on buy/reveal
10. **Open Another** → Verify "Open Another" button works with the two-step flow
11. **Failed insert refund** → Verify balance is refunded if `unopened_packs` insert fails
