import { createClient } from '@/lib/supabase/server';
import { CardDetailContent } from '@/components/CardDetailContent';
import type { Card, CardDetailData } from '@/types';

export const dynamic = 'force-dynamic';

const TCGDEX_BASE = 'https://api.tcgdex.net/v2/en';

async function fetchCardDetail(tcgId: string): Promise<CardDetailData | null> {
  try {
    const res = await fetch(`${TCGDEX_BASE}/cards/${tcgId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const raw = await res.json();
    return {
      pricing: raw.pricing ?? null,
      attacks: raw.attacks ?? null,
      abilities: raw.abilities ?? null,
      weaknesses: raw.weaknesses ?? null,
      resistances: raw.resistances ?? null,
      retreat: raw.retreat ?? null,
      illustrator: raw.illustrator ?? null,
      evolveFrom: raw.evolveFrom ?? null,
      stage: raw.stage ?? null,
    };
  } catch {
    return null;
  }
}

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from('cards')
    .select('*')
    .eq('id', id)
    .single();

  if (!card) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm text-muted">Card not found.</p>
      </div>
    );
  }

  const typedCard = card as Card;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ownedCount = 0;
  if (user) {
    const { count } = await supabase
      .from('user_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('card_id', id);
    ownedCount = count ?? 0;
  }

  const detail = await fetchCardDetail(typedCard.tcg_id);

  return (
    <CardDetailContent
      card={typedCard}
      detail={detail}
      ownedCount={ownedCount}
      isAuthenticated={!!user}
    />
  );
}
