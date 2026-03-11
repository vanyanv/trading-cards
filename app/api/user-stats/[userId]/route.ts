import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Verify user exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, avatar_id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all stats in parallel
    const [statsRes, setsRes, rarityRes, recentRes, topRes, packBreakdownRes, luckRes] = await Promise.all([
      supabase.rpc('get_user_profile_stats', { p_user_id: userId }),
      supabase.rpc('get_user_set_completion', { p_user_id: userId }),
      supabase.rpc('get_user_rarity_breakdown', { p_user_id: userId }),
      supabase.rpc('get_user_recent_pulls', { p_user_id: userId, p_limit: 10 }),
      supabase.rpc('get_user_top_cards', { p_user_id: userId, p_limit: 5 }),
      supabase.rpc('get_user_pack_breakdown', { p_user_id: userId }),
      supabase.rpc('get_user_luck_stats', { p_user_id: userId }),
    ]);

    return NextResponse.json({
      profile: {
        display_name: profile.display_name,
        avatar_id: profile.avatar_id,
      },
      stats: statsRes.data,
      sets: setsRes.data ?? [],
      rarityBreakdown: rarityRes.data ?? [],
      recentPulls: recentRes.data ?? [],
      topCards: topRes.data ?? [],
      packBreakdown: packBreakdownRes.data ?? [],
      luckStats: luckRes.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
