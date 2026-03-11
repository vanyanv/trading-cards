import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CollectionGrid } from '@/components/CollectionGrid';
import { UnopenedPacksSection } from '@/components/UnopenedPacksSection';
import type { UserCard, UnopenedPack } from '@/types';

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

  const [{ data: userCards }, { data: unopenedPacks }] = await Promise.all([
    supabase
      .from('user_cards')
      .select('*, card:cards(*)')
      .eq('user_id', user.id)
      .order('obtained_at', { ascending: false }),
    supabase
      .from('unopened_packs')
      .select('id, pack_id, purchased_at, pack:packs(name, image_url, cards_per_pack, edition, set_name)')
      .order('purchased_at', { ascending: false }),
  ]);

  const shaped: UserCard[] = (userCards || []).map((uc) => ({
    id: uc.id,
    user_id: uc.user_id,
    card_id: uc.card_id,
    card: uc.card || undefined,
    is_reverse_holo: uc.is_reverse_holo,
    edition: uc.edition || null,
    obtained_at: uc.obtained_at,
    pack_opened_from: uc.pack_opened_from,
  }));

  const shapedPacks: UnopenedPack[] = (unopenedPacks || []).map((up) => ({
    id: up.id,
    pack_id: up.pack_id,
    purchased_at: up.purchased_at,
    pack: (Array.isArray(up.pack) ? up.pack[0] : up.pack) as UnopenedPack['pack'],
  }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-4 flex items-center justify-end">
        <Link
          href="/pokedex"
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          View Pokédex →
        </Link>
      </div>
      <UnopenedPacksSection packs={shapedPacks} />
      <CollectionGrid userCards={shaped} />
    </div>
  );
}
