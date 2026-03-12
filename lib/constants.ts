import { Edition, Rarity } from '@/types';

// --- Edition configuration ---

export const EDITION_CONFIG: Record<
  Edition,
  {
    label: string;
    shortLabel: string;
    color: string;
    badgeClass: string;
    priceMultiplier: number;
  }
> = {
  '1st-edition': {
    label: '1st Edition',
    shortLabel: '1st Ed.',
    color: '#1a1a1a',
    badgeClass: 'bg-black text-yellow-400 border border-yellow-500',
    priceMultiplier: 5.0,
  },
  shadowless: {
    label: 'Shadowless',
    shortLabel: 'Shadowless',
    color: '#6B7280',
    badgeClass: 'bg-gray-700 text-white border border-gray-500',
    priceMultiplier: 3.0,
  },
  unlimited: {
    label: 'Unlimited',
    shortLabel: 'Unlimited',
    color: '#2563EB',
    badgeClass: 'bg-blue-600 text-white border border-blue-400',
    priceMultiplier: 1.0,
  },
};

// Canonical edition display order
export const EDITION_ORDER: Edition[] = ['1st-edition', 'shadowless', 'unlimited'];

// Sets that received 1st Edition print runs
export const FIRST_EDITION_SET_IDS = [
  'base1', 'base2', 'base3', 'base5',
  'gym1', 'gym2',
  'neo1', 'neo2', 'neo3', 'neo4',
];

// Only Base Set had the Shadowless variant
export const SHADOWLESS_SET_IDS = ['base1'];

export const RARITY_CONFIG: Record<
  Rarity,
  {
    color: string;
    glowColor: string;
    borderClass: string;
    badgeClass: string;
    label: string;
    order: number;
  }
