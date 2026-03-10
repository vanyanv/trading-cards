import { createClient } from '@/lib/supabase/server';
import { RARITY_CONFIG } from '@/lib/constants';
import { RarityBadge } from '@/components/RarityBadge';
import type { Card, Rarity } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
  const config = RARITY_CONFIG[typedCard.rarity as Rarity];

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

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/collection"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to collection
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Card image */}
        <div className="flex items-start justify-center">
          <div className="overflow-hidden rounded-lg border border-border shadow-lg">
            <img
              src={typedCard.image_url_hires || typedCard.image_url}
              alt={typedCard.name}
              className="w-full max-w-sm"
            />
          </div>
        </div>

        {/* Card details */}
        <div>
          <RarityBadge rarity={typedCard.rarity as Rarity} className="mb-3" />
          <h1 className="text-3xl font-semibold tracking-tight">
            {typedCard.name}
          </h1>

          <div className="mt-6 space-y-2">
            <DetailRow label="Set" value={typedCard.set_name} />
            <DetailRow label="Type" value={typedCard.supertype} />
            {typedCard.hp && <DetailRow label="HP" value={typedCard.hp} />}
            {typedCard.types && typedCard.types.length > 0 && (
              <DetailRow label="Types" value={typedCard.types.join(', ')} />
            )}
            {typedCard.subtypes && typedCard.subtypes.length > 0 && (
              <DetailRow label="Subtypes" value={typedCard.subtypes.join(', ')} />
            )}
            <DetailRow
              label="Rarity"
              value={config.label}
              valueColor={config.color}
            />
            {user && (
              <DetailRow
                label="Owned"
                value={ownedCount === 0 ? 'Not owned' : `${ownedCount}x`}
                valueColor={ownedCount === 0 ? '#A8A29E' : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
      <span className="text-xs uppercase tracking-wider text-muted">{label}</span>
      <span className="text-sm font-medium" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
}
