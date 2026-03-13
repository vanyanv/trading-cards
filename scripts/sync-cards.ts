/**
 * Sync cards from TCGdex API into Supabase.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/sync-cards.ts
 *   npx tsx --env-file=.env.local scripts/sync-cards.ts --set sv09
 *
 * Auto-discovers booster expansion sets from TCGdex and syncs cards,
 * prices, and pack entries. Prints a summary report at the end.
 */

import { createClient } from '@supabase/supabase-js';
import {
  fetchBoosterSetIds,
  fetchCard,
  fetchCardsBySet,
  fetchSetDetail,
  fetchSerieLogoUrl,
  fetchSetSerieId,
  fetchSets,
  type TCGCard,
} from '../lib/pokemon-tcg-api';
import { getEraFallbackPrice, RARITY_ESTIMATE_PRICES } from '../lib/constants';
import { FIRST_EDITION_SET_IDS, SHADOWLESS_SET_IDS } from '../lib/constants';
import { Rarity, type Edition } from '../types';
import { extractPricing, buildPricingDetailRows } from '../lib/card-pricing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// --- CLI argument parsing ---

function parseArgs(): { setId?: string } {
  const args = process.argv.slice(2);
  const setIdx = args.indexOf('--set');
  if (setIdx !== -1 && args[setIdx + 1]) {
    return { setId: args[setIdx + 1] };
  }
  return {};
}

// --- Sync report ---

interface SetStats {
  setName: string;
  cardCount: number;
  apiPriced: number;
  estimateCount: number;
  noPriceCount: number;
}

interface SyncReport {
  startTime: Date;
  setsDiscovered: number;
  newSets: string[];
  cardsInserted: number;
  cardsUpdated: number;
  cardErrors: number;
  cardsWithApiPrice: number;
  cardsWithEstimatePrice: number;
  cardsWithNoPrice: number;
  priceHistoryRecorded: number;
  setStats: Map<string, SetStats>;
  failedSets: string[];
}

function createReport(): SyncReport {
  return {
    startTime: new Date(),
    setsDiscovered: 0,
    newSets: [],
    cardsInserted: 0,
    cardsUpdated: 0,
    cardErrors: 0,
    cardsWithApiPrice: 0,
    cardsWithEstimatePrice: 0,
    cardsWithNoPrice: 0,
    priceHistoryRecorded: 0,
    setStats: new Map(),
    failedSets: [],
  };
}

function printReport(report: SyncReport) {
  const duration = Date.now() - report.startTime.getTime();
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);

  const totalCards = report.cardsWithApiPrice + report.cardsWithEstimatePrice + report.cardsWithNoPrice;
  const apiPct = totalCards > 0 ? ((report.cardsWithApiPrice / totalCards) * 100).toFixed(1) : '0';
  const estPct = totalCards > 0 ? ((report.cardsWithEstimatePrice / totalCards) * 100).toFixed(1) : '0';
  const noPct = totalCards > 0 ? ((report.cardsWithNoPrice / totalCards) * 100).toFixed(1) : '0';

  console.log('\n=== SYNC SUMMARY ===');
  console.log(`Duration: ${minutes}m ${seconds}s`);
  console.log(`Sets discovered: ${report.setsDiscovered}${report.newSets.length > 0 ? ` (${report.newSets.length} new: ${report.newSets.join(', ')})` : ''}`);
  console.log(`Cards: ${totalCards.toLocaleString()} (${report.cardsInserted.toLocaleString()} inserted/updated, ${report.cardErrors} errors)`);
  console.log(`Pricing coverage:`);
  console.log(`  API price:      ${report.cardsWithApiPrice.toLocaleString()} (${apiPct}%)`);
  console.log(`  Estimate:       ${report.cardsWithEstimatePrice.toLocaleString()} (${estPct}%)`);
  console.log(`  No price:       ${report.cardsWithNoPrice.toLocaleString()} (${noPct}%)`);
  console.log(`Price history:    ${report.priceHistoryRecorded.toLocaleString()} entries recorded`);

  // Sets needing attention (>50% estimate pricing)
  const attentionSets: string[] = [];
  for (const [setId, stats] of report.setStats) {
    if (stats.cardCount > 0 && stats.estimateCount / stats.cardCount > 0.5) {
      const pct = ((stats.estimateCount / stats.cardCount) * 100).toFixed(1);
      attentionSets.push(`  ${setId} (${stats.setName}): ${stats.estimateCount}/${stats.cardCount} estimate (${pct}%)`);
    }
  }

  if (attentionSets.length > 0) {
    console.log(`\nSets needing attention (>50% estimate pricing):`);
    attentionSets.forEach((s) => console.log(s));
  }

  console.log(`\nFailed sets: ${report.failedSets.length > 0 ? report.failedSets.join(', ') : 'none'}`);
}

