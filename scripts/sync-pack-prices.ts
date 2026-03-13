/**
 * Sync pack prices from TCGPlayer into the packs table.
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-pack-prices.ts [options]
 *
 * Fetches real market prices from TCGPlayer's marketplace API.
 * Falls back to eBay sold listings, then era-based estimates.
 *
 * Options:
 *   --images      Also update pack image_url with TCGPlayer product images
 *   --force       Force refresh all prices, even if a valid price exists
 *   --dry-run     Run all lookups but skip database writes (preview mode)
 *   --audit       Show detailed audit log with flagged entries
 *   --reset-ids   Clear all cached tcgplayer_product_id values before syncing
 *                 (forces fresh matching through expanded VINTAGE_PACK_IDS and search)
 */

import { syncPackPrices, createSupabaseClient } from '../lib/sync-pack-prices';

async function main() {
  const args = process.argv.slice(2);
  const updateImages = args.includes('--images');
  const forceRefresh = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const audit = args.includes('--audit');
  const resetIds = args.includes('--reset-ids');

  console.log('Pack Price Sync (via TCGPlayer)');
  console.log('===============================\n');
  if (updateImages) console.log('  (updating images)\n');
  if (forceRefresh) console.log('  (force refresh)\n');
  if (dryRun) console.log('  (dry run — no database writes)\n');
  if (audit) console.log('  (audit logging enabled)\n');
  if (resetIds) console.log('  (resetting cached product IDs)\n');

  const supabase = createSupabaseClient();
  const result = await syncPackPrices(supabase, {
    updateImages,
    forceRefresh,
    dryRun,
    audit,
    resetIds,
    onProgress: (msg) => console.log(msg),
  });

  console.log(
    `\nDone! TCGPlayer: ${result.tcgplayer}, eBay: ${result.ebay}, Estimate: ${result.fallback}, Skipped: ${result.skipped}, Failed: ${result.failed}, Flagged: ${result.flagged}`
  );
}

main().catch(console.error);
