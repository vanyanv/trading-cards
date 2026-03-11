'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Sparkles, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG } from '@/lib/constants';
import { rarityOrder } from '@/lib/rarity';
import { RarityBadge } from './RarityBadge';
import { PriceChart } from './PriceChart';
import { RecentSales } from './RecentSales';
import { CardShowcase, useCardShowcase } from './CardShowcase';
import { TypeParticles } from './TypeParticles';
import type { Card, Rarity, CardDetailData, TCGPlayerVariantPrices } from '@/types';

const VARIANT_LABELS: Record<string, string> = {
  normal: 'Normal',
  holofoil: 'Holofoil',
  'reverse-holofoil': 'Reverse Holofoil',
  '1stEditionHolofoil': '1st Ed. Holofoil',
  '1stEditionNormal': '1st Ed. Normal',
};

const CONDITION_MULTIPLIERS: { label: string; key: string; multiplier: number }[] = [
  { label: 'Near Mint', key: 'NM', multiplier: 1.0 },
  { label: 'Lightly Played', key: 'LP', multiplier: 0.85 },
  { label: 'Moderately Played', key: 'MP', multiplier: 0.7 },
  { label: 'Heavily Played', key: 'HP', multiplier: 0.5 },
  { label: 'Damaged', key: 'DMG', multiplier: 0.3 },
];

const easeOut = [0.16, 1, 0.3, 1] as const;

function formatPrice(value: number | null | undefined): string {
  if (value == null) return '—';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up')
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down')
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted" />;
}

