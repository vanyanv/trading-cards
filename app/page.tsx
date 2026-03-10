import { createClient } from '@/lib/supabase/server';
import { HIT_SLOT_RATES } from '@/lib/constants';
import type { Pack, Card } from '@/types';
import { FeaturedPackHub } from '@/components/FeaturedPackHub';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  const { data: packs } = await supabase
    .from('packs')
    .select('*')
    .eq('available', true)
    .order('created_at', { ascending: false });

  const { data: allCards } = await supabase
    .from('cards')
    .select('*')
    .order('rarity', { ascending: true });

  const allPacks = (packs || []) as Pack[];
  const cards = (allCards || []) as Card[];

  // Group cards by set_id
  const cardsBySet: Record<string, Card[]> = {};
  for (const card of cards) {
    if (!cardsBySet[card.set_id]) cardsBySet[card.set_id] = [];
    cardsBySet[card.set_id].push(card);
  }

  // Extract unique sets from packs
  const sets = [
    ...new Map(
      allPacks.map((p) => [p.set_id, { id: p.set_id, name: p.set_name }])
    ).values(),
  ];

  return (
    <FeaturedPackHub
      packs={allPacks}
      cardsBySet={cardsBySet}
      sets={sets}
      pullRates={HIT_SLOT_RATES}
    />
  );
}
