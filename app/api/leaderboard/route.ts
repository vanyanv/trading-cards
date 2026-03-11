import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LeaderboardEntry } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: 50 });

    if (error) {
      console.error('Leaderboard RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    const entries: LeaderboardEntry[] = (data ?? []).map((row: Record<string, unknown>) => ({
      rank: row.rank as number,
      user_id: row.user_id as string,
      display_name: row.display_name as string | null,
      avatar_id: row.avatar_id as string | null,
      member_since: row.member_since as string,
      unique_cards: row.unique_cards as number,
      total_cards: row.total_cards as number,
      collection_value: Number(row.collection_value),
      rarest_card: row.rarest_card_name
        ? {
            name: row.rarest_card_name as string,
            rarity: row.rarest_card_rarity as string,
            image_url: row.rarest_card_image as string,
          }
        : null,
    }));

    return NextResponse.json(entries, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
