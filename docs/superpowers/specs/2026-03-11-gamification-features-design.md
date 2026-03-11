# Gamification & Collection Features Design

## Problem

The trading cards app has strong collection and pack-opening mechanics but lacks goals, social features, and progression tracking. Users can't see how complete their collection is per set, compare with other collectors, or view other users' profiles and stats.

## Solution

Add five interconnected features that create collection goals, social competition, and user visibility:

1. **Pokédex** — Per-set collection completion tracker
2. **Leaderboard** — Global ranking by collection value
3. **Public User Profiles** — Stats, rarity breakdown, top cards, recent pulls
4. **Enhanced Collection Stats** — More stats on the existing collection page
5. **Community Page** — New nav item housing leaderboard + activity feed

## Architecture

All stats derived from existing tables (`user_cards`, `cards`, `user_profiles`) via SQL RPC functions with `SECURITY DEFINER`. No new tracking tables. Simple, always-accurate, easy to maintain.

**RLS strategy:** All cross-user data access goes through `SECURITY DEFINER` RPC functions, avoiding the need to add broad public SELECT policies on `user_cards`. This keeps the existing RLS intact while enabling leaderboard and public profile queries.

**Performance note:** Leaderboard query aggregates across all users. At current scale this is fine. If it becomes slow, add `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` headers on the leaderboard API route as a first step, and consider a materialized view later.

---

## Feature 1: Pokédex

**Route:** `/pokedex` (auth required)

Shows all sets the user has collected from, each with a progress bar (e.g., "45/102 — 44%"). Sets are expandable to show every card:
- **Owned cards:** Full art with rarity badge
- **Unowned cards:** Greyed-out silhouette (grayscale + reduced opacity)
- **Completion:** Tracks unique card ownership per set (at least one copy of a card = collected, regardless of edition)
- **Empty state:** "Start opening packs to fill your Pokédex!" with link to browse packs

**Data:** `get_user_set_completion(user_id)` RPC returns `(set_id, set_name, owned_count, total_count)`. Expansion fetches all cards in set with `owned` boolean via `get_set_cards_with_ownership(user_id, set_id)` RPC.

---

## Feature 2: Leaderboard

**Location:** Tab on `/community` page

Ranked by total collection value (USD). Display:
- **Top 3:** Gold/silver/bronze highlighting (warm amber theme)
- **Table columns:** Rank, avatar + display name, collection value, unique cards, rarest card
- **Current user:** Row always highlighted/pinned
- **Interaction:** Click row → `/profile/[userId]`
- **Empty state:** "No collectors yet — be the first!"

**Data:** `get_leaderboard(limit)` SECURITY DEFINER RPC aggregating `user_cards JOIN cards JOIN user_profiles`. Limited to top 50 by default.

---

## Feature 3: Public User Profile

**Route:** `/profile/[userId]` (public, no auth required)

Sections:
1. **Header:** Avatar (large), display name, member since date (from `auth.users.created_at` via RPC, not `user_profiles.created_at`)
2. **Stats row:** Total value, unique cards, packs opened (approximate: COUNT DISTINCT `obtained_at` truncated to minute + `pack_opened_from` combos), sets started — 4-card grid matching CollectionValueHeader style
3. **Rarity distribution:** Horizontal stacked bar chart using RARITY_CONFIG colors
4. **Set completion:** Mini progress bars for each set
5. **Top 5 cards:** Most valuable cards in a horizontal scroll
6. **Recent pulls:** Last 10 rare+ cards in a grid with rarity badges
7. **Empty state:** "This trainer hasn't started collecting yet" for users with no cards

Own profile shows "Edit Profile" link to `/settings`.

**Data:** All via SECURITY DEFINER RPCs:
- `get_user_profile_stats(user_id)` — value, unique cards, packs opened, sets started, member since
- `get_user_set_completion(user_id)` — set progress
- `get_user_rarity_breakdown(user_id)` — rarity counts
- `get_user_rarest_card(user_id)` — most valuable card
- `get_user_recent_pulls(user_id, limit)` — last N rare+ pulls
- `get_user_top_cards(user_id, limit)` — most valuable owned cards

---

## Feature 4: Enhanced Collection Stats

**Location:** Existing `CollectionValueHeader` on `/collection`

