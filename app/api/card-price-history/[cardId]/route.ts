import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '90', 10);
  const variant = searchParams.get('variant') || undefined;

  try {
    const supabase = await createClient();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    let query = supabase
      .from('card_price_history')
      .select('price, source, variant, recorded_at')
      .eq('card_id', cardId)
      .gte('recorded_at', cutoff.toISOString().split('T')[0])
      .order('recorded_at', { ascending: true });

    if (variant) {
      query = query.eq('variant', variant);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const points = (data || []).map((row) => ({
      date: row.recorded_at,
      price: parseFloat(row.price),
      source: row.source,
      variant: row.variant,
    }));

    return NextResponse.json(points);
  } catch (error) {
    console.error('Price history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
