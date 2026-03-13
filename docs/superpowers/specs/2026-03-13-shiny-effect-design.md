# Shiny Pokemon Visual Effect — Design Spec

**Date:** 2026-03-13
**Status:** Draft

## Problem

Cards with `OneShiny` and `TwoShiny` rarities have no distinct visual treatment beyond their rarity badge color. They should stand out with a holographic rainbow overlay and sparkle particle effect everywhere they appear, making them feel special and collectible.

## Solution

Create a reusable `<ShinyEffect>` wrapper component that adds a holographic overlay and sparkle particles to any card element. The effect intensity scales with rarity tier (OneShiny = subtle, TwoShiny = dramatic).

## Component: `ShinyEffect`

### File: `components/ShinyEffect.tsx`

**Props:**
- `rarity: Rarity` — determines whether effect is active and at what intensity
- `children: ReactNode` — the card content to wrap
- `className?: string` — optional additional classes on the wrapper
- `disableMouseTracking?: boolean` — when true, always uses CSS auto-sweep (for contexts like HeroCardStack where a parent already handles mouse events)
- `holoAngle?: number | string` — optional externally-provided holo angle in degrees. Accepts `number` (e.g. `145.3`) or CSS string (e.g. `"145.3deg"`). Component normalizes internally via `typeof holoAngle === 'string' ? parseFloat(holoAngle) : holoAngle`. Used in contexts where a parent already computes the angle.
- `seed?: string` — stable string for deterministic sparkle positioning (defaults to a random seed on mount)

**Behavior:**
- Renders a `position: relative` div wrapping `children`
- Only adds overlay layers when `rarity` is `OneShiny` or `TwoShiny`
- For non-shiny rarities, renders children directly with no wrapper div (zero overhead)

### Layer 1: Holographic Rainbow Overlay

A `pointer-events-none absolute inset-0` div with class `shiny-holo-overlay`.

**Gradient:** A new CSS class `.shiny-holo-overlay` in `globals.css` using a **conic-gradient** (distinct from the existing `.holo-overlay` which uses linear-gradient):
```css
.shiny-holo-overlay {
  background: conic-gradient(from var(--holo-angle, 0deg),
    red, orange, yellow, green, blue, purple, magenta, red);
  mix-blend-mode: color-dodge;
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transition: opacity 0.3s ease;
}
```

This is intentionally different from `.holo-overlay` — the conic-gradient produces a more vivid, rainbow-prismatic look that suits the shiny aesthetic.

**Mouse interaction (desktop):**
- **When `holoAngle` prop is provided**: Uses the external angle directly via inline style `--holo-angle`, no mouse listener attached
- **When `disableMouseTracking` is true**: Uses CSS auto-sweep animation only
- **Otherwise**: Attaches `onMouseMove` handler on the wrapper div, calculates angle from cursor position to center: `Math.atan2(dy, dx)`, updates `--holo-angle` CSS custom property, RAF-throttled, smooth transition back on `onMouseLeave`

**Auto-sweep (mobile):**
- Uses a dedicated `@keyframes shiny-holo-auto` that only animates `--holo-angle` (not `--holo-x`, which is unused by the conic-gradient)
- Applied via CSS `@media (hover: none)` — no JS `window.innerWidth` check (avoids SSR hydration mismatch)

**Intensity by rarity:**

| Property | OneShiny | TwoShiny |
|----------|----------|----------|
| Opacity | 0.3 | 0.5 |
| Blur filter | 12px | 8px (sharper = more vivid) |
| Saturation | 0.8 (slightly muted) | 1.0 (full) |
| Blend mode | color-dodge | color-dodge |
| Border glow | 1px subtle purple | 2px bright purple |

### Layer 2: Sparkle Particles

Small absolute-positioned elements with class `shiny-sparkle`, animated with CSS `@keyframes shiny-sparkle`.

