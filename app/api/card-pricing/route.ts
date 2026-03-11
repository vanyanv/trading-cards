import { NextResponse } from 'next/server';
import { fetchCardPricing } from '@/lib/pokemon-tcg-api';
import { createClient } from '@supabase/supabase-js';

const pricingCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('cardId');

  if (!cardId) {
    return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
  }

  // Check memory cache
  const cached = pricingCache.get(cardId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  // Try TCGdex API
  const pricing = await fetchCardPricing(cardId);

  if (pricing) {
    const response = { cardId, pricing };
    pricingCache.set(cardId, { data: response, expiresAt: Date.now() + CACHE_TTL });
    return NextResponse.json(response);
  }

  // Fallback to card_pricing_details table
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First look up card by tcg_id
    const { data: card } = await supabase
      .from('cards')
      .select('id')
      .eq('tcg_id', cardId)
      .single();

    if (card) {
      const { data: details } = await supabase
        .from('card_pricing_details')
        .select('*')
        .eq('card_id', card.id);

      if (details && details.length > 0) {
        const response = { cardId, pricing: null, details };
        pricingCache.set(cardId, { data: response, expiresAt: Date.now() + CACHE_TTL });
        return NextResponse.json(response);
      }
    }
  } catch {
    // Fallback silently
  }

  return NextResponse.json({ cardId, pricing: null, details: [] });
}
