import { Rarity } from '@/types';
import { HIT_SLOT_RATES, TCGP_HIT_SLOT_RATES } from './constants';

/**
 * Roll the hit slot (#10) rarity based on real Pokemon TCG pull rates.
 * Uses weighted random selection.
 */
export function rollHitSlotRarity(): Rarity {
  const totalWeight = HIT_SLOT_RATES.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const rate of HIT_SLOT_RATES) {
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
 * Roll the TCGP hit slot (#5) rarity based on TCG Pocket pull rates.
 */
export function rollTCGPHitSlotRarity(): Rarity {
  const totalWeight = TCGP_HIT_SLOT_RATES.reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const rate of TCGP_HIT_SLOT_RATES) {
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