// --- Rarity mapping ---

function mapRarity(
  apiRarity: string | undefined,
  variants?: { holo?: boolean; normal?: boolean },
): Rarity {
  if (!apiRarity || apiRarity === 'None') return Rarity.Common;

  // Holo-only rares (WotC era chase cards like Charizard, Blastoise)
  // These are "Rare" in the API but only exist as holos — map to DoubleRare
  if (
    (apiRarity === 'Rare' || apiRarity === 'Holo Rare' || apiRarity === 'Rare Holo') &&
    variants?.holo === true &&
    variants?.normal === false
  ) {
    return Rarity.DoubleRare;
  }

  const mapping: Record<string, Rarity> = {
    Common: Rarity.Common,
    Uncommon: Rarity.Uncommon,
    Rare: Rarity.Rare,
    'Double rare': Rarity.DoubleRare,
    'Illustration rare': Rarity.IllustrationRare,
    'Ultra Rare': Rarity.UltraRare,
    'Special illustration rare': Rarity.SpecialIllustrationRare,
    'Hyper rare': Rarity.HyperRare,
    // Holo rares (non-exclusive holos — normal variant also exists)
    'Holo Rare': Rarity.Rare,
    'Rare Holo': Rarity.Rare,
    // V/VMAX/VSTAR era
    'Holo Rare V': Rarity.DoubleRare,
    'Holo Rare VMAX': Rarity.DoubleRare,
    'Holo Rare VSTAR': Rarity.DoubleRare,
    // Older era ultra rares
    'Rare Holo LV.X': Rarity.UltraRare,
    'Rare PRIME': Rarity.UltraRare,
    'LEGEND': Rarity.UltraRare,
    // SWSH era special rarities
    'Amazing Rare': Rarity.UltraRare,
    'Radiant Rare': Rarity.UltraRare,
    // Secret/hyper tier
    'Secret Rare': Rarity.HyperRare,
    'Shiny Ultra Rare': Rarity.HyperRare,
    'Crown': Rarity.HyperRare,
    'Mega Hyper Rare': Rarity.HyperRare,
    // Shiny vault
    'Shiny rare': Rarity.UltraRare,
    'Shiny rare V': Rarity.UltraRare,
    'Shiny rare VMAX': Rarity.UltraRare,
    // Other
    'ACE SPEC Rare': Rarity.UltraRare,
    'Full Art Trainer': Rarity.UltraRare,
    'Classic Collection': Rarity.Rare,
    'Black White Rare': Rarity.Rare,
  };

  const mapped = mapping[apiRarity];
  if (!mapped) {
    console.warn(`  Unknown rarity: "${apiRarity}" — defaulting to Rare`);
    return Rarity.Rare;
  }
  return mapped;
}

// Pricing extraction imported from lib/card-pricing.ts

// --- Serie logo cache (deduplicate API calls across sets in the same serie) ---

const serieLogoCache = new Map<string, string | null>();

// --- Edition config ---

const EDITION_PRICE_MULTIPLIERS: Record<Edition, number> = {
  '1st-edition': 5.0,
  'shadowless': 3.0,
  'unlimited': 1.0,
};

// --- Set sync ---

