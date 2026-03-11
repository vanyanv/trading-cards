import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  scrapeCardSoldListings,
  getCardEbaySearchUrl,
} from '@/lib/ebay-scraper';
import type { CardSoldListing } from '@/types';

const cache = new Map<
  string,
  { data: { sales: CardSoldListing[]; searchUrl: string }; timestamp: number }
>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

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

    // Extract card number from tcg_id (e.g., "sv8-123" -> "123")
    const cardNumber = card.tcg_id?.split('-').pop() || undefined;

    const sales = await scrapeCardSoldListings(
      card.name,
      card.set_name,
      cardNumber
    );
    const searchUrl = getCardEbaySearchUrl(
      card.name,
      card.set_name,
      cardNumber
    );

    const result = { sales, searchUrl };
    cache.set(cardId, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Card sales error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card sales' },
      { status: 500 }
    );
  }
}
