import { createClient } from '@/lib/supabase/server';
import { HIT_SLOT_RATES } from '@/lib/constants';
import { PackDetail } from '@/components/PackDetail';
import type { Pack, Card } from '@/types';
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

  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('set_id', typedPack.set_id)
    .order('rarity', { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <PackDetail
      pack={typedPack}
      cards={(cards || []) as Card[]}
      pullRates={HIT_SLOT_RATES}
      isAuthenticated={!!user}
    />
  );
}
