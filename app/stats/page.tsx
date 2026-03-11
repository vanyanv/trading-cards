import { createClient } from '@/lib/supabase/server';
import { StatsHubContent } from '@/components/StatsHubContent';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch global stats and community data in parallel
  const [globalRes, pullStatsRes, recentPullsRes, luckRes, packBreakdownRes] = await Promise.all([
    supabase.rpc('get_global_pull_summary'),
    supabase
      .from('pull_stats')
      .select('set_id, rarity, pull_count, total_opens, slot_type')
      .in('slot_type', ['hit_slot', 'tcgp_hit_slot'])
      .order('total_opens', { ascending: false }),
    supabase
      .from('user_cards')
      .select('card:cards(name, image_url, rarity, set_name), user:user_profiles(display_name), obtained_at')
      .in('card.rarity', [
        'Rare', 'Double Rare', 'Illustration Rare', 'Ultra Rare',
        'Special Illustration Rare', 'Hyper Rare',
        'Three Diamond', 'Four Diamond', 'One Star', 'Two Star', 'Three Star', 'Crown',
      ])
      .order('obtained_at', { ascending: false })
      .limit(20),
    user ? supabase.rpc('get_user_luck_stats', { p_user_id: user.id }) : Promise.resolve({ data: null }),
    user ? supabase.rpc('get_user_pack_breakdown', { p_user_id: user.id }) : Promise.resolve({ data: null }),
  ]);

  const globalSummary = globalRes.data as { total_packs_opened: number; total_cards_pulled: number; total_users: number } | null;

  const pullStatsRaw = (pullStatsRes.data ?? []) as { set_id: string; rarity: string; pull_count: number; total_opens: number; slot_type: string }[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentPullsRaw = (recentPullsRes.data ?? []) as any[];

  // Group pull stats by set
  const setStatsMap = new Map<string, { rarity: string; pull_count: number; total_opens: number }[]>();
  for (const row of pullStatsRaw) {
    const existing = setStatsMap.get(row.set_id) ?? [];
    existing.push({ rarity: row.rarity, pull_count: row.pull_count, total_opens: row.total_opens });
    setStatsMap.set(row.set_id, existing);
  }

  // Get top sets by total opens
  const topSets = [...setStatsMap.entries()]
    .map(([setId, stats]) => ({
      setId,
      totalOpens: Math.max(...stats.map((s) => s.total_opens)),
      stats,
    }))
    .sort((a, b) => b.totalOpens - a.totalOpens)
    .slice(0, 10);

  // Filter valid recent pulls (Supabase returns joined relations as objects or arrays)
  const recentPulls = recentPullsRaw
    .filter((p) => p.card != null)
    .map((p) => {
      const card = Array.isArray(p.card) ? p.card[0] : p.card;
      const user = Array.isArray(p.user) ? p.user[0] : p.user;
      return {
        card_name: card?.name ?? '',
        card_image_url: card?.image_url ?? '',
        card_rarity: card?.rarity ?? '',
        set_name: card?.set_name ?? '',
        display_name: user?.display_name ?? 'Trainer',
        obtained_at: p.obtained_at,
      };
    })
    .filter((p) => p.card_name);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <StatsHubContent
        globalSummary={globalSummary ?? { total_packs_opened: 0, total_cards_pulled: 0, total_users: 0 }}
        topSets={topSets}
        recentPulls={recentPulls}
        userLuckStats={luckRes.data ? (luckRes.data as { rarity: string; user_count: number; user_total: number; community_rate: number }[]) : undefined}
        userPackBreakdown={packBreakdownRes.data ? (packBreakdownRes.data as { pack_id: string; pack_name: string; pack_image_url: string; set_name: string; times_opened: number }[]) : undefined}
      />
    </div>
  );
}
