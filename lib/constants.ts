import { Rarity } from '@/types';

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
};

// Hit slot (#10) pull rates - based on community-tracked Scarlet & Violet data
export const HIT_SLOT_RATES: { rarity: Rarity; weight: number }[] = [
  { rarity: Rarity.Rare, weight: 71.5 },
  { rarity: Rarity.DoubleRare, weight: 14.3 },
  { rarity: Rarity.IllustrationRare, weight: 7.5 },
  { rarity: Rarity.UltraRare, weight: 6.7 },
  { rarity: Rarity.SpecialIllustrationRare, weight: 3.0 },
  { rarity: Rarity.HyperRare, weight: 1.85 },
];

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

export const CARDS_PER_PACK = 10;
export const TCGP_CARDS_PER_PACK = 5;
export const STARTING_BALANCE_USD = 10.0;
export const DEFAULT_PACK_PRICE_USD = 4.49;
export const SELL_RATE = 0.6;
