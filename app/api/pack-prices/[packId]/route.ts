import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getProductDetails,
  findPackProduct,
  getProductImageUrl,
  getTcgplayerProductUrl,
} from '@/lib/tcgplayer-api';
import type { PackPricing } from '@/types';

// In-memory cache with 6-hour TTL
const cache = new Map<string, { data: PackPricing | null; timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params;

  // Check cache
  const cached = cache.get(packId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const supabase = await createClient();
    const { data: pack } = await supabase
      .from('packs')
      .select('set_name, edition, tcgplayer_product_id')
      .eq('id', packId)
      .single();

    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    let pricing: PackPricing | null = null;

    if (pack.tcgplayer_product_id) {
      // Direct lookup by cached product ID
      const details = await getProductDetails(pack.tcgplayer_product_id);
      if (details) {
        pricing = {
          marketPrice: details.marketPrice,
          lowestPrice: details.lowestPrice,
          medianPrice: details.medianPrice,
          lowestPriceWithShipping: details.lowestPriceWithShipping,
          tcgplayerUrl: getTcgplayerProductUrl(details.productUrlName, details.productId),
          imageUrl: getProductImageUrl(details.productId),
        };
      }
    } else {
      // Try to find the product on TCGPlayer
      const product = await findPackProduct(pack.set_name, pack.edition);
      if (product) {
        const details = await getProductDetails(product.productId);
        if (details) {
          pricing = {
            marketPrice: details.marketPrice,
            lowestPrice: details.lowestPrice,
            medianPrice: details.medianPrice,
            lowestPriceWithShipping: details.lowestPriceWithShipping,
            tcgplayerUrl: getTcgplayerProductUrl(details.productUrlName, details.productId),
            imageUrl: getProductImageUrl(details.productId),
          };

          // Cache the product ID for future lookups
          await supabase
            .from('packs')
            .update({ tcgplayer_product_id: product.productId })
            .eq('id', packId);
        }
      }
    }

    cache.set(packId, { data: pricing, timestamp: Date.now() });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Pack pricing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pack prices' },
      { status: 500 }
    );
  }
}
