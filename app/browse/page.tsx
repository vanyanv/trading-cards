import { createClient } from '@/lib/supabase/server';
import { BrowseContent } from '@/components/BrowseContent';
import { BrowsePacks } from '@/components/BrowsePacks';
import type { Card, Pack } from '@/types';

export const dynamic = 'force-dynamic';

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string }>;
}) {
  const { set } = await searchParams;
  const supabase = await createClient();

  // If a set is selected, show its cards
  if (set) {
    const { data: cards } = await supabase
      .from('cards')
      .select('*')
      .eq('set_id', set)
      .order('tcg_id');

    const allCards: Card[] = (cards || []) as Card[];

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
      <BrowseContent
        cards={allCards}
        currentSet={set}
        setName={setName}
        ownedCounts={ownedCounts}
        isLoggedIn={!!user}
      />
    );
  }

  // No set selected — show all packs
  const { data: packs } = await supabase
    .from('packs')
    .select('*')
    .eq('available', true)
    .order('set_name');

  return <BrowsePacks packs={(packs || []) as Pack[]} />;
}
