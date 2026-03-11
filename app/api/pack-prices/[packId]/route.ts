import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  scrapeEbaySoldListings,
  computePackPricing,
  getEbaySearchUrl,
} from '@/lib/ebay-scraper';
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
      .select('set_name')
      .eq('id', packId)
      .single();

    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    const listings = await scrapeEbaySoldListings(pack.set_name);
    const searchUrl = getEbaySearchUrl(pack.set_name);
    const pricing = computePackPricing(listings, searchUrl);

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
