import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicProfile } from '@/components/PublicProfile';
import type { SetCompletion, UserProfileStats } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  // Check user exists
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, avatar_id')
    .eq('user_id', userId)
    .single();

  if (!profile) {
    notFound();
  }

  // Get current user to check if viewing own profile
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const isOwnProfile = currentUser?.id === userId;

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

  const stats: UserProfileStats = statsRes.data ?? {
    total_value: 0,
    unique_cards: 0,
    total_cards: 0,
    packs_opened: 0,
    sets_started: 0,
    member_since: '',
  };

  const sets: SetCompletion[] = (setsRes.data ?? []).map((s: Record<string, unknown>) => ({
    set_id: s.set_id as string,
    set_name: s.set_name as string,
    owned_count: Number(s.owned_count),
    total_count: Number(s.total_count),
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <PublicProfile
        profile={{
          display_name: profile.display_name,
          avatar_id: profile.avatar_id,
        }}
        stats={stats}
        sets={sets}
        rarityBreakdown={rarityRes.data ?? []}
        recentPulls={recentRes.data ?? []}
        topCards={topRes.data ?? []}
        packBreakdown={packBreakdownRes.data ?? []}
        luckStats={luckRes.data ?? []}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
