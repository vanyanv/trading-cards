import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/server';
import { BrowseContent } from '@/components/BrowseContent';
import { BrowsePacks } from '@/components/BrowsePacks';
import { makeQueryClient } from '@/lib/query/queryClient';
import { queryKeys } from '@/lib/query/queryKeys';
import type { Card, Pack } from '@/types';

export const revalidate = 60;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string }>;
}) {
  const { set } = await searchParams;
  const supabase = await createClient();
  const queryClient = makeQueryClient();

  // If a set is selected, show its cards
  if (set) {
    const { data: cards } = await supabase
      .from('cards')
      .select('*')
      .eq('set_id', set)
      .order('tcg_id');

    const allCards: Card[] = (cards || []) as Card[];

    // Seed the React Query cache for client-side reuse
    queryClient.setQueryData(queryKeys.cards.bySet(set), allCards);

    // Get set info from first card
    const setName = allCards[0]?.set_name || set;

    // Get owned card counts if user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let ownedCounts: Record<string, number> = {};
    if (user) {
      const { data: userCards } = await supabase
        .from('user_cards')
        .select('card_id')
        .eq('user_id', user.id);

      if (userCards) {
        for (const uc of userCards) {
          ownedCounts[uc.card_id] = (ownedCounts[uc.card_id] || 0) + 1;
        }
      }
    }

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BrowseContent
          cards={allCards}
          currentSet={set}
          setName={setName}
          ownedCounts={ownedCounts}
          isLoggedIn={!!user}
        />
      </HydrationBoundary>
    );
  }

  // No set selected — show all packs
  const { data: packs } = await supabase
    .from('packs')
    .select('*')
    .eq('available', true)
    .order('set_name');

  const allPacks = (packs || []) as Pack[];
  queryClient.setQueryData(queryKeys.packs.available, allPacks);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BrowsePacks packs={allPacks} />
    </HydrationBoundary>
  );
}
