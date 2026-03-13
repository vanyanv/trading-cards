'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Layers, Hash, Crown, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG, EDITION_CONFIG, EDITION_ORDER } from '@/lib/constants';
import { rarityOrder } from '@/lib/rarity';
import { RarityBadge } from './RarityBadge';
import { getEditionPrice } from '@/lib/card-pricing';
import type { PricingDetailRow } from '@/lib/card-pricing';
import type { Pack, Card, Rarity, Edition } from '@/types';

type Tab = 'rates' | 'cards';

export function PackDetail({
  pack,
  cards,
  pullRates,
  observedStats = [],
  isTCGP = false,
  isAuthenticated,
  editionVariants = [],
  cardPricingDetails = [],
}: {
  pack: Pack;
  cards: Card[];
  pullRates: { rarity: Rarity; weight: number }[];
  observedStats?: { rarity: string; pull_count: number; total_opens: number }[];
  isTCGP?: boolean;
  isAuthenticated: boolean;
  editionVariants?: Pack[];
  cardPricingDetails?: PricingDetailRow[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('rates');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [selectedPack, setSelectedPack] = useState<Pack>(pack);

  // Sort edition variants by canonical order
  const sortedEditions = useMemo(() => {
    if (editionVariants.length <= 1) return editionVariants;
    return [...editionVariants].sort((a, b) => {
      const ai = EDITION_ORDER.indexOf(a.edition as Edition);
      const bi = EDITION_ORDER.indexOf(b.edition as Edition);
      return ai - bi;
    });
  }, [editionVariants]);

  const handleEditionSelect = (variant: Pack) => {
    setSelectedPack(variant);
    window.history.replaceState(null, '', `/pack/${variant.id}`);
  };

  const rarities = [...new Set(cards.map((c) => c.rarity))];
  const filteredCards =
    rarityFilter === 'all'
      ? cards
      : cards.filter((c) => c.rarity === rarityFilter);

  // Best pull value — most expensive card in the pack, edition-aware
  const bestPullPrice = useMemo(() => {
    const prices = cards.map((c) => {
      const details = (cardPricingDetails || []).filter((d) => d.card_id === c.id);
      return getEditionPrice(c.price ?? null, selectedPack.edition as Edition | null, details);
    }).filter((p): p is number => p != null && p > 0);
    return prices.length > 0 ? Math.max(...prices) : null;
  }, [cards, selectedPack.edition, cardPricingDetails]);

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
            <div className="relative h-80 w-56 overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-warm-md">
              <Image
                src={selectedPack.featured_card_image || selectedPack.image_url}
                alt={selectedPack.name}
                fill
                sizes="224px"
                priority
                className={`h-full w-full ${selectedPack.featured_card_image ? 'object-cover' : 'object-contain p-4'}`}
              />
            </div>
          </div>

          {/* Pack info */}
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-2">
              {selectedPack.serie_logo_url && (
                <Image
                  src={selectedPack.serie_logo_url}
                  alt=""
                  width={24}
                  height={24}
                  className="opacity-70"
                />
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-dim">
                {selectedPack.set_name}
              </p>
              {selectedPack.edition && sortedEditions.length <= 1 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${EDITION_CONFIG[selectedPack.edition as Edition].badgeClass}`}
                >
                  {EDITION_CONFIG[selectedPack.edition as Edition].label}
                </span>
              )}
            </div>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {selectedPack.name}
            </h1>
            {selectedPack.description && (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                {selectedPack.description}
              </p>
            )}

            {/* Edition selector pills */}
            {sortedEditions.length > 1 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {sortedEditions.map((variant) => {
                  const config = EDITION_CONFIG[variant.edition as Edition];
                  const isActive = variant.id === selectedPack.id;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => handleEditionSelect(variant)}
                      className={cn(
                        'relative rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all',
                        isActive
                          ? config.badgeClass
                          : 'border border-border bg-surface text-muted hover:border-muted-dim hover:text-foreground'
                      )}
                    >
                      {config.label}
                      {isActive && (
                        <motion.div
                          layoutId="edition-pill"
                          className="absolute inset-0 rounded-full ring-2 ring-accent/30"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Stats row */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <DollarSign className="h-4 w-4 text-accent" />
                {selectedPack.price_usd?.toFixed(2) ?? '—'}
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-dim" />
                {selectedPack.cards_per_pack} cards per pack
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
                href={`/pack-opening/${selectedPack.id}`}
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
            <PullRatesSection pullRates={pullRates} observedStats={observedStats} isTCGP={isTCGP} />
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

const PACK_SLOTS_TCG = [
  { slots: '1–4', label: 'Common', rarity: 'Common' as Rarity, count: 4 },
  { slots: '5–7', label: 'Uncommon', rarity: 'Uncommon' as Rarity, count: 3 },
  { slots: '8', label: 'Reverse Holo', rarity: 'Rare' as Rarity, count: 1 },
  { slots: '9', label: 'Rare (guaranteed)', rarity: 'Rare' as Rarity, count: 1 },
  { slots: '10', label: 'Hit Slot', rarity: null, count: 1 },
];

const PACK_SLOTS_TCGP = [
  { slots: '1–3', label: '◆ (common)', rarity: 'One Diamond' as Rarity, count: 3 },
  { slots: '4', label: '◆◆ (uncommon)', rarity: 'Two Diamond' as Rarity, count: 1 },
  { slots: '5', label: 'Hit Slot', rarity: null, count: 1 },
];

function PullRatesSection({
  pullRates,
  observedStats = [],
  isTCGP = false,
}: {
  pullRates: { rarity: Rarity; weight: number }[];
  observedStats?: { rarity: string; pull_count: number; total_opens: number }[];
  isTCGP?: boolean;
}) {
  const maxWeight = Math.max(...pullRates.map((r) => r.weight));
  const packSlots = isTCGP ? PACK_SLOTS_TCGP : PACK_SLOTS_TCG;

  // Get total community opens from observed stats
  const totalOpens = observedStats.length > 0
    ? Math.max(...observedStats.map((s) => s.total_opens))
    : 0;

  // Build lookup for observed counts
  const observedMap = new Map(observedStats.map((s) => [s.rarity, s.pull_count]));

  return (
    <div className="space-y-8">
      {/* Pack composition */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-dim">
          Pack Composition
        </h4>
        <div className="space-y-2">
          {packSlots.map((slot) => (
            <div key={slot.slots} className="flex items-center gap-3 text-sm">
              <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-dim">
                {slot.slots}
              </span>
              <span className="h-px w-3 bg-border" />
              {slot.rarity ? (
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: RARITY_CONFIG[slot.rarity]?.color ?? '#9CA3AF' }}
                  />
                  <span className="text-foreground">{slot.label}</span>
                </div>
              ) : (
                <span className="font-medium text-accent">{slot.label} ↓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hit slot odds */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-dim">
            Hit Slot Odds
          </h4>
          {totalOpens > 0 && (
            <span className="text-xs text-muted">
              Based on {totalOpens.toLocaleString()} pack opens
            </span>
          )}
        </div>
        <div className="space-y-3">
          {[...pullRates].reverse().map((rate) => {
            const config = RARITY_CONFIG[rate.rarity];
            const pct = (rate.weight / maxWeight) * 100;
            const observed = observedMap.get(rate.rarity) ?? 0;
            const oneInX = totalOpens > 0 && observed > 0
              ? Math.round(totalOpens / observed)
              : null;

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
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="w-14 text-right text-sm font-bold tabular-nums"
                    style={{ color: config.color }}
                  >
                    {rate.weight}%
                  </span>
                  {oneInX && (
                    <span className="w-20 text-right text-xs tabular-nums text-muted">
                      1 in {oneInX}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {totalOpens > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-dim" />
            <p className="text-[11px] leading-relaxed text-muted">
              Rates are Bayesian-adjusted, blending community priors with observed data from{' '}
              {totalOpens.toLocaleString()} opens. As more packs are opened, rates converge toward actual pull probabilities.
            </p>
          </div>
        )}
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
            <div className="relative aspect-[2.5/3.5] overflow-hidden">
              <Image
                src={card.image_url}
                alt={card.name}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12.5vw"
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
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
