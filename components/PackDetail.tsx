'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Coins, Layers, Hash } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG } from '@/lib/constants';
import { RarityBadge } from './RarityBadge';
import type { Pack, Card, Rarity } from '@/types';

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
            <div className="h-80 w-56 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-sm">
              <img
                src={pack.image_url}
                alt={pack.name}
                className="h-full w-full object-contain p-4"
              />
            </div>
          </div>

          {/* Pack info */}
          <div className="flex flex-1 flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-dim">
              {pack.set_name}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {pack.name}
            </h1>
            {pack.description && (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                {pack.description}
              </p>
            )}

            {/* Stats row */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Coins className="h-4 w-4 text-muted-dim" />
                {pack.price_coins} coins
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
            </div>

            {/* CTA */}
            {isAuthenticated ? (
              <Link
                href={`/pack-opening/${pack.id}`}
                className="mt-8 inline-flex w-fit items-center justify-center rounded-lg bg-foreground px-8 py-3 text-sm font-semibold text-background transition-all hover:opacity-85 active:scale-[0.98]"
              >
                Open Pack
              </Link>
            ) : (
              <Link
                href="/login"
                className="mt-8 inline-flex w-fit items-center justify-center rounded-lg border border-border px-8 py-3 text-sm font-semibold text-foreground transition-all hover:bg-surface-elevated"
              >
                Sign in to Open
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-16"
      >
        <div className="flex items-center gap-6 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative pb-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="pack-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-[1.5px] bg-foreground"
                />
              )}
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

/* ── Pull Rates Section ── */
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
        data. Slots 1–4 Common, 5–7 Uncommon, 8 Reverse Holo, 9 guaranteed
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
                <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
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
                className="w-14 shrink-0 text-right text-sm font-medium tabular-nums"
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

/* ── Cards Section ── */
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
            className="group overflow-hidden rounded-lg border border-border bg-surface transition-all hover:shadow-md hover:border-muted-dim"
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
