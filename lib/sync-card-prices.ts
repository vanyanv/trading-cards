/**
 * Daily card price sync from TCGdex API.
 *
 * Refreshes card prices (TCGPlayer + Cardmarket) into the existing
 * cards, card_price_history, and card_pricing_details tables.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchCardsBySet, type TCGdexPricing } from './pokemon-tcg-api';
import { extractPricing, buildPricingDetailRows } from './card-pricing';

export interface CardPriceSyncResult {
  totalSets: number;
  skippedSets: number;
  cardsProcessed: number;
  pricesUpdated: number;
  historyRecorded: number;
  detailsUpdated: number;
  errors: number;
  failedSets: string[];
}

export async function syncCardPrices(
  supabase: SupabaseClient,
  options: {
    setId?: string;
    forceRefresh?: boolean;
    onProgress?: (message: string) => void;
  } = {}
): Promise<CardPriceSyncResult> {
  const { setId, forceRefresh = false, onProgress } = options;
  const log = onProgress ?? console.log;

  const result: CardPriceSyncResult = {
    totalSets: 0,
    skippedSets: 0,
    cardsProcessed: 0,
    pricesUpdated: 0,
    historyRecorded: 0,
    detailsUpdated: 0,
    errors: 0,
    failedSets: [],
  };

  // Get distinct set IDs from the cards table
  let setIds: string[];

  if (setId) {
    setIds = [setId];
  } else {
    const { data: sets, error } = await supabase
      .from('cards')
      .select('set_id')
      .not('set_id', 'is', null);

    if (error || !sets) {
      log(`Error fetching set IDs: ${error?.message}`);
      return result;
    }

    setIds = [...new Set(sets.map((s) => s.set_id))].sort();
  }

  result.totalSets = setIds.length;
  log(`Found ${setIds.length} sets to process`);

  // Determine which sets to skip (all cards are estimate-only)
  const setsToSkip = new Set<string>();
  if (!forceRefresh && !setId) {
    for (const sid of setIds) {
      const { count: totalCount } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('set_id', sid);

      const { count: estimateCount } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('set_id', sid)
        .eq('price_source', 'estimate');

      if (totalCount != null && estimateCount != null && totalCount > 0 && estimateCount === totalCount) {
        setsToSkip.add(sid);
      }
    }
    result.skippedSets = setsToSkip.size;
    if (setsToSkip.size > 0) {
      log(`Skipping ${setsToSkip.size} estimate-only sets`);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  for (let si = 0; si < setIds.length; si++) {
    const currentSetId = setIds[si];

    if (setsToSkip.has(currentSetId)) continue;

    log(`[${si + 1}/${setIds.length}] Syncing prices for set: ${currentSetId}`);

    // Fetch card ID mapping from DB (tcg_id -> db id + rarity)
    const { data: dbCards, error: dbError } = await supabase
      .from('cards')
      .select('id, tcg_id, rarity')
      .eq('set_id', currentSetId);

    if (dbError || !dbCards) {
      log(`  Error fetching DB cards for ${currentSetId}: ${dbError?.message}`);
      result.failedSets.push(currentSetId);
      result.errors++;
      continue;
    }

    const dbCardMap = new Map(dbCards.map((c) => [c.tcg_id, { id: c.id, rarity: c.rarity }]));

    // Fetch fresh card data from TCGdex
    let apiCards;
    try {
      apiCards = await fetchCardsBySet(currentSetId);
    } catch (err) {
      log(`  Error fetching TCGdex data for ${currentSetId}: ${(err as Error).message}`);
      result.failedSets.push(currentSetId);
      result.errors++;
      continue;
    }

    // Process each card's pricing
    const cardUpdates: { id: string; price: number; price_source: string; price_trend: string | null }[] = [];
    const historyRows: { card_id: string; price: number; source: string; variant: string; recorded_at: string }[] = [];
    const detailRows: ReturnType<typeof buildPricingDetailRows> = [];

    for (const apiCard of apiCards) {
      const dbCard = dbCardMap.get(apiCard.id);
      if (!dbCard) continue;

      result.cardsProcessed++;

      const isHolo = !['Common', 'Uncommon'].includes(dbCard.rarity || '');
      const pricing = apiCard.pricing as TCGdexPricing | undefined;
      const { price, priceTrend, priceSource, priceVariant } = extractPricing(pricing, isHolo);

      if (price != null && priceSource) {
        cardUpdates.push({
          id: dbCard.id,
          price,
          price_source: priceSource,
          price_trend: priceTrend,
        });

        historyRows.push({
          card_id: dbCard.id,
          price,
          source: priceSource,
          variant: priceVariant || 'normal',
          recorded_at: today,
        });
      }

      if (pricing) {
        detailRows.push(...buildPricingDetailRows(dbCard.id, pricing));
      }
    }

    // Batch upsert card prices (update each card's price fields)
    if (cardUpdates.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < cardUpdates.length; i += batchSize) {
        const batch = cardUpdates.slice(i, i + batchSize);
        // Use individual updates since we need to match by id
        for (const update of batch) {
          const { error } = await supabase
            .from('cards')
            .update({
              price: update.price,
              price_source: update.price_source,
              price_trend: update.price_trend,
            })
            .eq('id', update.id);

          if (!error) result.pricesUpdated++;
          else result.errors++;
        }
      }
    }

    // Batch upsert price history
    if (historyRows.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < historyRows.length; i += batchSize) {
        const batch = historyRows.slice(i, i + batchSize);
        const { error, count } = await supabase
          .from('card_price_history')
          .upsert(batch, { onConflict: 'card_id,source,variant,recorded_at', count: 'exact' });

        if (!error) result.historyRecorded += count ?? batch.length;
        else result.errors++;
      }
    }

    // Batch upsert pricing details
    if (detailRows.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < detailRows.length; i += batchSize) {
        const batch = detailRows.slice(i, i + batchSize);
        const { error, count } = await supabase
          .from('card_pricing_details')
          .upsert(batch, { onConflict: 'card_id,variant', count: 'exact' });

        if (!error) result.detailsUpdated += count ?? batch.length;
        else result.errors++;
      }
    }

    log(`  ${currentSetId}: ${cardUpdates.length} prices updated, ${historyRows.length} history rows, ${detailRows.length} detail rows`);

    // Respectful delay between sets
    if (si < setIds.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return result;
}
