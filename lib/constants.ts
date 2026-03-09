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
    color: '#71717a',
    glowColor: 'rgba(113, 113, 122, 0.3)',
    borderClass: 'border-zinc-600',
    badgeClass: 'bg-zinc-700 text-zinc-300',
    label: 'Common',
    order: 0,
  },
  [Rarity.Uncommon]: {
    color: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.3)',
    borderClass: 'border-green-500/30',
    badgeClass: 'bg-green-900/50 text-green-400',
    label: 'Uncommon',
    order: 1,
  },
  [Rarity.Rare]: {
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.3)',
    borderClass: 'border-yellow-500/30',
    badgeClass: 'bg-yellow-900/50 text-yellow-400',
    label: 'Rare',
    order: 2,
  },
  [Rarity.DoubleRare]: {
    color: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.4)',
    borderClass: 'border-blue-400/40',
    badgeClass: 'bg-blue-900/50 text-blue-400',
    label: 'Double Rare',
    order: 3,
  },
  [Rarity.IllustrationRare]: {
    color: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.4)',
    borderClass: 'border-purple-400/40',
    badgeClass: 'bg-purple-900/50 text-purple-400',
    label: 'Illustration Rare',
    order: 4,
  },
  [Rarity.UltraRare]: {
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    borderClass: 'border-amber-400/50',
    badgeClass: 'bg-amber-900/50 text-amber-400',
    label: 'Ultra Rare',
    order: 5,
  },
  [Rarity.SpecialIllustrationRare]: {
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    borderClass: 'border-pink-400/40',
    badgeClass:
      'bg-gradient-to-r from-purple-900/50 to-pink-900/50 text-pink-400',
    label: 'Special Illustration Rare',
    order: 6,
  },
  [Rarity.HyperRare]: {
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.5)',
    borderClass: 'border-amber-300/50',
    badgeClass:
      'bg-gradient-to-r from-amber-900/50 to-yellow-900/50 text-amber-300',
    label: 'Hyper Rare',
    order: 7,
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

export const CARDS_PER_PACK = 10;
export const STARTING_COINS = 500;
export const DEFAULT_PACK_PRICE = 150;