> = {
  [Rarity.Common]: {
    color: '#9CA3AF',
    glowColor: 'rgba(156, 163, 175, 0.1)',
    borderClass: 'border-[#E5E7EB]',
    badgeClass: 'text-[#9CA3AF]',
    label: 'Common',
    order: 0,
  },
  [Rarity.Uncommon]: {
    color: '#4ADE80',
    glowColor: 'rgba(74, 222, 128, 0.1)',
    borderClass: 'border-[#BBF7D0]',
    badgeClass: 'text-[#16A34A]',
    label: 'Uncommon',
    order: 1,
  },
  [Rarity.Rare]: {
    color: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.1)',
    borderClass: 'border-[#FDE68A]',
    badgeClass: 'text-[#D97706]',
    label: 'Rare',
    order: 2,
  },
  [Rarity.DoubleRare]: {
    color: '#60A5FA',
    glowColor: 'rgba(96, 165, 250, 0.1)',
    borderClass: 'border-[#BFDBFE]',
    badgeClass: 'text-[#2563EB]',
    label: 'Double Rare',
    order: 3,
  },
  [Rarity.IllustrationRare]: {
    color: '#A78BFA',
    glowColor: 'rgba(167, 139, 250, 0.1)',
    borderClass: 'border-[#DDD6FE]',
    badgeClass: 'text-[#7C3AED]',
    label: 'Illustration Rare',
    order: 4,
  },
  [Rarity.UltraRare]: {
    color: '#FB923C',
    glowColor: 'rgba(251, 146, 60, 0.1)',
    borderClass: 'border-[#FED7AA]',
    badgeClass: 'text-[#EA580C]',
    label: 'Ultra Rare',
    order: 5,
  },
  [Rarity.SpecialIllustrationRare]: {
    color: '#F472B6',
    glowColor: 'rgba(244, 114, 182, 0.1)',
    borderClass: 'border-[#FBCFE8]',
    badgeClass: 'text-[#DB2777]',
    label: 'Special Art',
    order: 6,
  },
  [Rarity.HyperRare]: {
    color: '#FACC15',
    glowColor: 'rgba(250, 204, 21, 0.1)',
    borderClass: 'border-[#FEF08A]',
    badgeClass: 'text-[#CA8A04]',
    label: 'Hyper Rare',
    order: 7,
  },
  // TCG Pocket rarities
  [Rarity.OneDiamond]: {
    color: '#9CA3AF',
    glowColor: 'rgba(156, 163, 175, 0.1)',
    borderClass: 'border-[#E5E7EB]',
    badgeClass: 'text-[#9CA3AF]',
    label: '◆',
    order: 0,
  },
  [Rarity.TwoDiamond]: {
    color: '#4ADE80',
    glowColor: 'rgba(74, 222, 128, 0.1)',
    borderClass: 'border-[#BBF7D0]',
    badgeClass: 'text-[#16A34A]',
    label: '◆◆',
    order: 1,
  },
  [Rarity.ThreeDiamond]: {
    color: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.1)',
    borderClass: 'border-[#FDE68A]',
    badgeClass: 'text-[#D97706]',
    label: '◆◆◆',
    order: 2,
  },
  [Rarity.FourDiamond]: {
    color: '#60A5FA',
    glowColor: 'rgba(96, 165, 250, 0.1)',
    borderClass: 'border-[#BFDBFE]',
    badgeClass: 'text-[#2563EB]',
    label: '◆◆◆◆',
    order: 3,
  },
  [Rarity.OneStar]: {
    color: '#A78BFA',
    glowColor: 'rgba(167, 139, 250, 0.1)',
    borderClass: 'border-[#DDD6FE]',
    badgeClass: 'text-[#7C3AED]',
    label: '★',
    order: 5,
  },
  [Rarity.TwoStar]: {
    color: '#F472B6',
    glowColor: 'rgba(244, 114, 182, 0.1)',
    borderClass: 'border-[#FBCFE8]',
    badgeClass: 'text-[#DB2777]',
    label: '★★',
    order: 6,
  },
  [Rarity.ThreeStar]: {
    color: '#FB923C',
    glowColor: 'rgba(251, 146, 60, 0.1)',
    borderClass: 'border-[#FED7AA]',
    badgeClass: 'text-[#EA580C]',
    label: '★★★',
    order: 7,
  },
  [Rarity.Crown]: {
    color: '#FACC15',
    glowColor: 'rgba(250, 204, 21, 0.1)',
    borderClass: 'border-[#FEF08A]',
    badgeClass: 'text-[#CA8A04]',
    label: '👑',
    order: 8,
  },
  [Rarity.OneShiny]: {
    color: '#E879F9',
    glowColor: 'rgba(232, 121, 249, 0.1)',
    borderClass: 'border-[#F0ABFC]',
    badgeClass: 'text-[#C026D3]',
    label: '✦',
    order: 4,
  },
  [Rarity.TwoShiny]: {
    color: '#C084FC',
    glowColor: 'rgba(192, 132, 252, 0.1)',
    borderClass: 'border-[#D8B4FE]',
    badgeClass: 'text-[#9333EA]',
    label: '✦✦',
    order: 5,
  },
};

// --- Era-based hit slot pull rates ---
// Each era uses our mapped Rarity enum (sync-cards.ts maps V→DoubleRare, etc.)
// Only eras with verified community-tracked data get custom rates; others fall back to SV.

export type RateEntry = { rarity: Rarity; weight: number };

export type EraConfig = {
  name: string;
  prefixes: string[];
  hitSlotRates: RateEntry[];
};

// Scarlet & Violet — PokéBeach community-tracked (~10k+ pack dataset)
const SV_HIT_RATES: RateEntry[] = [
  { rarity: Rarity.Rare, weight: 71.5 },
  { rarity: Rarity.DoubleRare, weight: 14.3 },
  { rarity: Rarity.IllustrationRare, weight: 7.5 },
  { rarity: Rarity.UltraRare, weight: 6.7 },
  { rarity: Rarity.SpecialIllustrationRare, weight: 3.0 },
  { rarity: Rarity.HyperRare, weight: 1.85 },
];

// Sword & Shield — community-tracked (V/VMAX mapped to DoubleRare, etc.)
const SWSH_HIT_RATES: RateEntry[] = [
  { rarity: Rarity.Rare, weight: 70.0 },
  { rarity: Rarity.DoubleRare, weight: 17.0 },     // V + VMAX + VSTAR
  { rarity: Rarity.UltraRare, weight: 6.5 },        // Full Art V, Amazing/Radiant
  { rarity: Rarity.SpecialIllustrationRare, weight: 3.5 }, // Alt Art
  { rarity: Rarity.HyperRare, weight: 3.0 },        // Secret/Gold/Rainbow
];

