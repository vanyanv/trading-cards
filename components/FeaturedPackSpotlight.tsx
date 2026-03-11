'use client';

import { motion } from 'framer-motion';
import { DollarSign, ArrowRight, Sparkles } from 'lucide-react';
import { HIT_SLOT_RATES } from '@/lib/constants';
import { RARITY_CONFIG } from '@/lib/constants';
import { PackCard } from './PackCard';
import type { Pack } from '@/types';
import Link from 'next/link';

const ease = [0.16, 1, 0.3, 1] as const;

export function FeaturedPackSpotlight({ packs }: { packs: Pack[] }) {
  if (packs.length === 0) return null;

  const featured = packs[0];
  const remaining = packs.slice(1);

  // Top 3 rarest pull rates for preview
  const topRates = HIT_SLOT_RATES.slice(-3).reverse();
  const totalWeight = HIT_SLOT_RATES.reduce((s, r) => s + r.weight, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease }}
      className="pb-20"
    >
      <div className="flex items-center gap-2.5 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <h2 className="font-heading text-2xl font-bold tracking-tight">Featured</h2>
      </div>

      {/* Hero spotlight card */}
      <motion.div
        className="featured-spotlight relative overflow-hidden rounded-3xl border border-border bg-surface shadow-warm-lg"
        animate={{
          boxShadow: [
            '0 10px 40px -12px rgba(200,151,46,0)',
            '0 10px 40px -12px rgba(200,151,46,0.15)',
            '0 10px 40px -12px rgba(200,151,46,0)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Link href={`/pack/${featured.id}`} className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
          {/* Pack image */}
          <div className="relative shrink-0 w-[200px] sm:w-[240px]">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-surface-elevated">
              {(featured.featured_card_image || featured.image_url) && (
                <img
                  src={featured.featured_card_image || featured.image_url}
                  alt={featured.name}
                  className={`h-full w-full ${featured.featured_card_image ? 'object-cover' : 'object-contain p-4'}`}
                />
              )}
            </div>
          </div>

          {/* Pack info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-dim">
              {featured.set_name}
            </p>
            <h3 className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {featured.name}
            </h3>
            {featured.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-2">
                {featured.description}
              </p>
            )}

            {/* Price */}
            <div className="mt-5 flex items-center gap-1 justify-center sm:justify-start">
              <DollarSign className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold text-foreground">{featured.price_usd?.toFixed(2) ?? '—'}</span>
            </div>

            {/* Pull rate preview */}
            <div className="mt-5 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              {topRates.map((rate) => {
                const config = RARITY_CONFIG[rate.rarity];
                const pct = ((rate.weight / totalWeight) * 100).toFixed(1);
                return (
                  <div
                    key={rate.rarity}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-[11px] font-medium text-muted">
                      {config.label}
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: config.color }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover">
              Open This Pack
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Horizontal scroll of remaining trending packs */}
      {remaining.length > 0 && (
        <div className="mt-8 -mx-6 px-6">
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {remaining.map((pack, i) => (
              <div key={pack.id} className="w-44 shrink-0 snap-center">
                <PackCard pack={pack} index={i} showTrending />
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}
