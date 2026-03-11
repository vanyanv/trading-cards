import { createClient } from '@/lib/supabase/server';
import { getEffectiveRates } from '@/lib/pull-rate-engine';
import { PackDetail } from '@/components/PackDetail';
import type { Pack, Card, Rarity } from '@/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PackDetailPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const supabase = await createClient();

  const { data: pack } = await supabase
    .from('packs')
    .select('*')
    .eq('id', packId)
    .single();

  if (!pack) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-6">
        <p className="text-lg font-semibold">Pack not found</p>
        <p className="mt-1 text-sm text-muted">This pack may no longer be available.</p>
        <Link
          href="/"
          className="mt-6 rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          Back to packs
        </Link>
      </div>
    );
  }

  const typedPack = pack as Pack;

  let cardsQuery = supabase
    .from('cards')
    .select('*')
    .eq('set_id', typedPack.set_id)
    .order('rarity', { ascending: true });

  // For TCGP boosters, filter to cards in this booster
  if (typedPack.booster_id) {
    cardsQuery = cardsQuery.contains('booster_ids', [typedPack.booster_id]);
  }

  const { data: cards } = await cardsQuery;

  // Fetch sibling edition variants for the same set
  let editionVariants: Pack[] = [];
  if (typedPack.edition) {
    let siblingsQuery = supabase
      .from('packs')
      .select('*')
      .eq('set_id', typedPack.set_id)
      .eq('available', true)
      .not('edition', 'is', null);

    if (typedPack.booster_id) {
      siblingsQuery = siblingsQuery.eq('booster_id', typedPack.booster_id);
    }

    const { data: siblings } = await siblingsQuery;
    editionVariants = (siblings || []) as Pack[];
  }

  const { data: { user } } = await supabase.auth.getUser();

  const isTCGP = typedPack.cards_per_pack === 5;
  const typedCards = (cards || []) as Card[];
  const slotType = isTCGP ? 'tcgp_hit_slot' : 'hit_slot';

  // Fetch Bayesian-adjusted rates and observed stats in parallel
  const [bayesianRates, observedRes] = await Promise.all([
    getEffectiveRates(supabase, typedPack.set_id, slotType as 'hit_slot' | 'reverse_holo' | 'tcgp_hit_slot'),
    supabase.rpc('get_pack_pull_stats', { p_set_id: typedPack.set_id, p_slot_type: slotType }),
  ]);

  // Filter to rarities present in this set and normalize to 100%
  const setRarities = new Set(typedCards.map((c) => c.rarity as Rarity));
  const filtered = bayesianRates.filter((r) => setRarities.has(r.rarity));
  const ratesForNorm = filtered.length > 0 ? filtered : bayesianRates;
  const totalWeight = ratesForNorm.reduce((s, r) => s + r.weight, 0);
  const pullRates = ratesForNorm.map((r) => ({
    ...r,
    weight: parseFloat(((r.weight / totalWeight) * 100).toFixed(1)),
  }));

  const observedStats = (observedRes.data ?? []) as { rarity: string; pull_count: number; total_opens: number }[];

  return (
    <PackDetail
      pack={typedPack}
      cards={typedCards}
      pullRates={pullRates}
      observedStats={observedStats}
      isTCGP={isTCGP}
      isAuthenticated={!!user}
      editionVariants={editionVariants}
    />
  );
}