// Sun & Moon — community-tracked (GX mapped to DoubleRare/UltraRare)
const SM_HIT_RATES: RateEntry[] = [
  { rarity: Rarity.Rare, weight: 70.0 },
  { rarity: Rarity.DoubleRare, weight: 16.0 },      // GX
  { rarity: Rarity.UltraRare, weight: 8.0 },        // Full Art GX
  { rarity: Rarity.SpecialIllustrationRare, weight: 3.0 }, // Alt Art (Tag Team era)
  { rarity: Rarity.HyperRare, weight: 3.0 },        // Rainbow/Secret
];

export const ERA_PULL_RATES: EraConfig[] = [
  { name: 'Scarlet & Violet', prefixes: ['sv'], hitSlotRates: SV_HIT_RATES },
  { name: 'Sword & Shield', prefixes: ['swsh'], hitSlotRates: SWSH_HIT_RATES },
  { name: 'Sun & Moon', prefixes: ['sm'], hitSlotRates: SM_HIT_RATES },
];

/** Get the prior hit-slot rates for a set, falling back to SV rates for unverified eras. */
export function getPriorRatesForSet(setId: string): RateEntry[] {
  for (const era of ERA_PULL_RATES) {
    if (era.prefixes.some((p) => setId.startsWith(p))) {
      return era.hitSlotRates;
    }
  }
  return SV_HIT_RATES; // fallback for XY, BW, HGSS, DP, Platinum, EX, Neo, WotC
}

// Keep the default export for backward compatibility
export const HIT_SLOT_RATES: RateEntry[] = SV_HIT_RATES;

export type AnimationTier = 'common' | 'mid' | 'high' | 'ultra';
export type ParticleType = 'none' | 'sparkle' | 'burst' | 'explosion' | 'shower';

export const RARITY_ANIMATION_CONFIG: Record<
  Rarity,
  {
    tier: AnimationTier;
    flipDuration: number;
    preRevealDelay: number;
    glowIntensity: number;
    glowPulse: boolean;
    particles: ParticleType;
    screenShake: boolean;
    screenFlash: boolean;
    crackEffect: boolean;
    showImmersive: boolean;
  }
> = {
  [Rarity.Common]: { tier: 'common', flipDuration: 0.5, preRevealDelay: 0, glowIntensity: 0, glowPulse: false, particles: 'none', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.Uncommon]: { tier: 'common', flipDuration: 0.5, preRevealDelay: 0, glowIntensity: 0, glowPulse: false, particles: 'none', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.Rare]: { tier: 'mid', flipDuration: 0.7, preRevealDelay: 400, glowIntensity: 0.3, glowPulse: false, particles: 'sparkle', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.DoubleRare]: { tier: 'mid', flipDuration: 0.8, preRevealDelay: 600, glowIntensity: 0.5, glowPulse: true, particles: 'burst', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.IllustrationRare]: { tier: 'high', flipDuration: 0.9, preRevealDelay: 800, glowIntensity: 0.6, glowPulse: true, particles: 'burst', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.UltraRare]: { tier: 'ultra', flipDuration: 1.0, preRevealDelay: 1200, glowIntensity: 0.8, glowPulse: true, particles: 'explosion', screenShake: true, screenFlash: false, crackEffect: true, showImmersive: true },
  [Rarity.SpecialIllustrationRare]: { tier: 'ultra', flipDuration: 1.1, preRevealDelay: 1500, glowIntensity: 0.9, glowPulse: true, particles: 'explosion', screenShake: true, screenFlash: true, crackEffect: true, showImmersive: true },
  [Rarity.HyperRare]: { tier: 'ultra', flipDuration: 1.2, preRevealDelay: 2000, glowIntensity: 1.0, glowPulse: true, particles: 'shower', screenShake: true, screenFlash: true, crackEffect: true, showImmersive: true },
  // TCG Pocket rarities
  [Rarity.OneDiamond]: { tier: 'common', flipDuration: 0.5, preRevealDelay: 0, glowIntensity: 0, glowPulse: false, particles: 'none', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.TwoDiamond]: { tier: 'common', flipDuration: 0.5, preRevealDelay: 0, glowIntensity: 0, glowPulse: false, particles: 'none', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.ThreeDiamond]: { tier: 'mid', flipDuration: 0.7, preRevealDelay: 400, glowIntensity: 0.3, glowPulse: false, particles: 'sparkle', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.FourDiamond]: { tier: 'mid', flipDuration: 0.8, preRevealDelay: 600, glowIntensity: 0.5, glowPulse: true, particles: 'burst', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.OneStar]: { tier: 'high', flipDuration: 0.9, preRevealDelay: 800, glowIntensity: 0.6, glowPulse: true, particles: 'burst', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.TwoStar]: { tier: 'ultra', flipDuration: 1.0, preRevealDelay: 1200, glowIntensity: 0.8, glowPulse: true, particles: 'explosion', screenShake: true, screenFlash: false, crackEffect: true, showImmersive: true },
  [Rarity.ThreeStar]: { tier: 'ultra', flipDuration: 1.1, preRevealDelay: 1500, glowIntensity: 0.9, glowPulse: true, particles: 'explosion', screenShake: true, screenFlash: true, crackEffect: true, showImmersive: true },
  [Rarity.Crown]: { tier: 'ultra', flipDuration: 1.2, preRevealDelay: 2000, glowIntensity: 1.0, glowPulse: true, particles: 'shower', screenShake: true, screenFlash: true, crackEffect: true, showImmersive: true },
  [Rarity.OneShiny]: { tier: 'high', flipDuration: 0.9, preRevealDelay: 800, glowIntensity: 0.6, glowPulse: true, particles: 'burst', screenShake: false, screenFlash: false, crackEffect: false, showImmersive: false },
  [Rarity.TwoShiny]: { tier: 'ultra', flipDuration: 1.0, preRevealDelay: 1200, glowIntensity: 0.8, glowPulse: true, particles: 'explosion', screenShake: true, screenFlash: false, crackEffect: true, showImmersive: true },
};

