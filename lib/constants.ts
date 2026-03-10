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
    color: '#A8A29E',
    glowColor: 'rgba(168, 162, 158, 0.1)',
    borderClass: 'border-[#E7E5E4]',
    badgeClass: 'text-[#A8A29E]',
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
