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

  // Check how many copies the user owns
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
    <div className="mx-auto max-w-4xl px-4 py-12">
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
          <div
            className="relative overflow-hidden rounded-2xl border"
            style={{
              borderColor: config.color + '40',
              boxShadow: `0 0 40px ${config.glowColor}`,
            }}
          >
            <img
              src={typedCard.image_url_hires || typedCard.image_url}
              alt={typedCard.name}
              className="w-full max-w-xs"
            />
            {typedCard.rarity === 'Hyper Rare' && (
              <div className="pointer-events-none absolute inset-0 shimmer" />
            )}
          </div>
        </div>

        {/* Card details */}
        <div>
          <RarityBadge rarity={typedCard.rarity as Rarity} className="mb-3" />
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            {typedCard.name}
          </h1>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
              <span className="text-sm text-muted">Set</span>
              <span className="text-sm font-medium">{typedCard.set_name}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
              <span className="text-sm text-muted">Type</span>
              <span className="text-sm font-medium">{typedCard.supertype}</span>
            </div>

            {typedCard.hp && (
              <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                <span className="text-sm text-muted">HP</span>
                <span className="text-sm font-medium">{typedCard.hp}</span>
              </div>
            )}

            {typedCard.types && typedCard.types.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                <span className="text-sm text-muted">Types</span>
                <span className="text-sm font-medium">
                  {typedCard.types.join(', ')}
                </span>
              </div>
            )}

            {typedCard.subtypes && typedCard.subtypes.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                <span className="text-sm text-muted">Subtypes</span>
                <span className="text-sm font-medium">
                  {typedCard.subtypes.join(', ')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
              <span className="text-sm text-muted">Rarity</span>
              <span className="text-sm font-medium" style={{ color: config.color }}>
                {config.label}
              </span>
            </div>

            {user && (
              <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
                <span className="text-sm text-muted">Owned</span>
                <span className="text-sm font-medium">
                  {ownedCount === 0 ? (
                    <span className="text-muted-dim">Not owned</span>
                  ) : (
                    `${ownedCount}×`
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
