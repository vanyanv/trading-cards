/**
 * Sync pack prices from TCGPlayer into the packs table.
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-pack-prices.ts [--images] [--force]
 *
 * Fetches real market prices from TCGPlayer's marketplace API.
 * Falls back to era-based estimates if no TCGPlayer match is found.
 *
 * Options:
 *   --images   Also update pack image_url with TCGPlayer product images
 *   --force    Force refresh all prices, even if a valid price exists
 */

import { syncPackPrices, createSupabaseClient } from '../lib/sync-pack-prices';

async function main() {
  const args = process.argv.slice(2);
  const updateImages = args.includes('--images');
  const forceRefresh = args.includes('--force');

  console.log('Pack Price Sync (via TCGPlayer)');
  console.log('===============================\n');
  if (updateImages) console.log('  (updating images)\n');
  if (forceRefresh) console.log('  (force refresh)\n');

  const supabase = createSupabaseClient();
  const result = await syncPackPrices(supabase, {
    updateImages,
    forceRefresh,
    onProgress: (msg) => console.log(msg),
  });

  console.log(
    `\nDone! TCGPlayer: ${result.tcgplayer}, eBay: ${result.ebay}, Estimate: ${result.fallback}, Skipped: ${result.skipped}, Failed: ${result.failed}`
  );
}

main().catch(console.error);
