'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Layers, Hash, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG, EDITION_CONFIG } from '@/lib/constants';
import { rarityOrder } from '@/lib/rarity';
import { RarityBadge } from './RarityBadge';
import type { Pack, Card, Rarity, Edition } from '@/types';

type Tab = 'rates' | 'cards';

export function PackDetail({
  pack,
  cards,
  pullRates,
  isAuthenticated,
}: {
  pack: Pack;
  cards: Card[];
  pullRates: { rarity: Rarity; weight: number }[];
  isAuthenticated: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('rates');
  const [rarityFilter, setRarityFilter] = useState('all');

  const rarities = [...new Set(cards.map((c) => c.rarity))];
  const filteredCards =
    rarityFilter === 'all'
      ? cards
      : cards.filter((c) => c.rarity === rarityFilter);

  // Best pull value — most expensive card in the pack
  const bestPullPrice = useMemo(() => {
    const prices = cards.map((c) => c.price).filter((p): p is number => p != null && p > 0);
    return prices.length > 0 ? Math.max(...prices) : null;
  }, [cards]);

  // Chase cards — top 8 rarest cards sorted by rarity order
  const chaseCards = useMemo(() => {
    return [...cards]
      .sort((a, b) => rarityOrder(b.rarity as Rarity) - rarityOrder(a.rarity as Rarity))
      .slice(0, 8);
  }, [cards]);

  // Highest rarity color for CTA glow
  const highestRarityColor = useMemo(() => {
    const sorted = [...cards].sort((a, b) => rarityOrder(b.rarity as Rarity) - rarityOrder(a.rarity as Rarity));
    const top = sorted[0];
    return top ? RARITY_CONFIG[top.rarity as Rarity]?.color ?? '#C8972E' : '#C8972E';
  }, [cards]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'rates', label: 'Pull Rates' },
    { id: 'cards', label: `Cards (${cards.length})` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to packs
        </Link>
      </motion.div>

      {/* Pack Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8"
      >
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start">
          {/* Pack image */}
          <div className="shrink-0 self-center sm:self-start">
            <div className="h-80 w-56 overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-warm-md">
              <img
                src={pack.featured_card_image || pack.image_url}
                alt={pack.name}
                className={`h-full w-full ${pack.featured_card_image ? 'object-cover' : 'object-contain p-4'}`}
              />
            </div>
          </div>

          {/* Pack info */}
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-dim">
                {pack.set_name}
              </p>
              {pack.edition && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${EDITION_CONFIG[pack.edition as Edition].badgeClass}`}
                >
                  {EDITION_CONFIG[pack.edition as Edition].label}
                </span>
              )}
            </div>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {pack.name}
            </h1>
            {pack.description && (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                {pack.description}
              </p>
            )}

            {/* Stats row */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <DollarSign className="h-4 w-4 text-accent" />
                {pack.price_usd?.toFixed(2) ?? '—'}
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-dim" />
                {pack.cards_per_pack} cards per pack
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-dim" />
                {cards.length} in set
              </span>
              {bestPullPrice && (
                <>
                  <span className="h-4 w-px bg-border" />
                  <span className="flex items-center gap-1.5 font-bold text-accent">
                    <Crown className="h-3.5 w-3.5" />
                    Best Pull: ${bestPullPrice.toFixed(2)}
                  </span>
                </>
              )}
            </div>

            {/* CTA with rarity glow */}
            {isAuthenticated ? (
              <Link
                href={`/pack-opening/${pack.id}`}
                className="group mt-8 inline-flex w-fit items-center justify-center rounded-xl bg-foreground px-8 py-3 text-sm font-bold text-background transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  animation: 'cta-glow 2.5s ease-in-out infinite',
                  // @ts-expect-error CSS custom property
                  '--glow-color': highestRarityColor,
                }}
              >
                Open Pack
              </Link>
            ) : (
              <Link
                href="/login"
                className="mt-8 inline-flex w-fit items-center justify-center rounded-xl border border-border px-8 py-3 text-sm font-bold text-foreground transition-all hover:bg-surface-elevated"
              >
                Sign in to Open
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Chase Card Strip */}
      {chaseCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Cards you could pull</h3>
          </div>
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-background to-transparent" />
            <div className="marquee-track flex gap-4 hover:[animation-play-state:paused]">
              {[...chaseCards, ...chaseCards].map((card, i) => (
                <div key={`${card.id}-${i}`} className="relative shrink-0 w-[80px] sm:w-[100px]">
                  <div className="relative overflow-hidden rounded-lg shadow-warm-sm">
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full select-none"
                      draggable={false}
                      loading="lazy"
                    />
                    <div className="holo-overlay absolute inset-0 rounded-lg opacity-50" />
                  </div>
                  <p className="mt-1 truncate text-[9px] font-medium text-muted text-center">
                    {card.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Content Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-16"
      >
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative rounded-full px-5 py-2 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-surface text-foreground shadow-warm-sm'
                  : 'text-muted hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'rates' && (
            <PullRatesSection pullRates={pullRates} />
          )}
          {activeTab === 'cards' && (
            <CardsSection
              cards={cards}
              filteredCards={filteredCards}
              rarities={rarities}
              filter={rarityFilter}
              onFilterChange={setRarityFilter}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* -- Pull Rates Section -- */
function PullRatesSection({
  pullRates,
}: {
  pullRates: { rarity: Rarity; weight: number }[];
}) {
  const maxWeight = Math.max(...pullRates.map((r) => r.weight));

  return (
    <div className="space-y-5">
      <p className="text-xs leading-relaxed text-muted">
        Hit slot (#10) pull rates based on community-tracked Scarlet &amp; Violet
        data. Slots 1-4 Common, 5-7 Uncommon, 8 Reverse Holo, 9 guaranteed
        Rare.
      </p>
      <div className="space-y-3">
        {[...pullRates].reverse().map((rate) => {
          const config = RARITY_CONFIG[rate.rarity];
          const pct = (rate.weight / maxWeight) * 100;
          return (
            <div key={rate.rarity} className="flex items-center gap-4">
              <div className="w-32 shrink-0">
                <RarityBadge rarity={rate.rarity} />
              </div>
              <div className="flex-1">
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-elevated">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: config.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.6,
                      delay: 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </div>
              </div>
              <span
                className="w-14 shrink-0 text-right text-sm font-bold tabular-nums"
                style={{ color: config.color }}
              >
                {rate.weight}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -- Cards Section -- */
function CardsSection({
  cards,
  filteredCards,
  rarities,
  filter,
  onFilterChange,
}: {
  cards: Card[];
  filteredCards: Card[];
  rarities: string[];
  filter: string;
  onFilterChange: (r: string) => void;
}) {
  return (
    <div>
      {/* Rarity filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange('all')}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
            filter === 'all'
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-transparent text-muted hover:border-muted-dim'
          )}
        >
          All ({cards.length})
        </button>
        {rarities.map((r) => {
          const config = RARITY_CONFIG[r as Rarity];
          const count = cards.filter((c) => c.rarity === r).length;
          return (
            <button
              key={r}
              onClick={() => onFilterChange(r)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all',
                filter === r
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-transparent text-muted hover:border-muted-dim'
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config?.label || r} ({count})
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {filteredCards.map((card) => (
          <Link
            key={card.id}
            href={`/card/${card.id}`}
            className="group overflow-hidden rounded-xl border border-border bg-surface shadow-warm-sm transition-all hover:shadow-warm-md hover:border-border"
          >
            <div className="aspect-[2.5/3.5] overflow-hidden">
              <img
                src={card.image_url}
                alt={card.name}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
            <div className="p-2">
              <p className="truncate text-[10px] font-medium text-foreground">
                {card.name}
              </p>
              <p className="text-[9px] text-muted">
                {RARITY_CONFIG[card.rarity as Rarity]?.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <p className="py-12 text-center text-sm text-muted">
          No cards found for this rarity.
        </p>
      )}
    </div>
  );
}
