import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchActiveCardListings } from '@/lib/ebay-api';
import type { EbayActiveListing } from '@/types';

const cache = new Map<
  string,
  { data: EbayActiveListing[]; timestamp: number }
>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  const cached = cache.get(cardId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const supabase = await createClient();
    const { data: card } = await supabase
      .from('cards')
      .select('name, set_name, tcg_id')
      .eq('id', cardId)
      .single();

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const cardNumber = card.tcg_id?.split('-').pop() || undefined;

    const listings = await searchActiveCardListings(
      card.name,
      card.set_name,
      cardNumber
    );

    cache.set(cardId, { data: listings, timestamp: Date.now() });

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Card listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card listings' },
      { status: 500 }
    );
  }
}
