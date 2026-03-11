import { Rarity } from '@/types';
import { HIT_SLOT_RATES, TCGP_HIT_SLOT_RATES, type RateEntry } from './constants';

/**
 * Roll the hit slot (#10) rarity using weighted random selection.
 * Accepts optional rates for Bayesian-adjusted pull rates; falls back to static SV rates.
 */
export function rollHitSlotRarity(rates?: RateEntry[]): Rarity {
  const entries = rates ?? HIT_SLOT_RATES;
  const totalWeight = entries.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const rate of entries) {
    roll -= rate.weight;
    if (roll <= 0) return rate.rarity;
  }

  return Rarity.Rare;
}

/**
 * Roll the reverse holo slot (#8) rarity.
 * Mirrors overall set distribution — mostly common/uncommon.
 */
export function rollReverseHoloRarity(): Rarity {
  const roll = Math.random() * 100;
  if (roll < 60) return Rarity.Common;
  if (roll < 90) return Rarity.Uncommon;
  return Rarity.Rare;
}

/**
 * Roll the TCGP hit slot (#5) rarity using weighted random selection.
 * Accepts optional rates for Bayesian-adjusted pull rates; falls back to static TCGP rates.
 */
export function rollTCGPHitSlotRarity(rates?: RateEntry[]): Rarity {
  const entries = rates ?? TCGP_HIT_SLOT_RATES;
  const totalWeight = entries.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const rate of entries) {
    roll -= rate.weight;
    if (roll <= 0) return rate.rarity;
  }

  return Rarity.ThreeDiamond;
}

/**
 * Determine the rarity order for sorting (higher = rarer).
 */
export function rarityOrder(rarity: Rarity): number {
  const order: Record<Rarity, number> = {
    [Rarity.Common]: 0,
    [Rarity.Uncommon]: 1,
    [Rarity.Rare]: 2,
    [Rarity.DoubleRare]: 3,
    [Rarity.IllustrationRare]: 4,
    [Rarity.UltraRare]: 5,
    [Rarity.SpecialIllustrationRare]: 6,
    [Rarity.HyperRare]: 7,
    // TCG Pocket
    [Rarity.OneDiamond]: 0,
    [Rarity.TwoDiamond]: 1,
    [Rarity.ThreeDiamond]: 2,
    [Rarity.FourDiamond]: 3,
    [Rarity.OneStar]: 5,
    [Rarity.TwoStar]: 6,
    [Rarity.ThreeStar]: 7,
    [Rarity.Crown]: 8,
    [Rarity.OneShiny]: 4,
    [Rarity.TwoShiny]: 5,
  };
  return order[rarity] ?? 0;
}
