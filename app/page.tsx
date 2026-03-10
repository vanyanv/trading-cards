import { createClient } from '@/lib/supabase/server';
import type { Pack } from '@/types';
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

  // All packs for explore section
  const { data: allData } = await supabase
    .from('packs')
    .select('*')
    .eq('available', true)
    .order('set_name', { ascending: true });

  const trendingPacks = (trendingData || []) as Pack[];
  const allPacks = (allData || []) as Pack[];

  // Extract unique sets from all packs
  const sets = [
    ...new Map(
      allPacks.map((p) => [p.set_id, { id: p.set_id, name: p.set_name }])
    ).values(),
  ];

  return (
    <HomeContent
      trendingPacks={trendingPacks}
      allPacks={allPacks}
      sets={sets}
    />
  );
}
