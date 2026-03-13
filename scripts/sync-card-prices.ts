/**
 * Sync card prices from TCGdex API (TCGPlayer + Cardmarket data).
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-card-prices.ts [options]
 *
 * Refreshes market prices for all cards in the database from TCGdex.
 * Updates cards, card_price_history, and card_pricing_details tables.
 *
 * Options:
 *   --set <id>   Sync a single set (e.g. sv09)
 *   --force      Force refresh all sets (including estimate-only)
 */

import { createSupabaseClient } from '../lib/sync-pack-prices';
import { syncCardPrices } from '../lib/sync-card-prices';

async function main() {
  const args = process.argv.slice(2);
  const forceRefresh = args.includes('--force');
  const setIdx = args.indexOf('--set');
  const setId = setIdx !== -1 ? args[setIdx + 1] : undefined;

  console.log('Card Price Sync (via TCGdex)');
  console.log('============================\n');
  if (setId) console.log(`  Set: ${setId}\n`);
  if (forceRefresh) console.log('  (force refresh)\n');

  const supabase = createSupabaseClient();
  const result = await syncCardPrices(supabase, {
    setId,
    forceRefresh,
    onProgress: (msg) => console.log(msg),
  });

  console.log('\n--- Summary ---');
  console.log(`Sets: ${result.totalSets} total, ${result.skippedSets} skipped`);
  console.log(`Cards processed: ${result.cardsProcessed}`);
  console.log(`Prices updated: ${result.pricesUpdated}`);
  console.log(`History recorded: ${result.historyRecorded}`);
  console.log(`Details updated: ${result.detailsUpdated}`);
  console.log(`Errors: ${result.errors}`);
  if (result.failedSets.length > 0) {
    console.log(`Failed sets: ${result.failedSets.join(', ')}`);
  }
}

main().catch(console.error);