async function syncSet(setId: string, report: SyncReport) {
  console.log(`\nSyncing set: ${setId}...`);

  const cards = await fetchCardsBySet(setId);
  console.log(`  Found ${cards.length} cards`);

  let inserted = 0;
  let errors = 0;
  let apiPriced = 0;
  let noPriced = 0;
  let historyRecorded = 0;
  const today = new Date().toISOString().split('T')[0];

  for (const card of cards) {
    const rarity = mapRarity(card.rarity, card.variants);
    const isHolo = rarity !== Rarity.Common && rarity !== Rarity.Uncommon;

    // Build subtypes from stage + suffix (e.g. ["Stage 1", "V"])
    const subtypes: string[] = [];
    if (card.stage) subtypes.push(card.stage);
    if (card.suffix) subtypes.push(card.suffix);

    // Extract best available price from TCGdex pricing (improved fallback chain)
    const { price, priceTrend, priceSource, priceVariant } = extractPricing(card.pricing, isHolo);

    if (price != null) apiPriced++;
    else noPriced++;

    // Upsert card and get back the DB id for price history
    const setSymbolUrl = card.set.symbol ? `${card.set.symbol}.webp` : null;
    const { data: upsertData, error } = await supabase.from('cards').upsert(
      {
        name: card.name,
        image_url: card.image ? `${card.image}/low.webp` : '',
        image_url_hires: card.image ? `${card.image}/high.webp` : '',
        rarity,
        set_id: card.set.id,
        set_name: card.set.name,
        hp: card.hp ? String(card.hp) : null,
        types: card.types || [],
        subtypes,
        supertype: card.category,
        tcg_id: card.id,
        price,
        price_trend: priceTrend,
        price_source: priceSource,
        variants: card.variants || null,
        set_symbol_url: setSymbolUrl,
      },
      { onConflict: 'tcg_id' }
    ).select('id').single();

    if (error) {
      console.error(`  Error inserting ${card.name}:`, error.message);
      errors++;
      continue;
    }

    inserted++;

    // Record price history for cards with API pricing
    if (price != null && priceSource && upsertData?.id) {
      const { error: histError } = await supabase
        .from('card_price_history')
        .upsert(
          {
            card_id: upsertData.id,
            price,
            source: priceSource,
            variant: priceVariant || 'normal',
            recorded_at: today,
          },
          { onConflict: 'card_id,source,variant,recorded_at' }
        );

      if (!histError) historyRecorded++;
    }
  }

  console.log(`  Inserted/updated: ${inserted}, Errors: ${errors}, API priced: ${apiPriced}`);

  // Update report stats
  report.cardsInserted += inserted;
  report.cardErrors += errors;
  report.cardsWithApiPrice += apiPriced;
  report.cardsWithNoPrice += noPriced;
  report.priceHistoryRecorded += historyRecorded;

  // Create pack entry/entries for this set
  if (cards.length > 0) {
    const set = cards[0].set;
    let releaseDate: string | null = null;
    try {
      const fullSet = await fetchSetDetail(setId);
      releaseDate = fullSet.releaseDate || null;
    } catch (err) {
      console.warn(`  Could not fetch set detail for release date: ${(err as Error).message}`);
    }
    const basePrice = getEraFallbackPrice(set.id);
    const imageUrl = set.logo ? `${set.logo}.webp` : '';
    const setSymbolUrl = set.symbol ? `${set.symbol}.webp` : null;

    // Fetch serie logo (deduplicated via cache)
    let serieLogoUrl: string | null = null;
    if (!serieLogoCache.has(set.id)) {
      const serieId = await fetchSetSerieId(set.id);
      if (serieId) {
        if (serieLogoCache.has(serieId)) {
          serieLogoUrl = serieLogoCache.get(serieId)!;
        } else {
          serieLogoUrl = await fetchSerieLogoUrl(serieId);
          serieLogoCache.set(serieId, serieLogoUrl);
        }
      }
      serieLogoCache.set(set.id, serieLogoUrl);
    } else {
      serieLogoUrl = serieLogoCache.get(set.id)!;
    }

    if (FIRST_EDITION_SET_IDS.includes(set.id)) {
      // Vintage set: create edition variant packs
      const editions: Edition[] = ['1st-edition', 'unlimited'];
      if (SHADOWLESS_SET_IDS.includes(set.id)) {
        editions.push('shadowless');
      }

      for (const edition of editions) {
        const editionLabel =
          edition === '1st-edition' ? '1st Edition' :
          edition === 'shadowless' ? 'Shadowless' : 'Unlimited';
        const packPrice = parseFloat((basePrice * EDITION_PRICE_MULTIPLIERS[edition]).toFixed(2));

        // Use select-then-upsert since composite unique index uses partial indexes
        const { data: existing } = await supabase
          .from('packs')
          .select('id')
          .eq('set_id', set.id)
          .eq('edition', edition)
          .is('booster_id', null)
          .maybeSingle();

        let packError;
        if (existing) {
          // Update metadata only — don't overwrite price_usd from dedicated price sync
          ({ error: packError } = await supabase.from('packs').update({
            name: `${set.name} — ${editionLabel}`,
            description: `${editionLabel} booster pack from the ${set.name} set`,
            image_url: imageUrl,
            cards_per_pack: 10,
            set_id: set.id,
            set_name: set.name,
            edition,
            available: true,
            release_date: releaseDate,
            set_symbol_url: setSymbolUrl,
            serie_logo_url: serieLogoUrl,
          }).eq('id', existing.id));
        } else {
          ({ error: packError } = await supabase.from('packs').insert({
            name: `${set.name} — ${editionLabel}`,
            description: `${editionLabel} booster pack from the ${set.name} set`,
            price_usd: packPrice,
            image_url: imageUrl,
            cards_per_pack: 10,
            set_id: set.id,
            set_name: set.name,
            edition,
            available: true,
            release_date: releaseDate,
            set_symbol_url: setSymbolUrl,
            serie_logo_url: serieLogoUrl,
          }));
        }

        if (packError) {
          console.error(`  Error creating ${editionLabel} pack for ${set.name}:`, packError.message);
        } else {
          console.log(`  Pack ${existing ? 'updated' : 'created'}: ${set.name} — ${editionLabel}${existing ? '' : ` ($${packPrice})`}`);
        }
      }
    } else {
      // Modern set: single pack, no edition
      const { data: existingModern } = await supabase
        .from('packs')
        .select('id')
        .eq('set_id', set.id)
        .is('booster_id', null)
        .is('edition', null)
        .maybeSingle();

      let packError;
      if (existingModern) {
        // Update metadata only — don't overwrite price_usd from dedicated price sync
        ({ error: packError } = await supabase.from('packs').update({
          name: set.name,
          description: `Booster pack from the ${set.name} set`,
          image_url: imageUrl,
          cards_per_pack: 10,
          set_name: set.name,
          available: true,
          release_date: releaseDate,
          set_symbol_url: setSymbolUrl,
          serie_logo_url: serieLogoUrl,
        }).eq('id', existingModern.id));
      } else {
        ({ error: packError } = await supabase.from('packs').insert({
          name: set.name,
          description: `Booster pack from the ${set.name} set`,
          price_usd: basePrice,
          image_url: imageUrl,
          cards_per_pack: 10,
          set_id: set.id,
          set_name: set.name,
          available: true,
          release_date: releaseDate,
          set_symbol_url: setSymbolUrl,
          serie_logo_url: serieLogoUrl,
        }));
      }

      if (packError) {
        console.error(`  Error creating pack for ${set.name}:`, packError.message);
      } else {
        console.log(`  Pack created for ${set.name}`);
      }
    }

    // Record set stats for the report
    report.setStats.set(setId, {
      setName: cards[0].set.name,
      cardCount: cards.length,
      apiPriced,
      estimateCount: 0, // Will be updated after fallback pass
      noPriceCount: noPriced,
    });
  }
}