export function CardDetailContent({
  card,
  detail,
  ownedCount,
  isAuthenticated,
  cardPullStats,
}: {
  card: Card;
  detail: CardDetailData | null;
  ownedCount: number;
  isAuthenticated: boolean;
  cardPullStats?: { pull_count: number; total_opens: number } | null;
}) {
  const config = RARITY_CONFIG[card.rarity as Rarity];
  const { showcaseCard, openShowcase, closeShowcase } = useCardShowcase();
  const tcgPricing = detail?.pricing?.tcgplayer;
  const cardmarketPricing = detail?.pricing?.cardmarket;

  // Determine available variants from TCGPlayer pricing
  const variants = tcgPricing
    ? (Object.keys(tcgPricing) as string[]).filter(
        (k) =>
          k !== 'updated' &&
          k !== 'unit' &&
          tcgPricing[k as keyof typeof tcgPricing] != null
      )
    : [];

  const [selectedVariant, setSelectedVariant] = useState<string>(
    variants[0] || 'normal'
  );

  const variantPricing =
    tcgPricing?.[selectedVariant as keyof typeof tcgPricing] as
      | TCGPlayerVariantPrices
      | undefined;

  const marketPrice = variantPricing?.marketPrice ?? card.price ?? null;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
  }, []);

  const showParticles = !prefersReducedMotion && rarityOrder(card.rarity as Rarity) >= 2;

  return (
    <div className="relative mx-auto max-w-6xl px-6 py-12">
      {showParticles && (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          style={{ opacity: 0.15 }}
        >
          <TypeParticles types={card.types} count={12} />
        </div>
      )}
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/collection"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to collection
        </Link>
      </motion.div>

      {/* Hero: two-column */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: easeOut }}
        className="mt-8 grid gap-10 lg:grid-cols-[400px_1fr]"
      >
        {/* Left: Card Image */}
        <div className="flex flex-col items-center gap-3">
          <div className="overflow-hidden rounded-2xl border border-border shadow-warm-lg">
            <Image
              src={card.image_url_hires || card.image_url}
              alt={card.name}
              width={400}
              height={560}
              sizes="(max-width: 1024px) 100vw, 400px"
              priority
              className="w-full max-w-sm"
            />
          </div>
          {rarityOrder(card.rarity) >= 2 && (
            <button
              onClick={() => openShowcase(card)}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Sparkles className="h-3.5 w-3.5" />
              View in Showcase
            </button>
          )}
        </div>

        {/* Right: Pricing Panel */}
        <div>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <RarityBadge rarity={card.rarity as Rarity} className="mb-2" />
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {card.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {card.supertype && (
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted">
                    {card.supertype}
                  </span>
                )}
                {card.subtypes?.map((st) => (
                  <span
                    key={st}
                    className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted"
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>
            {card.hp && (
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-2xl font-bold text-foreground">
                  HP {card.hp}
                </span>
                {card.types?.[0] && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor: config.color + '20',
                      color: config.color,
                    }}
                  >
                    {card.types[0]}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Prices section */}
          <div className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-dim">
              Prices
            </h2>

            {/* Variant tabs */}
            {variants.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
                      selectedVariant === v
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border text-muted hover:border-muted-dim'
                    )}
                  >
                    {VARIANT_LABELS[v] || v}
                  </button>
                ))}
              </div>
            )}

            {/* Current price hero */}
            <div className="mt-5 flex items-end gap-3">
              <span className="font-heading text-4xl font-bold tabular-nums tracking-tight">
                {formatPrice(marketPrice)}
              </span>
              <TrendIcon trend={card.price_trend} />
            </div>

            {/* Condition prices */}
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {CONDITION_MULTIPLIERS.map(({ label, key, multiplier }) => {
                const condPrice = marketPrice
                  ? marketPrice * multiplier
                  : null;
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-surface-elevated px-3 py-2.5"
                  >
                    <p className="text-[10px] font-medium text-muted flex items-center gap-1">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          key === 'NM' && 'bg-green-500',
                          key === 'LP' && 'bg-blue-400',
                          key === 'MP' && 'bg-amber-400',
                          key === 'HP' && 'bg-orange-500',
                          key === 'DMG' && 'bg-red-500'
                        )}
                      />
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-bold tabular-nums">
                      {formatPrice(condPrice)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CardMarket pricing if available */}
            {cardmarketPricing && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {cardmarketPricing.avg != null && (
                  <DetailChip
                    label="CardMarket Avg"
                    value={formatPrice(cardmarketPricing.avg)}
                  />
                )}
                {cardmarketPricing.trend != null && (
                  <DetailChip
                    label="CM Trend"
                    value={formatPrice(cardmarketPricing.trend)}
                  />
                )}
                {cardmarketPricing.low != null && (
                  <DetailChip
                    label="CM Low"
                    value={formatPrice(cardmarketPricing.low)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Card details rows */}
          <div className="mt-8 space-y-2">
            <DetailRow label="Set" value={card.set_name} />
            {detail?.illustrator && (
              <DetailRow label="Illustrator" value={detail.illustrator} />
            )}
            {detail?.stage && (
              <DetailRow label="Stage" value={detail.stage} />
            )}
            {detail?.evolveFrom && (
              <DetailRow label="Evolves From" value={detail.evolveFrom} />
            )}
            <DetailRow
              label="Rarity"
              value={config.label}
              valueColor={config.color}
            />
            {isAuthenticated && (
              <DetailRow
                label="Owned"
                value={ownedCount === 0 ? 'Not owned' : `${ownedCount}x`}
                valueColor={ownedCount === 0 ? '#A8A29E' : undefined}
              />
            )}
            {cardPullStats && cardPullStats.pull_count > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Community Pulls
                </span>
                <span className="text-sm font-medium text-foreground">
                  {cardPullStats.pull_count.toLocaleString()}x pulled
                  {cardPullStats.total_opens > 0 && cardPullStats.pull_count > 0 && (
                    <span className="ml-1.5 text-xs text-muted">
                      (~1 in {Math.round(cardPullStats.total_opens / cardPullStats.pull_count)})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Price Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
      >
        <PriceChart cardId={card.id} />
      </motion.div>

      {/* Recent Sales */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: easeOut }}
      >
        <RecentSales cardId={card.id} />
      </motion.div>

      {/* Showcase overlay */}
      {showcaseCard && (
        <CardShowcase card={showcaseCard} onClose={closeShowcase} />
      )}
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
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
      <span className="text-xs uppercase tracking-wider text-muted">
        {label}
      </span>
      <span
        className="text-sm font-medium"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2">
      <p className="text-[9px] font-medium uppercase tracking-wider text-muted-dim">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