**Particle properties:**
- Shape: 4-pointed star (created via CSS `clip-path` or rotated squares)
- Color: white with slight gold tint for TwoShiny
- Animation: scale(0) → scale(1) → scale(0) with rotation and opacity pulse
- Duration: 1.5-3s per particle (randomized)
- Staggered delays for natural feel

**Count by rarity:**

| Property | OneShiny | TwoShiny |
|----------|----------|----------|
| Particle count (desktop) | 5 | 10 |
| Particle count (mobile) | 3 | 6 |
| Max size | 6px | 10px |
| Color | white/silver | white/gold |
| Brightness | 0.7 | 1.0 |

**Mobile particle count:** Render all particles in JSX. The "desktop-only" extras (particles 4-5 for OneShiny, particles 7-10 for TwoShiny) get class `shiny-sparkle-desktop-only`. CSS rules:
```css
/* Hidden by default (mobile) */
.shiny-sparkle-desktop-only {
  display: none;
}
/* Shown on desktop */
@media (hover: hover) and (pointer: fine) {
  .shiny-sparkle-desktop-only {
    display: block;
  }
}
```
This avoids SSR hydration mismatches from `window.innerWidth` checks.

**Positioning:**
- Randomly distributed across the card area
- Positions computed in `useMemo` seeded from the `seed` prop
- The `seed` prop allows each integration site to provide a stable identifier:
  - `CardDisplay`: card ID
  - `PackOpeningAnimation`: card ID + slot number
  - `ImmersiveCard`: card ID
  - `HeroCardStack`: card ID
  - `RareCardShowcase`: card ID
- A simple string hash function converts the seed to a deterministic number sequence for x/y/delay/size values

### Accessibility

- **JS-level gating**: Use `usePrefersReducedMotion()` hook (or a `useEffect`-based check) to gate rendering of both overlay layers entirely — don't render the DOM elements at all when reduced motion is preferred (consistent with the pattern in `ImmersiveCard.tsx` lines 21-29)
- **CSS fallback**: Also include `@media (prefers-reduced-motion: reduce)` rules to hide `.shiny-sparkle` and `.shiny-holo-overlay` as a safety net
- Effect is purely decorative — no information conveyed solely through the animation

## Utility: `isShinyRarity()`

### File: `lib/constants.ts` (addition)

```ts
export function isShinyRarity(rarity: Rarity): boolean {
  return rarity === Rarity.OneShiny || rarity === Rarity.TwoShiny;
}
```

## New CSS in `globals.css`

```css
/* Shiny card holographic overlay — conic-gradient for vivid rainbow prismatic effect */
.shiny-holo-overlay {
  background: conic-gradient(from var(--holo-angle, 0deg),
    red, orange, yellow, green, blue, purple, magenta, red);
  mix-blend-mode: color-dodge;
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transition: opacity 0.3s ease;
}

/* Dedicated auto-sweep for shiny overlay — only animates --holo-angle (not --holo-x) */
@keyframes shiny-holo-auto {
  0%   { --holo-angle: 80deg; }
  50%  { --holo-angle: 160deg; }
  100% { --holo-angle: 80deg; }
}

@media (hover: none) {
  .shiny-holo-overlay {
    animation: shiny-holo-auto 4s linear infinite;
  }
}

@keyframes shiny-sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
}

/* Desktop-only extra sparkle particles */
.shiny-sparkle-desktop-only {
  display: none;
}
@media (hover: hover) and (pointer: fine) {
  .shiny-sparkle-desktop-only {
    display: block;
  }
}

@media (prefers-reduced-motion: reduce) {
  .shiny-sparkle,
  .shiny-holo-overlay {
    display: none !important;
  }
}
```

## Integration Points

### 1. `components/CardDisplay.tsx`

Wrap the `aspect-[2.5/3.5]` image container div:
```tsx
<ShinyEffect rarity={card.rarity as Rarity} seed={card.id}>
  <div className="relative aspect-[2.5/3.5] overflow-hidden">
    {/* existing card image + overlays */}
  </div>
</ShinyEffect>
```

