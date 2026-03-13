'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { HeroCardStack } from './HeroCardStack';
import { RareCardShowcase } from './RareCardShowcase';
import { FeaturedPackSpotlight } from './FeaturedPackSpotlight';
import { RecentPullsTicker } from './RecentPullsTicker';
import { SectionDivider } from './SectionDivider';
import { ValuePropStorytelling } from './ValuePropStorytelling';
import type { Pack, Card, Rarity } from '@/types';
import { rarityOrder } from '@/lib/rarity';
import Link from 'next/link';

const ease = [0.16, 1, 0.3, 1] as const;

type FeaturedCard = Pick<Card, 'id' | 'name' | 'image_url' | 'image_url_hires' | 'rarity'>;

interface RecentPull {
  id: string;
  obtained_at: string;
  card: Pick<Card, 'id' | 'name' | 'image_url' | 'rarity' | 'set_name'>;
  profile?: { display_name: string | null; avatar_id: string | null } | null;
}

export function HomeContent({
  trendingPacks,
  featuredCards,
  recentPulls,
  featuredPullRates,
}: {
  trendingPacks: Pack[];
  featuredCards: FeaturedCard[];
  recentPulls: RecentPull[];
  featuredPullRates: { rarity: Rarity; weight: number }[];
}) {
  // Sort by rarity descending (rarest first) then split
  const sortedFeatured = [...featuredCards].sort(
    (a, b) => rarityOrder(b.rarity as Rarity) - rarityOrder(a.rarity as Rarity)
  );
  const showcaseCards = sortedFeatured.slice(0, 3);
  const valuePropCards = sortedFeatured.length >= 6
    ? sortedFeatured.slice(3, 6)
    : sortedFeatured.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Section 1: Cinematic Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className="relative pb-10 pt-4 sm:pb-16 sm:pt-20 lg:pt-24"
      >
        <div className="flex flex-col-reverse items-center gap-12 lg:flex-row lg:gap-12">
          {/* Left: text + rare card showcase */}
          <div className="flex-1 text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="font-heading text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              Rip.{' '}
              <span className="text-shimmer">Reveal.</span>
              <br />
              Collect.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease }}
              className="mt-5 max-w-md text-base leading-relaxed text-muted mx-auto lg:mx-0"
            >
              Open packs that represent real, physical cards. Keep the hits,
              auto-sell the rest.
            </motion.p>

            {/* Rare Card Showcase */}
            {showcaseCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease }}
                className="mt-8 flex justify-center lg:justify-start"
              >
                <RareCardShowcase cards={showcaseCards} />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease }}
              className="mt-8"
            >
              <Link
                href="/browse"
                className="group inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-warm-md transition-all hover:bg-accent-hover hover:shadow-warm-lg"
              >
                Start Opening
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>

          {/* Right: floating cards */}
          {sortedFeatured.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 w-full max-w-md lg:max-w-lg lg:-mt-12"
            >
              <HeroCardStack cards={sortedFeatured} />
            </motion.div>
          )}
        </div>
      </motion.section>

      <SectionDivider type="Fire" />

      {/* Value Prop Storytelling */}
      <ValuePropStorytelling cards={valuePropCards} />

      <SectionDivider type="Grass" />

      {/* Section 2: Featured Pack Spotlight */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease }}
      >
        <FeaturedPackSpotlight packs={trendingPacks} pullRates={featuredPullRates} />
      </motion.div>

      <SectionDivider type="Water" />

      {/* Section 3: Recent Rare Pulls */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease }}
      >
        <RecentPullsTicker pulls={recentPulls} />
      </motion.div>

      <SectionDivider type="Lightning" />

      {/* Section 4: Browse All Packs CTA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease }}
        className="pb-24"
      >
        <Link
          href="/browse"
          className="group flex items-center justify-between rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8 transition-all hover:border-accent/30 hover:shadow-warm-md"
        >
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Explore All Sets
            </h2>
            <p className="mt-1 text-sm text-muted">
              Find packs to open across every available set
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors group-hover:bg-accent-hover shrink-0 ml-4">
            Browse Packs
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </motion.section>
    </div>
  );
}
