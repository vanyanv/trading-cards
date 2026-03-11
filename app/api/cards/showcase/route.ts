import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SHOWCASE_RARITIES = [
  'Rare',
  'Double Rare',
  'Illustration Rare',
  'Ultra Rare',
  'Special Illustration Rare',
  'Hyper Rare',
  'One Star',
  'Two Star',
  'Three Star',
  'Crown',
  'One Shiny',
  'Two Shiny',
];

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: cards, error } = await supabase
      .from('cards')
      .select('id, name, image_url, rarity')
      .in('rarity', SHOWCASE_RARITIES)
      .not('image_url', 'is', null)
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }

    // Shuffle and take 8 (Supabase JS client doesn't support ORDER BY random())
    const shuffled = (cards ?? [])
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);

    return NextResponse.json(
      { cards: shuffled },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}