// TCG Pocket hit slot (#5) pull rates
export const TCGP_HIT_SLOT_RATES: { rarity: Rarity; weight: number }[] = [
  { rarity: Rarity.ThreeDiamond, weight: 60.0 },
  { rarity: Rarity.FourDiamond, weight: 20.0 },
  { rarity: Rarity.OneStar, weight: 12.0 },
  { rarity: Rarity.TwoStar, weight: 5.0 },
  { rarity: Rarity.ThreeStar, weight: 2.5 },
  { rarity: Rarity.Crown, weight: 0.5 },
];

export const TCGP_RELEASE_DATES: Record<string, string> = {
  'A1': '2024-10-30',
  'A1a': '2024-12-17',
  'A2': '2025-01-29',
  'A2a': '2025-03-01',
  'A2b': '2025-05-29',
};

export const CARDS_PER_PACK = 10;
export const TCGP_CARDS_PER_PACK = 5;
export const STARTING_BALANCE_USD = 10.0;
export const DEFAULT_PACK_PRICE_USD = 4.49;
export const SELL_RATE = 0.6;

// --- Shared pricing utilities ---

// Fallback estimates for cards without API pricing
export const RARITY_ESTIMATE_PRICES: Record<string, number> = {
  [Rarity.Common]: 0.10,
  [Rarity.Uncommon]: 0.25,
  [Rarity.Rare]: 1.50,
  [Rarity.DoubleRare]: 5.0,
  [Rarity.IllustrationRare]: 8.0,
  [Rarity.UltraRare]: 15.0,
  [Rarity.SpecialIllustrationRare]: 30.0,
  [Rarity.HyperRare]: 60.0,
};

// Era-based real-world pack pricing (USD)
export function getEraFallbackPrice(setId: string): number {
  if (setId.startsWith('sv') || setId.startsWith('swsh')) return 4.49;
  if (setId.startsWith('sm')) return 5.0;
  if (setId.startsWith('xy') || setId.startsWith('g1')) return 10.0;
  if (setId.startsWith('bw')) return 20.0;
  if (setId.startsWith('hgss') || setId.startsWith('col')) return 30.0;
  if (setId.startsWith('pl')) return 35.0;
  if (setId.startsWith('dp')) return 30.0;
  if (setId.startsWith('ex') || setId.startsWith('ecard')) return 80.0;
  if (setId.startsWith('neo')) return 150.0;
  if (setId.startsWith('gym')) return 200.0;
  if (setId.startsWith('base')) return 250.0;
  return 4.49;
}