// --- Main ---

async function main() {
  const { setId: targetSetId } = parseArgs();
  const report = createReport();

  console.log('Pokemon TCG Card Sync (via TCGdex)');
  console.log('===================================');

  // Determine which sets to sync
  let targetSetIds: string[];

  if (targetSetId) {
    console.log(`\nSingle-set mode: syncing ${targetSetId}`);
    targetSetIds = [targetSetId];
  } else {
    console.log('\nDiscovering booster sets...');
    targetSetIds = await fetchBoosterSetIds();
    report.setsDiscovered = targetSetIds.length;

    // Check for new sets not yet in DB
    const { data: existingPacks } = await supabase
      .from('packs')
      .select('set_id')
      .is('booster_id', null);

    if (existingPacks) {
      const existingSetIds = new Set(existingPacks.map((p) => p.set_id));
      report.newSets = targetSetIds.filter((id) => !existingSetIds.has(id));
      if (report.newSets.length > 0) {
        console.log(`  New sets found: ${report.newSets.join(', ')}`);
      }
    }
  }

  console.log(`\nSyncing ${targetSetIds.length} sets...`);

  const failedSets: string[] = [];
  for (const setId of targetSetIds) {
    try {
      await syncSet(setId, report);
    } catch (err) {
      console.error(`  FAILED to sync ${setId}:`, (err as Error).message);
      failedSets.push(setId);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (failedSets.length > 0) {
    console.log(`\nRetrying ${failedSets.length} failed sets...`);
    for (const setId of failedSets) {
      try {
        await new Promise((r) => setTimeout(r, 2000));
        await syncSet(setId, report);
        // Remove from failed if retry succeeds
        const idx = failedSets.indexOf(setId);
        if (idx !== -1) failedSets.splice(idx, 1);
      } catch (err) {
        console.error(`  RETRY FAILED for ${setId}:`, (err as Error).message);
      }
    }
  }
  report.failedSets = failedSets;

  // Fallback pass: assign estimate prices to cards missing API pricing
  console.log('\nApplying fallback prices for cards without API data...');
  let totalEstimated = 0;
  for (const [rarity, estimatePrice] of Object.entries(RARITY_ESTIMATE_PRICES)) {
    const { count, error } = await supabase
      .from('cards')
      .update({
        price: estimatePrice,
        price_source: 'estimate',
        price_trend: 'stable',
      })
      .is('price', null)
      .eq('rarity', rarity);

    if (error) {
      console.error(`  Error updating ${rarity} fallback:`, error.message);
    } else {
      const updated = count ?? 0;
      totalEstimated += updated;
      console.log(`  ${rarity}: ${updated} cards set to $${estimatePrice.toFixed(2)}`);
    }
  }

  // Move "no price" cards to "estimate" in the report
  report.cardsWithEstimatePrice = totalEstimated;
  report.cardsWithNoPrice = Math.max(0, report.cardsWithNoPrice - totalEstimated);

  // Detailed pricing pass: write per-variant pricing to card_pricing_details
  console.log('\nSyncing detailed per-variant pricing...');
  const { data: allCards } = await supabase
    .from('cards')
    .select('id, tcg_id')
    .in('set_id', targetSetIds)
    .not('price_source', 'eq', 'estimate')
    .not('price', 'is', null);

  if (allCards && allCards.length > 0) {
    let detailCount = 0;
    const detailBatchSize = 5;

    for (let i = 0; i < allCards.length; i += detailBatchSize) {
      const batch = allCards.slice(i, i + detailBatchSize);
      const detailResults = await Promise.all(
        batch.map(async (card) => {
          try {
            const tcgCard = await fetchCard(card.tcg_id);
            return { cardId: card.id, pricing: tcgCard.pricing };
          } catch {
            return { cardId: card.id, pricing: null };
          }
        })
      );

      for (const { cardId, pricing } of detailResults) {
        if (!pricing) continue;

        const rows = buildPricingDetailRows(cardId, pricing);
        for (const row of rows) {
          const { error } = await supabase
            .from('card_pricing_details')
            .upsert(row, { onConflict: 'card_id,variant' });

          if (!error) detailCount++;
        }
      }

      if (i + detailBatchSize < allCards.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.log(`  Synced ${detailCount} pricing detail rows`);
  }

  printReport(report);
}

main().catch(console.error);
