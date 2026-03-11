import { createClient } from '@/lib/supabase/server';
import type { Pack, Card } from '@/types';
import { HomeContent } from '@/components/HomeContent';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  // Trending packs — top 6 by open count
  const { data: trendingData } = await supabase
    .from('packs')
    .select('*')
    .eq('available', true)
    .order('open_count', { ascending: false })
    .limit(6);

  // Featured high-rarity cards for hero background
  const { data: featuredData } = await supabase
    .from('cards')
    .select('id, name, image_url, image_url_hires, rarity')
    .in('rarity', ['Illustration Rare', 'Ultra Rare', 'Special Illustration Rare', 'Hyper Rare'])
    .limit(40);

  // Recent pulls for community feed
  const { data: recentPullsData } = await supabase
    .from('user_cards')
    .select('id, obtained_at, user_id, card:cards(id, name, image_url, rarity, set_name)')
    .order('obtained_at', { ascending: false })
    .limit(30);

  const trendingPacks = (trendingData || []) as Pack[];
  const featuredCards = (featuredData || []) as Pick<Card, 'id' | 'name' | 'image_url' | 'image_url_hires' | 'rarity'>[];

  // Shape recent pulls — filter for rare+ cards
  const rareRarities = ['Rare', 'Double Rare', 'Illustration Rare', 'Ultra Rare', 'Special Illustration Rare', 'Hyper Rare'];
  const filteredPulls = (recentPullsData || [])
    .filter((uc: Record<string, unknown>) => uc.card && rareRarities.includes((uc.card as Record<string, unknown>).rarity as string));

  // Fetch profiles for pull authors
  const userIds = [...new Set(filteredPulls.map((uc: Record<string, unknown>) => uc.user_id as string))];
  const { data: profilesData } = userIds.length > 0
    ? await supabase.from('user_profiles').select('user_id, display_name, avatar_id').in('user_id', userIds)
    : { data: [] };
  const profileMap = new Map((profilesData || []).map((p: Record<string, unknown>) => [p.user_id as string, p as { display_name: string | null; avatar_id: string | null }]));

  const recentPulls = filteredPulls.map((uc: Record<string, unknown>) => ({
    id: uc.id as string,
    obtained_at: uc.obtained_at as string,
    card: uc.card as Pick<Card, 'id' | 'name' | 'image_url' | 'rarity' | 'set_name'>,
    profile: profileMap.get(uc.user_id as string) ?? null,
  }));

  return (
    <HomeContent
      trendingPacks={trendingPacks}
      featuredCards={featuredCards}
      recentPulls={recentPulls}
    />
  );
}
