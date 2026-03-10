'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG } from '@/lib/constants';
import { RarityBadge } from './RarityBadge';
import type { Pack, Card, Rarity } from '@/types';

type Tab = 'rates' | 'cards' | 'values';

function estimateValue(rarity: string): number {
  const values: Record<string, number> = {
    'Common': 0.1,
    'Uncommon': 0.25,
    'Rare': 1.5,
    'Double Rare': 5,
    'Illustration Rare': 12,
    'Ultra Rare': 18,
    'Special Illustration Rare': 45,
    'Hyper Rare': 80,
  };
  return values[rarity] ?? 0.1;
}

export function FeaturedPackHub({
  packs,
  cardsBySet,
  sets,
  pullRates,
}: {
  packs: Pack[];
  cardsBySet: Record<string, Card[]>;
  sets: { id: string; name: string }[];
  pullRates: { rarity: Rarity; weight: number }[];
}) {
  const [selectedSetId, setSelectedSetId] = useState(sets[0]?.id || '');
  const [selectedPackId, setSelectedPackId] = useState(
    packs.find((p) => p.set_id === sets[0]?.id)?.id || ''
  );
  const [activeTab, setActiveTab] = useState<Tab>('rates');

  const packsInSet = packs.filter((p) => p.set_id === selectedSetId);
  const currentPack = packs.find((p) => p.id === selectedPackId) || packsInSet[0];
  const setCards = cardsBySet[selectedSetId] || [];

  const topValueCards = [...setCards]
    .sort((a, b) => estimateValue(b.rarity) - estimateValue(a.rarity))
    .slice(0, 10);

  const handleSetChange = (setId: string) => {
    setSelectedSetId(setId);
    const firstPack = packs.find((p) => p.set_id === setId);
    if (firstPack) setSelectedPackId(firstPack.id);
    setActiveTab('rates');
  };

  if (sets.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <p className="text-sm text-muted">No packs available yet. Run the sync script to load cards.</p>
        <code className="mt-2 rounded-md bg-surface-elevated px-3 py-1.5 text-xs text-muted-dim">
          npx tsx scripts/sync-cards.ts
        </code>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'rates', label: 'Pull Rates' },
    { id: 'cards', label: 'Cards' },
    { id: 'values', label: 'Top Values' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Set Selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-6 border-b border-border">
          {sets.map((set) => (
            <button
              key={set.id}
              onClick={() => handleSetChange(set.id)}
              className={cn(
                'relative pb-3 text-sm font-medium transition-colors',
                selectedSetId === set.id
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground'
              )}
            >
              {set.name}
              {selectedSetId === set.id && (
                <motion.div
                  layoutId="set-underline"
                  className="absolute inset-x-0 -bottom-px h-[1.5px] bg-foreground"
                />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Pack Hero */}
      {currentPack && (
        <motion.div
          key={currentPack.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mt-10"
        >
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start">
            {/* Pack image */}
            <div className="shrink-0">
              <div className="h-72 w-48 overflow-hidden rounded-lg border border-border bg-surface-elevated">
                <img
                  src={currentPack.image_url}
                  alt={currentPack.name}
                  className="h-full w-full object-contain p-3"
                />
              </div>
            </div>

            {/* Pack info */}
            <div className="flex flex-1 flex-col">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-dim">
                {currentPack.set_name}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                {currentPack.name}
              </h1>
              {currentPack.description && (
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                  {currentPack.description}
                </p>
              )}

              <div className="mt-5 flex items-center gap-3 text-sm text-muted">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Coins className="h-3.5 w-3.5 text-muted" />
                  {currentPack.price_coins}
                </span>
                <span className="text-muted-dim">/</span>
                <span>{currentPack.cards_per_pack} cards</span>
                <span className="text-muted-dim">/</span>
                <span>{setCards.length} in set</span>
              </div>

              <Link
                href={`/pack-opening/${currentPack.id}`}
                className="mt-6 inline-flex w-fit items-center rounded-md bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 active:opacity-70"
              >
                Open Pack
              </Link>

              {/* Pack thumbnails (if multiple packs in set) */}
              {packsInSet.length > 1 && (
                <div className="mt-8 flex items-center gap-3">
                  {packsInSet.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedPackId(pack.id)}
                      className={cn(
                        'h-16 w-12 overflow-hidden rounded-md border transition-all',
                        currentPack.id === pack.id
                          ? 'border-foreground'
                          : 'border-border hover:border-muted-dim'
                      )}
                    >
                      <img
                        src={pack.image_url}
                        alt={pack.name}
                        className="h-full w-full object-contain p-0.5"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Content Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-14"
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
                  layoutId="tab-underline"
                  className="absolute inset-x-0 -bottom-px h-[1.5px] bg-foreground"
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'rates' && <PullRatesTab pullRates={pullRates} />}
          {activeTab === 'cards' && <CardsTab cards={setCards} />}
          {activeTab === 'values' && <ValuesTab cards={topValueCards} />}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Pull Rates Tab ── */
function PullRatesTab({ pullRates }: { pullRates: { rarity: Rarity; weight: number }[] }) {
  const maxWeight = Math.max(...pullRates.map((r) => r.weight));

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">
        Hit slot (#10) pull rates based on community-tracked Scarlet &amp; Violet data.
        Slots 1-4 Common, 5-7 Uncommon, 8 Reverse Holo, 9 guaranteed Rare.
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
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
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

/* ── Cards Tab ── */
function CardsTab({ cards }: { cards: Card[] }) {
  const [filter, setFilter] = useState('all');
  const rarities = [...new Set(cards.map((c) => c.rarity))];
  const filtered = filter === 'all' ? cards : cards.filter((c) => c.rarity === filter);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-all border',
            filter === 'all'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-transparent text-muted border-border hover:border-muted-dim'
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
              onClick={() => setFilter(r)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all border',
                filter === r
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted border-border hover:border-muted-dim'
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

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {filtered.map((card) => (
          <Link
            key={card.id}
            href={`/card/${card.id}`}
            className="group overflow-hidden rounded-md border border-border bg-surface transition-all hover:shadow-md"
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
              <p className="truncate text-[10px] font-medium text-foreground">{card.name}</p>
              <p className="text-[9px] text-muted">{RARITY_CONFIG[card.rarity as Rarity]?.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">No cards found.</p>
      )}
    </div>
  );
}

/* ── Values Tab ── */
function ValuesTab({ cards }: { cards: Card[] }) {
  return (
    <div>
      <p className="mb-6 text-xs text-muted">
        Estimated market values based on rarity. Actual prices may vary.
      </p>
      <div className="space-y-2">
        {cards.map((card, i) => {
          const config = RARITY_CONFIG[card.rarity as Rarity];
          const value = estimateValue(card.rarity);
          return (
            <Link
              key={card.id}
              href={`/card/${card.id}`}
              className="group flex items-center gap-4 rounded-md border border-border bg-surface p-3 transition-all hover:shadow-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-medium text-muted-dim">
                {i + 1}
              </span>
              <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-surface-elevated">
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{card.name}</p>
                <RarityBadge rarity={card.rarity as Rarity} className="mt-0.5" />
              </div>
              <span
                className="shrink-0 text-sm font-semibold"
                style={{ color: config.color }}
              >
                ${value.toFixed(2)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