Add to existing stats:
- **Packs opened** count (approximate, same method as profile)
- **Sets in progress** count (links to Pokédex)
- **Rarity distribution bar** (visual stacked bar below rarity pills)
- **Best pull** — highest value card with date obtained
- **Loading skeletons** for new stat cards (follow existing pattern)

Computed client-side from existing `userCards` prop data.

---

## Feature 5: Community Page

**Route:** `/community` (public)

Two tabs:
1. **Leaderboard** — as described above
2. **Recent Activity** — extended community pull feed with pagination via `get_community_recent_pulls(limit, offset)` RPC

**Navigation:** "Community" link added to navbar between Browse and Collection, visible to all users (both logged-in and anonymous). Nav order for logged-out users: Browse, Community. For logged-in: Browse, Community, Collection.

---

## Navigation Changes

- **Navbar:** Add "Community" between Browse and Collection (public, always visible)
- **UserMenu dropdown:** Add "My Profile" between "My Collection" and "Settings"
- **Middleware:** Add `/pokedex` to protected paths
- **Collection page:** Add "View Pokédex" link

---

## Database Changes

Single migration creating:

**RPC Functions (all SECURITY DEFINER):**
1. `get_leaderboard(p_limit INT)` — returns leaderboard entries with rank
2. `get_user_profile_stats(p_user_id UUID)` — returns user stats JSON (uses `auth.users.created_at` for member_since)
3. `get_user_set_completion(p_user_id UUID)` — returns set progress table
4. `get_user_rarity_breakdown(p_user_id UUID)` — returns rarity counts
5. `get_user_rarest_card(p_user_id UUID)` — returns most valuable card JSON
6. `get_user_recent_pulls(p_user_id UUID, p_limit INT)` — returns recent rare+ pulls
7. `get_user_top_cards(p_user_id UUID, p_limit INT)` — returns most valuable cards
8. `get_set_cards_with_ownership(p_user_id UUID, p_set_id TEXT)` — returns all cards in set with owned flag
9. `get_community_recent_pulls(p_limit INT, p_offset INT)` — paginated community feed

No new tables. No new RLS policies needed (SECURITY DEFINER bypasses RLS).

---

## Type Definitions

```typescript
interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_id: string | null;
  member_since: string;
  unique_cards: number;
  total_cards: number;
  collection_value: number;
  rarest_card: { name: string; rarity: string; image_url: string } | null;
  rank: number;
}

interface SetCompletion {
  set_id: string;
  set_name: string;
  owned_count: number;
  total_count: number;
}

interface UserProfileStats {
  total_value: number;
  unique_cards: number;
  total_cards: number;
  packs_opened: number;
  sets_started: number;
  member_since: string;
}

interface CommunityPull {
  user_id: string;
  display_name: string | null;
  avatar_id: string | null;
  card_name: string;
  card_image_url: string;
  card_rarity: string;
  set_name: string;
  obtained_at: string;
}
```

---

## New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260316000000_gamification_views.sql` | SQL RPCs |
| `app/api/leaderboard/route.ts` | Leaderboard data API |
| `app/api/user-stats/[userId]/route.ts` | Profile stats API |
| `app/api/pokedex/route.ts` | Set completion + card list API (uses session user) |
| `app/api/community-feed/route.ts` | Paginated community pulls API |
| `app/community/page.tsx` | Community page (server) |
| `app/profile/[userId]/page.tsx` | Public profile page (server) |
| `app/pokedex/page.tsx` | Pokédex page (server) |
| `components/CommunityContent.tsx` | Community tabs (client) |
| `components/Leaderboard.tsx` | Leaderboard table |
| `components/RecentActivity.tsx` | Activity feed |
| `components/PublicProfile.tsx` | Profile display |
| `components/PokedexContent.tsx` | Pokédex set grid + expansion |
| `components/RarityDistributionBar.tsx` | Stacked rarity bar |
| `components/SetProgressBar.tsx` | Set completion progress bar |

## Modified Files

| File | Change |
|------|--------|
| `types/index.ts` | Add LeaderboardEntry, SetCompletion, UserProfileStats, CommunityPull |
| `components/Navbar.tsx` | Add Community nav link |
| `components/UserMenu.tsx` | Add My Profile dropdown item |
| `middleware.ts` | Add /pokedex to protected paths |
| `components/CollectionValueHeader.tsx` | Extend stats, add rarity bar |
| `components/CollectionGrid.tsx` | Compute new stat fields |
| `app/collection/page.tsx` | Add Pokédex link |
