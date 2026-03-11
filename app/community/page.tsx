import { createClient } from '@/lib/supabase/server';
import { CommunityContent } from '@/components/CommunityContent';
import type { LeaderboardEntry, PokedexLeaderboardEntry } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const supabase = await createClient();

  // Get current user (optional - for leaderboard highlight)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch both leaderboards in parallel
  const [valueRes, pokedexRes] = await Promise.all([
    supabase.rpc('get_leaderboard', { p_limit: 50 }),
    supabase.rpc('get_pokedex_leaderboard', { p_limit: 50 }),
  ]);

  const valueLeaderboard: LeaderboardEntry[] = (valueRes.data ?? []).map(
    (row: Record<string, unknown>) => ({
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
    })
  );

  const pokedexLeaderboard: PokedexLeaderboardEntry[] = (pokedexRes.data ?? []).map(
    (row: Record<string, unknown>) => ({
      rank: row.rank as number,
      user_id: row.user_id as string,
      display_name: row.display_name as string | null,
      avatar_id: row.avatar_id as string | null,
      unique_cards: row.unique_cards as number,
      sets_started: row.sets_started as number,
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Community</h1>
        <p className="mt-1 text-sm text-muted">See how you stack up against other trainers</p>
      </div>
      <CommunityContent
        valueLeaderboard={valueLeaderboard}
        pokedexLeaderboard={pokedexLeaderboard}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
