import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEraFallbackPrice } from './constants';
import {
  getProductDetails,
  getProductDetailsBatch,
  findPackProduct,
  getProductImageUrl,
  isVintagePack,
} from './tcgplayer-api';
import { searchSoldPackListings } from './ebay-api';
import { SyncAuditLog, AuditEntry, computeFlags } from './sync-audit';
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
  flagged: number;
  auditLog?: AuditEntry[];
}

export async function syncPackPrices(
  supabase: SupabaseClient,
  options: {
    updateImages?: boolean;
    forceRefresh?: boolean;
    dryRun?: boolean;
    audit?: boolean;
    resetIds?: boolean;
    onProgress?: (message: string) => void;
  } = {}
): Promise<SyncResult> {
  const {
    updateImages = false,
    forceRefresh = false,
    dryRun = false,
    audit = false,
    resetIds = false,
    onProgress,
  } = options;
  const log = onProgress ?? (() => {});
  const auditLog = new SyncAuditLog();
  const prefix = dryRun ? '[DRY RUN] ' : '';

  const result: SyncResult = {
    total: 0,
    tcgplayer: 0,
    ebay: 0,
    fallback: 0,
    failed: 0,
    skipped: 0,
    flagged: 0,
  };

  if (dryRun) {
    log('=== DRY RUN MODE — no database writes ===\n');
  }

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
  log(`${prefix}Found ${packs.length} packs to price\n`);

  // Reset cached product IDs so all packs go through fresh matching
  if (resetIds && hasNewColumns && !dryRun) {
    const { error: resetError } = await supabase
      .from('packs')
      .update({ tcgplayer_product_id: null })
      .not('tcgplayer_product_id', 'is', null);

    if (resetError) {
      log(`Warning: failed to reset product IDs: ${resetError.message}`);
    } else {
      log(`Reset all cached tcgplayer_product_id values\n`);
      // Clear local values so they all go through unmapped path
      for (const pack of packs as PackRow[]) {
        pack.tcgplayer_product_id = null;
      }
    }
  }

  // Split packs into those with and without TCGPlayer product IDs
  const mapped = hasNewColumns
    ? packs.filter((p: PackRow) => p.tcgplayer_product_id != null)
    : [];
  const unmapped = hasNewColumns
    ? packs.filter((p: PackRow) => p.tcgplayer_product_id == null)
    : (packs as PackRow[]);

  // Helper: create and record an audit entry
  function recordAudit(
    pack: PackRow,
    source: AuditEntry['source'],
    price: number | null,
    extra: {
      confidence?: number | null;
      matchedProductName?: string | null;
      matchedProductId?: number | null;
      ebayListingsUsed?: number | null;
    } = {}
  ): AuditEntry {
    const entry: AuditEntry = {
      packId: pack.id,
      setName: pack.set_name,
      edition: pack.edition,
      source,
      price,
      previousPrice: pack.price_usd,
      confidence: extra.confidence ?? null,
      matchedProductName: extra.matchedProductName ?? null,
      matchedProductId: extra.matchedProductId ?? null,
      ebayListingsUsed: extra.ebayListingsUsed ?? null,
      flags: [],
      timestamp: new Date().toISOString(),
    };
    entry.flags = computeFlags(entry);
    auditLog.add(entry);
    return entry;
  }

  // Helper: perform database update (skipped in dry-run)
  async function updatePack(
    packId: string,
    updateData: Record<string, unknown>
  ): Promise<{ error: { message: string } | null }> {
    if (dryRun) return { error: null };
    return supabase.from('packs').update(updateData).eq('id', packId);
  }

  // Step 1: Batch fetch pricing for already-mapped packs
  if (mapped.length > 0) {
    log(`${prefix}Updating ${mapped.length} previously matched packs...`);
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

        const { error: updateError } = await updatePack(pack.id, updateData);

        if (updateError) {
          result.failed++;
          log(`  ${prefix}ERROR ${pack.set_name}: ${updateError.message}`);
        } else {
          result.tcgplayer++;
          const change = pack.price_usd ? ` (was $${pack.price_usd})` : '';
          const editionLabel = pack.edition ? ` [${pack.edition}]` : '';
          log(`  ${prefix}${pack.set_name}${editionLabel}: $${price.toFixed(2)} [tcgplayer]${change}`);
        }

        recordAudit(pack, 'tcgplayer', price, {
          matchedProductName: details?.productName,
          matchedProductId: pack.tcgplayer_product_id,
          confidence: 1.0,
        });
      } else if (pack.price_usd != null && !forceRefresh) {
        result.skipped++;
        log(`  ${prefix}${pack.set_name}: kept $${pack.price_usd} (no TCGPlayer price)`);
        recordAudit(pack, 'skipped', pack.price_usd);
      } else {
        // Try eBay as second fallback
        await new Promise((r) => setTimeout(r, 1500));
        const ebayResult = await searchSoldPackListings(
          pack.set_name,
          pack.edition as Edition | null
        );

        const finalPrice = ebayResult?.price ?? getEraFallbackPrice(pack.set_id);
        const source = ebayResult != null ? 'ebay' : 'estimate';
        const updateData: Record<string, unknown> = { price_usd: finalPrice };
        if (hasNewColumns) {
          updateData.price_source = source;
          updateData.price_updated_at = new Date().toISOString();
        }

        const { error: updateError } = await updatePack(pack.id, updateData);

        if (updateError) {
          result.failed++;
        } else {
          if (source === 'ebay') result.ebay++;
          else result.fallback++;
          log(`  ${prefix}${pack.set_name}: $${finalPrice.toFixed(2)} [${source}]`);
        }

        recordAudit(pack, source as AuditEntry['source'], finalPrice, {
          ebayListingsUsed: ebayResult?.listingsUsed ?? null,
        });
      }
    }
  }

  // Step 2: Search TCGPlayer for unmapped packs
  if (unmapped.length > 0) {
    log(`\n${prefix}Searching TCGPlayer for ${unmapped.length} unmatched packs...`);
  }

  for (const pack of unmapped as PackRow[]) {
    await new Promise((r) => setTimeout(r, 300));

    const match = await findPackProduct(
      pack.set_name,
      pack.edition as Edition | null
    );

    if (match) {
      const { result: product, confidence } = match;
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
      if (updateImages && isVintagePack(pack.set_name, pack.edition as Edition | null)) {
        updateData.image_url = product.imageUrl;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await updatePack(pack.id, updateData);

        if (updateError) {
          result.failed++;
          log(`  ${prefix}ERROR ${pack.set_name}: ${updateError.message}`);
        } else {
          result.tcgplayer++;
          const priceStr = price != null ? `$${price.toFixed(2)}` : 'no price';
          const editionLabel = pack.edition ? ` [${pack.edition}]` : '';
          const confStr = confidence < 1.0 ? ` (confidence: ${confidence.toFixed(2)})` : '';
          log(`  ${prefix}${pack.set_name}${editionLabel}: ${priceStr} [tcgplayer] (matched: ${product.productName})${confStr}`);
        }
      }

      recordAudit(pack, 'tcgplayer', price, {
        confidence,
        matchedProductName: product.productName,
        matchedProductId: product.productId,
      });
    } else {
      // No TCGPlayer match — try eBay sold listings
      await new Promise((r) => setTimeout(r, 1500));
      const ebayResult = await searchSoldPackListings(
        pack.set_name,
        pack.edition as Edition | null
      );

      const finalPrice = ebayResult?.price ?? getEraFallbackPrice(pack.set_id);
      const source = ebayResult != null ? 'ebay' : 'estimate';
      const updateData: Record<string, unknown> = { price_usd: finalPrice };
      if (hasNewColumns) {
        updateData.price_source = source;
        updateData.price_updated_at = new Date().toISOString();
      }

      const { error: updateError } = await updatePack(pack.id, updateData);

      if (updateError) {
        result.failed++;
      } else {
        if (source === 'ebay') result.ebay++;
        else result.fallback++;
        const editionLabel = pack.edition ? ` [${pack.edition}]` : '';
        log(`  ${prefix}${pack.set_name}${editionLabel}: $${finalPrice.toFixed(2)} [${source}] (no TCGPlayer match)`);
      }

      recordAudit(pack, source as AuditEntry['source'], finalPrice, {
        ebayListingsUsed: ebayResult?.listingsUsed ?? null,
      });
    }
  }

  // Print audit summary
  if (audit || dryRun) {
    const summary = auditLog.getSummary();
    log(`\n${prefix}Audit: ${summary.total} packs processed, ${summary.flagged} flagged`);
    log(`  Sources: ${Object.entries(summary.bySource).map(([k, v]) => `${k}=${v}`).join(', ')}`);
    auditLog.printFlagged(log);
    result.auditLog = auditLog.getAll();
  }
  result.flagged = auditLog.getFlagged().length;

  return result;
}

export function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}