Straightforward — CardDisplay has no existing holo effects (only a subtle reverse-holo gradient overlay, which is visually distinct and non-conflicting).

### 2. `components/PackOpeningAnimation.tsx`

**Two integration sites, both inside `HoloCard`:**

The key constraint is that `holoStyle` (containing `--holo-angle`) is **private state inside `HoloCard`**. It is not accessible at the `PackOpeningAnimation` call site. Therefore, `ShinyEffect` must be rendered **inside `HoloCard`'s body** where `holoStyle` is in scope.

**Approach: Modify `HoloCard` to render `ShinyEffect` internally.**

Add a `rarity` prop and optional `seed` prop to `HoloCard`. Inside `HoloCard`'s render, after the existing `.holo-overlay` div, render `ShinyEffect` with `holoAngle` extracted from the local `holoStyle` state:

```tsx
function HoloCard({ children, isActive, className, rarity, seed }: {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
  rarity?: Rarity;
  seed?: string;
}) {
  const [holoStyle, setHoloStyle] = useState<React.CSSProperties>({});
  // ... existing mouse tracking logic ...

  // Extract angle for ShinyEffect
  const holoAngleValue = (holoStyle as Record<string, string>)['--holo-angle'];

  return (
    <div className={className} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {children}
      {isActive && <div className="holo-overlay active" style={holoStyle} />}
      {rarity && isShinyRarity(rarity) && (
        <ShinyEffect rarity={rarity} seed={seed} holoAngle={holoAngleValue} />
      )}
    </div>
  );
}
```

**Note:** With this approach, `ShinyEffect` renders as an overlay sibling (not a wrapper), so it needs to support an "overlay-only" mode where it renders just its two layers (holo + sparkles) as absolute-positioned children, without wrapping content. Add an `asOverlay?: boolean` prop that makes it render only the overlay layers without the wrapper div.

**a) Single-card flip reveal (~line 636):**
```tsx
<HoloCard isActive={...} rarity={currentCard.rarity} seed={`${currentCard.id}-${currentCard.slot_number}`}>
  <img src={currentCard.image_url_hires || currentCard.image_url} ... />
</HoloCard>
```

**b) Completion grid summary (~line 813):**
```tsx
<HoloCard isActive={isHoloEligible} rarity={card.rarity} seed={card.id}>
  <img src={card.image_url} ... />
</HoloCard>
```

**Stacking note:** The existing `HoloCard` holo overlay uses `.holo-overlay` (linear-gradient, color-dodge). The shiny effect adds `.shiny-holo-overlay` (conic-gradient, color-dodge) on top. These are complementary — combined they create a "holo + shiny" layered look that only appears on shiny cards.

### 3. `components/ImmersiveCard.tsx`

The ImmersiveCard already has:
- `useTiltEffect` hook computing mouse position → tilt angles
- `useGyroscope` hook for device motion
- An `.immersive-holo-overlay.active` div at opacity 0.7

**Integration approach:** The holo angle lives in `activeStyle` as a CSS custom property string. Extract it and pass to `ShinyEffect`:

```tsx
// Inside ImmersiveCard render:
const holoAngleValue = (activeStyle as Record<string, string>)['--holo-angle'];
const isShiny = isShinyRarity(card.rarity as Rarity);

// Existing holo overlay — dim for shiny cards:
<div
  className="holo-overlay active pointer-events-none absolute inset-0 rounded-2xl"
  style={{ ...activeStyle, opacity: isShiny ? 0.4 : 0.7, transform: 'translateZ(10px)' }}
/>

// Add ShinyEffect overlay after the existing holo overlay:
{isShiny && (
  <ShinyEffect
    rarity={card.rarity as Rarity}
    seed={card.id}
    holoAngle={holoAngleValue}
    asOverlay
  />
)}
```

