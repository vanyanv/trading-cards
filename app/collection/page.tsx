import { createClient } from '@/lib/supabase/server';
import { CollectionGrid } from '@/components/CollectionGrid';
import type { UserCard } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm text-muted">Please sign in to view your collection.</p>
      </div>
    );
  }

  const { data: userCards } = await supabase
    .from('user_cards')
    .select('*, card:cards(*)')
    .eq('user_id', user.id)
    .order('obtained_at', { ascending: false });

  // Reshape the joined data
  const shaped: UserCard[] = (userCards || []).map((uc) => ({
    id: uc.id,
    user_id: uc.user_id,
    card_id: uc.card_id,
    card: uc.card || undefined,
    is_reverse_holo: uc.is_reverse_holo,
    obtained_at: uc.obtained_at,
    pack_opened_from: uc.pack_opened_from,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Your Collection
        </h1>
        <p className="mt-2 text-sm text-muted">
          Every card you&apos;ve pulled from packs.
        </p>
      </div>

      <CollectionGrid userCards={shaped} />
    </div>
  );
}
