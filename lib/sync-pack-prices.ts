import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEraFallbackPrice } from './constants';
import {
  getProductDetails,
  getProductDetailsBatch,
  findPackProduct,
  getProductImageUrl,
  isVintagePack,
} from './tcgplayer-api';
import { scrapePackSoldPrice } from './ebay-scraper';
import type { Edition } from '@/types';

interface PackRow {
  id: string;
  set_id: string;
  set_name: string;
  price_usd: number | null;
  edition: string | null;
  tcgplayer_product_id: number | null;
}

export interface SyncResult {
  total: number;
  tcgplayer: number;
  ebay: number;
  fallback: number;
  failed: number;
  skipped: number;
}

export async function syncPackPrices(
  supabase: SupabaseClient,
  options: {
    updateImages?: boolean;
    forceRefresh?: boolean;
    onProgress?: (message: string) => void;
  } = {}
): Promise<SyncResult> {
  const { updateImages = false, forceRefresh = false, onProgress } = options;
  const log = onProgress ?? (() => {});

  const result: SyncResult = {
    total: 0,
    tcgplayer: 0,
    ebay: 0,
    fallback: 0,
    failed: 0,
    skipped: 0,
  };

  // Check if new columns exist by trying to select them
  const { error: colCheck } = await supabase
    .from('packs')
    .select('tcgplayer_product_id')
    .limit(1);

  const hasNewColumns = !colCheck;

  if (!hasNewColumns) {
    log('Warning: tcgplayer_product_id column not found — run the migration first.');
    log('Proceeding without product ID caching...\n');
  }

  const selectQuery = hasNewColumns
    ? 'id, set_id, set_name, price_usd, edition, tcgplayer_product_id'
    : 'id, set_id, set_name, price_usd, edition';

  const { data: packs, error } = await supabase
    .from('packs')
    .select(selectQuery)
    .order('set_name') as { data: PackRow[] | null; error: { message: string } | null };

  if (error || !packs) {
    throw new Error(`Failed to fetch packs: ${error?.message}`);
  }

  result.total = packs.length;
  log(`Found ${packs.length} packs to price\n`);

  // Split packs into those with and without TCGPlayer product IDs
  const mapped = hasNewColumns
    ? packs.filter((p: PackRow) => p.tcgplayer_product_id != null)
    : [];
  const unmapped = hasNewColumns
    ? packs.filter((p: PackRow) => p.tcgplayer_product_id == null)
    : (packs as PackRow[]);

  // Step 1: Batch fetch pricing for already-mapped packs
  if (mapped.length > 0) {
    log(`Updating ${mapped.length} previously matched packs...`);
    const productIds = mapped.map((p: PackRow) => p.tcgplayer_product_id!);
    const detailsMap = await getProductDetailsBatch(productIds);

    for (const pack of mapped as PackRow[]) {
      const details = detailsMap.get(pack.tcgplayer_product_id!);
      const price = details?.marketPrice ?? details?.medianPrice ?? null;

      if (price != null) {
        const updateData: Record<string, unknown> = { price_usd: price };
        if (hasNewColumns) {
          updateData.price_source = 'tcgplayer';
          updateData.price_updated_at = new Date().toISOString();
        }
        if (updateImages) {
          updateData.image_url = getProductImageUrl(pack.tcgplayer_product_id!);
        }

        const { error: updateError } = await supabase
          .from('packs')
          .update(updateData)
          .eq('id', pack.id);

        if (updateError) {
          result.failed++;
          log(`  ERROR ${pack.set_name}: ${updateError.message}`);
        } else {
          result.tcgplayer++;
          const change = pack.price_usd ? ` (was $${pack.price_usd})` : '';
          const editionLabel = pack.edition ? ` [${pack.edition}]` : '';
          log(`  ${pack.set_name}${editionLabel}: $${price.toFixed(2)} [tcgplayer]${change}`);
        }
      } else if (pack.price_usd != null && !forceRefresh) {
        result.skipped++;
        log(`  ${pack.set_name}: kept $${pack.price_usd} (no TCGPlayer price)`);
      } else {
        // Try eBay as second fallback
        await new Promise((r) => setTimeout(r, 1500));
        const ebayPrice = await scrapePackSoldPrice(
          pack.set_name,
          pack.edition as 'unlimited' | '1st-edition' | 'shadowless' | null
        );

        const price = ebayPrice ?? getEraFallbackPrice(pack.set_id);
        const source = ebayPrice != null ? 'ebay' : 'estimate';
        const updateData: Record<string, unknown> = { price_usd: price };
        if (hasNewColumns) {
          updateData.price_source = source;
          updateData.price_updated_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('packs')
          .update(updateData)
          .eq('id', pack.id);

        if (updateError) {
          result.failed++;
        } else {
          if (source === 'ebay') result.ebay++;
          else result.fallback++;
          log(`  ${pack.set_name}: $${price.toFixed(2)} [${source}]`);
        }
      }
    }
  }

  // Step 2: Search TCGPlayer for unmapped packs
  if (unmapped.length > 0) {
    log(`\nSearching TCGPlayer for ${unmapped.length} unmatched packs...`);
  }

  for (const pack of unmapped as PackRow[]) {
    await new Promise((r) => setTimeout(r, 300));

    const product = await findPackProduct(
      pack.set_name,
      pack.edition as 'unlimited' | '1st-edition' | 'shadowless' | null
    );

    if (product) {
      const details = await getProductDetails(product.productId);
      const price = details?.marketPrice ?? details?.medianPrice ?? product.marketPrice;

      const updateData: Record<string, unknown> = {};
      if (hasNewColumns) {
        updateData.tcgplayer_product_id = product.productId;
        updateData.price_source = 'tcgplayer';
        updateData.price_updated_at = new Date().toISOString();
      }
      if (price != null) {
        updateData.price_usd = price;
      }
      // Only update images for packs from the hardcoded vintage mapping
      // (search results often match wrong products like "Ascended Heroes")
      if (updateImages && isVintagePack(pack.set_name, pack.edition as Edition | null)) {
        updateData.image_url = product.imageUrl;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('packs')
          .update(updateData)
          .eq('id', pack.id);

        if (updateError) {
          result.failed++;
          log(`  ERROR ${pack.set_name}: ${updateError.message}`);
        } else {
          result.tcgplayer++;
          const priceStr = price != null ? `$${price.toFixed(2)}` : 'no price';
          const editionLabel = pack.edition ? ` [${pack.edition}]` : '';
          log(`  ${pack.set_name}${editionLabel}: ${priceStr} [tcgplayer] (matched: ${product.productName})`);
        }
      }
    } else {
      // No TCGPlayer match — try eBay sold listings
      await new Promise((r) => setTimeout(r, 1500));
      const ebayPrice = await scrapePackSoldPrice(
        pack.set_name,
        pack.edition as 'unlimited' | '1st-edition' | 'shadowless' | null
      );

      const price = ebayPrice ?? getEraFallbackPrice(pack.set_id);
      const source = ebayPrice != null ? 'ebay' : 'estimate';
      const updateData: Record<string, unknown> = { price_usd: price };
      if (hasNewColumns) {
        updateData.price_source = source;
        updateData.price_updated_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('packs')
        .update(updateData)
        .eq('id', pack.id);

      if (updateError) {
        result.failed++;
      } else {
        if (source === 'ebay') result.ebay++;
        else result.fallback++;
        const editionLabel = pack.edition ? ` [${pack.edition}]` : '';
        log(`  ${pack.set_name}${editionLabel}: $${price.toFixed(2)} [${source}] (no TCGPlayer match)`);
      }
    }
  }

  return result;
}

export function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}
