import { Rarity } from '@/types';
import { SELL_RATE, RARITY_ESTIMATE_PRICES } from '@/lib/constants';

export const AUTO_BUYBACK_VALUE_THRESHOLD = 5.0;

export const AUTO_BUYBACK_RARITIES: Rarity[] = [
  Rarity.Common,
  Rarity.Uncommon,
  Rarity.OneDiamond,
  Rarity.TwoDiamond,
];

/** Returns true if the card should be auto-sold (low rarity + low value). */
export function shouldAutoSell(rarity: Rarity, price: number): boolean {
  if (price >= AUTO_BUYBACK_VALUE_THRESHOLD) return false;
  return AUTO_BUYBACK_RARITIES.includes(rarity);
}

/** Resolves a card's effective price, falling back to rarity estimates. */
export function getCardPrice(card: { price?: number | null; rarity?: string }): number {
  return card.price ?? RARITY_ESTIMATE_PRICES[card.rarity ?? ''] ?? 0;
}

/** Calculates the sell-back value for a card at the standard sell rate. */
export function getAutoSellValue(price: number): number {
  return parseFloat((price * SELL_RATE).toFixed(2));
}
