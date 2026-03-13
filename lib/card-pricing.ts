/**
 * Shared card pricing extraction logic.
 *
 * Used by both the initial card sync (scripts/sync-cards.ts) and the
 * daily price refresh (lib/sync-card-prices.ts).
 */

import type { TCGdexPricing } from './pokemon-tcg-api';
import type { Edition } from '@/types';

// --- TCGPlayer variant + field priority ---

export const TCGPLAYER_VARIANTS = ['holofoil', 'normal', 'reverse-holofoil', '1stEditionHolofoil', '1stEditionNormal'] as const;
export const TCGPLAYER_PRICE_FIELDS = ['marketPrice', 'midPrice', 'lowPrice'] as const;
export const CARDMARKET_FIELDS = ['avg', 'trend', 'avg1', 'avg7', 'avg30', 'low'] as const;
export const CARDMARKET_HOLO_FIELDS = ['avg-holo', 'trend-holo', 'avg1-holo', 'avg7-holo', 'avg30-holo', 'low-holo'] as const;

// --- Types ---

export interface PricingResult {
  price: number | null;
  priceTrend: 'up' | 'down' | 'stable' | null;
  priceSource: 'tcgplayer' | 'cardmarket' | null;
  priceVariant: string | null;
}

export interface PricingDetailRow {
  card_id: string;
  variant: string;
  tcgplayer_low: number | null;
  tcgplayer_mid: number | null;
  tcgplayer_high: number | null;
  tcgplayer_market: number | null;
  tcgplayer_direct_low: number | null;
  cardmarket_avg: number | null;
  cardmarket_low: number | null;
  cardmarket_trend: number | null;
  cardmarket_avg7: number | null;
  cardmarket_avg30: number | null;
  updated_at: string;
}

// --- Extraction functions ---

/**
 * Extract a single "best" price from TCGdex pricing data.
 * Tries TCGPlayer first (holofoil > normal > reverse-holo > 1st ed variants),
 * then falls back to Cardmarket. For holo cards, tries holo-specific Cardmarket
 * fields before generic ones.
 */
export function extractPricing(pricing: TCGdexPricing | undefined, isHolo = false): PricingResult {
  if (!pricing) return { price: null, priceTrend: null, priceSource: null, priceVariant: null };

  let price: number | null = null;
  let priceSource: 'tcgplayer' | 'cardmarket' | null = null;
  let priceVariant: string | null = null;

  // Try TCGPlayer: each variant × each price field
  if (pricing.tcgplayer) {
    const tp = pricing.tcgplayer as Record<string, Record<string, number | null> | undefined>;
    outer:
    for (const variant of TCGPLAYER_VARIANTS) {
      const vp = tp[variant];
      if (!vp) continue;
      for (const field of TCGPLAYER_PRICE_FIELDS) {
        const val = vp[field];
        if (val != null && val > 0) {
          price = val;
          priceSource = 'tcgplayer';
          priceVariant = variant;
          break outer;
        }
      }
    }
  }

  // Fall back to Cardmarket
  if (price == null && pricing.cardmarket) {
    const cm = pricing.cardmarket as Record<string, number | null | undefined>;
    const fieldsToTry = isHolo
      ? [...CARDMARKET_HOLO_FIELDS, ...CARDMARKET_FIELDS]
      : CARDMARKET_FIELDS;

    for (const field of fieldsToTry) {
      const val = cm[field];
      if (val != null && val > 0) {
        price = val;
        priceSource = 'cardmarket';
        priceVariant = 'normal';
        break;
      }
    }
  }

  // Determine trend from cardmarket short-term vs long-term averages
  let priceTrend: 'up' | 'down' | 'stable' | null = null;
  if (pricing.cardmarket) {
    const { avg7, avg30 } = pricing.cardmarket;
    if (avg7 != null && avg30 != null && avg30 > 0) {
      const change = (avg7 - avg30) / avg30;
      if (change > 0.1) priceTrend = 'up';
      else if (change < -0.1) priceTrend = 'down';
      else priceTrend = 'stable';
    }
  }

  return { price, priceTrend, priceSource, priceVariant };
}

// --- Edition → TCGPlayer variant mapping ---

const EDITION_VARIANT_PRIORITY: Record<Edition, string[]> = {
  '1st-edition': ['1stEditionHolofoil', '1stEditionNormal'],
  'shadowless': ['holofoil', 'normal'],
  'unlimited': ['holofoil', 'normal', 'reverse-holofoil'],
};

/**
 * Get the price for a card given a specific pack edition.
 * Looks up the appropriate TCGPlayer variant from card_pricing_details.
 * Falls back to the card's base price if no edition-specific pricing found.
 */
export function getEditionPrice(
  cardBasePrice: number | null,
  edition: Edition | null | undefined,
  details: Pick<PricingDetailRow, 'variant' | 'tcgplayer_market' | 'tcgplayer_mid' | 'tcgplayer_low'>[],
): number | null {
  if (!edition || details.length === 0) return cardBasePrice;

  const variantPriority = EDITION_VARIANT_PRIORITY[edition];

  for (const variant of variantPriority) {
    const row = details.find((d) => d.variant === variant);
    if (!row) continue;
    const price = row.tcgplayer_market ?? row.tcgplayer_mid ?? row.tcgplayer_low;
    if (price != null && price > 0) return price;
  }

  return cardBasePrice;
}

/**
 * Build per-variant pricing detail rows for card_pricing_details table.
 * Returns one row per TCGPlayer variant found, plus a 'normal' row for
 * Cardmarket-only cards.
 */
export function buildPricingDetailRows(cardId: string, pricing: TCGdexPricing): PricingDetailRow[] {
  const rows: PricingDetailRow[] = [];
  const tp = pricing.tcgplayer as Record<string, Record<string, number | null>> | undefined;
  const cm = pricing.cardmarket as Record<string, number | null> | undefined;

  const variants = ['normal', 'holofoil', 'reverse-holofoil', '1stEditionHolofoil', '1stEditionNormal']
    .filter((v) => tp?.[v]);

  for (const variant of variants) {
    const vp = tp?.[variant];
    rows.push({
      card_id: cardId,
      variant,
      tcgplayer_low: vp?.lowPrice ?? null,
      tcgplayer_mid: vp?.midPrice ?? null,
      tcgplayer_high: vp?.highPrice ?? null,
      tcgplayer_market: vp?.marketPrice ?? null,
      tcgplayer_direct_low: vp?.directLowPrice ?? null,
      cardmarket_avg: cm?.avg ?? null,
      cardmarket_low: cm?.low ?? null,
      cardmarket_trend: cm?.trend ?? null,
      cardmarket_avg7: cm?.avg7 ?? null,
      cardmarket_avg30: cm?.avg30 ?? null,
      updated_at: new Date().toISOString(),
    });
  }

  // If no tcgplayer variants but has cardmarket data, insert as 'normal'
  if (variants.length === 0 && cm) {
    rows.push({
      card_id: cardId,
      variant: 'normal',
      tcgplayer_low: null,
      tcgplayer_mid: null,
      tcgplayer_high: null,
      tcgplayer_market: null,
      tcgplayer_direct_low: null,
      cardmarket_avg: cm.avg ?? null,
      cardmarket_low: cm.low ?? null,
      cardmarket_trend: cm.trend ?? null,
      cardmarket_avg7: cm.avg7 ?? null,
      cardmarket_avg30: cm.avg30 ?? null,
      updated_at: new Date().toISOString(),
    });
  }

  return rows;
}
