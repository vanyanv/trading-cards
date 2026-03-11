# Floating Rare Cards on Login/Signup Pages

## Context

The login and signup pages are currently minimal — a centered form card on a plain background. The rest of the app has rich visual identity (holographic effects, rarity glows, animated pack openings), but the auth pages feel disconnected from that experience. Adding floating animated rare cards creates an immediate sense of what the app is about and makes a strong first impression.

## Design Decisions

- **Layout:** Scattered float — 6-8 cards drift randomly across the full viewport behind the centered form
- **Intensity:** Bold & immersive — 0.5-0.8 opacity, varied sizes, no blur
- **Effects:** Rarity-colored glow aura on each card (reusing `RARITY_CONFIG.glowColor` from `lib/constants.ts`)
- **Card source:** Random rare cards from TCGdex API, fetched via a new server-side API route with caching
- **Animation:** Framer Motion infinite floating with randomized paths and slow rotation
- **Mobile:** Reduced to 3-4 cards, smaller sizes, slightly lower opacity

## Architecture

### New Files

#### `components/FloatingCards.tsx` (client component)
The main component, rendered as a fixed-position background layer behind the auth form.

**Responsibilities:**
- Fetch card data from `/api/cards/showcase` on mount
- Render 6-8 cards as absolutely-positioned `motion.div` elements
- Each card gets randomized initial position, size, rotation, and animation parameters
- Cards use `Next/Image` with the card's `image_url` from TCGdex CDN (`assets.tcgdex.net`)
- Each card has a `box-shadow` glow using its rarity color from `RARITY_CONFIG`. The config's `glowColor` values are at 0.1 opacity (designed for subtle badge use), so the floating cards should use a boosted glow opacity of ~0.4-0.6 derived from the rarity `color` field instead
- Positioned behind the form via `z-index: 0` (form gets `z-index: 10`)
- Uses `pointer-events: none` so cards don't interfere with form interaction
- On fetch failure: renders nothing (empty fragment) — the auth form works fine without floating cards

**Animation per card (Framer Motion):**
```
animate={{
  x: [startX, startX + drift, startX - drift, startX],
  y: [startY, startY - drift, startY + drift, startY],
  rotate: [startRotate, startRotate + 5, startRotate - 5, startRotate],
}}
transition={{
  duration: random(20, 35),  // slow, ambient
  repeat: Infinity,
  ease: "easeInOut",
}}
```

**Card sizing:**
- Desktop: 80-120px wide (2.5:3.5 aspect ratio)
- Mobile: 60-80px wide
- Each card gets a random size within the range

**Responsive behavior:**
- Desktop (≥768px): 6-8 cards
- Mobile (<768px): 3-4 cards
- Detect via `window.innerWidth` on mount, not CSS media queries (since card count affects JS)

#### `app/api/cards/showcase/route.ts` (API route)
Server-side endpoint that returns a random set of rare cards for the floating display.

**Approach:**
- Use `createClient` from `@/lib/supabase/server` (the standard server-side Supabase client used by all existing API routes)
- Query the local Supabase `cards` table for cards with rarity in `['Rare', 'Double Rare', 'Illustration Rare', 'Ultra Rare', 'Special Illustration Rare', 'Hyper Rare', 'One Star', 'Two Star', 'Three Star', 'Crown', 'One Shiny', 'Two Shiny']` (both classic and TCG Pocket rare+ cards)
- Filter to cards that have a non-null `image_url`
- Select a random sample of 8 cards using `ORDER BY random() LIMIT 8`
- Return `{ cards: [{ id, name, image_url, rarity }] }`
- On DB query failure: return `{ error: 'Failed to fetch cards' }` with 500 status (matching existing API route error handling pattern)
- Set `Cache-Control: public, max-age=300` (5 min cache) so the page doesn't hit the DB on every load
- No authentication required (public endpoint)

### Modified Files

#### `app/(auth)/login/page.tsx`
- Import and render `<FloatingCards />` as a sibling before the form container
- Add `relative z-10` to the form wrapper div so it sits above the cards
- Change existing `bg-surface` on the form card div to `bg-surface/90 backdrop-blur-sm` for a frosted glass effect against the cards

#### `app/(auth)/signup/page.tsx`
- Same changes as login page

### Existing Code Reuse

- **`RARITY_CONFIG`** from `lib/constants.ts` — provides `glowColor` per rarity for the card glow aura
- **`Rarity` enum** from `types/index.ts` — used to look up rarity config
- **TCGdex CDN** (`assets.tcgdex.net`) — already configured as an allowed image domain in `next.config.ts`
- **`cn()` utility** from `lib/cn.ts` — for class merging
- **`createClient()`** from `lib/supabase/server.ts` — the standard server-side Supabase client used by all existing API routes

## Data Flow

1. User navigates to `/login` or `/signup`
2. Page renders with the centered form and `<FloatingCards />` component
3. `FloatingCards` mounts, calls `fetch('/api/cards/showcase')`
4. API route queries Supabase for 8 random rare cards with images
5. Response is cached for 5 minutes via HTTP cache headers
6. `FloatingCards` renders the cards with randomized positions and starts Framer Motion animations
7. Cards float continuously; form remains interactive above them

## Mobile Considerations

- Fewer cards (3-4) to reduce visual clutter and improve performance
- Smaller card sizes (60-80px wide)
- Cards positioned to avoid overlapping the form area on narrow screens
- Reduced glow intensity (`box-shadow` spread reduced)
- Respect `prefers-reduced-motion` media query — disable floating animation and show static scattered cards instead (required, not optional)

## Performance

- Cards are lazy-loaded images (Next/Image with `loading="lazy"`)
- Framer Motion animations use `transform` only (GPU-composited, no layout thrashing)
- API response cached for 5 minutes
- No JavaScript runs until the component hydrates (SSR renders empty, cards appear client-side)
- `will-change: transform` on card elements for GPU layer promotion

## Verification

1. Navigate to `/login` — should see 6-8 floating rare cards with rarity glows behind the form
2. Navigate to `/signup` — same floating cards, different random selection on each page load
3. Form should remain fully functional (email/password/submit)
4. Cards should not be clickable or interfere with form focus
5. Resize to mobile width — should see fewer, smaller cards
6. Check `prefers-reduced-motion` — animation should be disabled
7. Network tab: `/api/cards/showcase` should return 8 cards and be cached
8. No layout shift — cards render after hydration without affecting form position