**Explicit code change required:** The existing `opacity: 0.7` inline style on the `.holo-overlay.active` div must be changed to `opacity: isShiny ? 0.4 : 0.7`. Import `isShinyRarity` from `lib/constants`.

**Triple-layer visual balance:** For TwoShiny cards:
1. Existing `.immersive-holo-overlay` at **reduced opacity 0.4** (down from 0.7)
2. `.shiny-holo-overlay` at opacity 0.5
3. Sparkle particles

This prevents visual overload while keeping the shiny effect prominent.

### 4. `components/HeroCardStack.tsx`

HeroCardStack already has a container-level `mousemove` listener for parallax and an `.holo-overlay.active` on the front card.

**Integration approach:** Use `disableMouseTracking={true}` and `asOverlay` on `ShinyEffect` so it only uses CSS auto-sweep and doesn't conflict with the container parallax system. Add inside each card slot, after the image, conditionally for shiny cards.

### 5. `components/RareCardShowcase.tsx`

RareCardShowcase already applies `.holo-overlay.active` directly on its card image. Apply `ShinyEffect` with mouse tracking enabled (no competing mouse handlers on the card itself). Use `asOverlay` mode.

## Updated Props Summary

Final `ShinyEffect` props:
- `rarity: Rarity` — required
- `children?: ReactNode` — card content (used in wrapper mode)
- `className?: string` — additional classes
- `disableMouseTracking?: boolean` — force CSS auto-sweep
- `holoAngle?: number | string` — external angle, normalized via `parseFloat()`
- `seed?: string` — deterministic sparkle positioning
- `asOverlay?: boolean` — when true, renders only the overlay layers (holo + sparkles) as absolute-positioned elements, no wrapper div. Used when `ShinyEffect` is a sibling inside an existing container (HoloCard, ImmersiveCard) rather than wrapping content.

## Performance Considerations

- **Zero overhead for non-shiny cards**: Component returns children directly (wrapper mode) or nothing (overlay mode)
- **CSS-only sparkle animation**: No JS animation loop, uses CSS `@keyframes`
- **Single mousemove listener**: RAF-throttled, only when no `holoAngle` or `disableMouseTracking` prop
- **Mobile optimization**: CSS media query controls particle visibility, CSS auto-sweep instead of mouse tracking
- **`will-change: opacity, transform`** on animated sparkle elements
- **No layout shift**: Sparkle positions computed once via `useMemo` with deterministic seed
- **SSR-safe**: No `window.innerWidth` checks; mobile detection via CSS media queries; reduced-motion via JS hook in `useEffect`

## Verification

1. **Collection grid**: Open collection page with shiny cards — verify holo overlay and sparkles appear on OneShiny/TwoShiny cards
2. **Intensity check**: Compare OneShiny vs TwoShiny side by side — TwoShiny should be visibly more dramatic
3. **Mouse interaction**: Move mouse over shiny card on desktop — holo angle should follow cursor
4. **Mobile check**: On mobile/touch device — auto-sweep animation plays, reduced particle count
5. **Non-shiny cards**: Verify zero visual change on Common, Rare, UltraRare, etc.
6. **Reduced motion**: Enable `prefers-reduced-motion` in browser — all shiny effects should be hidden (no DOM elements rendered)
7. **Pack opening — reveal**: Open a pack containing a shiny card — effect appears on card flip, layers with existing HoloCard holo
8. **Pack opening — summary grid**: After all cards revealed, shiny cards in the summary grid also show the effect
9. **Immersive viewer**: Click a shiny card to open ImmersiveCard — shiny effect visible without visual overload (existing holo dimmed to 0.4)
10. **HeroCardStack**: If a shiny card appears in the hero section — auto-sweep holo + sparkles visible
11. **RareCardShowcase**: Shiny cards in the showcase display the effect
12. **Performance**: No jank or dropped frames when scrolling collection with multiple shiny cards visible
13. **SSR/Hydration**: No hydration mismatch warnings in the console on page load
