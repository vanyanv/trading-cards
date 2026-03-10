'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PackCard } from './PackCard';
import type { Pack } from '@/types';

export function HomeContent({
  trendingPacks,
  allPacks,
  sets,
}: {
  trendingPacks: Pack[];
  allPacks: Pack[];
  sets: { id: string; name: string }[];
}) {
  const [selectedSetId, setSelectedSetId] = useState(sets[0]?.id || '');
  const packsInSet = allPacks.filter((p) => p.set_id === selectedSetId);

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pb-16 pt-16 sm:pt-20"
      >
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Collect them all.
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted">
          Open packs with real pull rates, chase rare cards, and build your
          ultimate collection.
        </p>
      </motion.section>

      {/* Trending Now */}
      {trendingPacks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="pb-20"
        >
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <h2 className="text-xl font-bold tracking-tight">Trending Now</h2>
          </div>
          <p className="mt-1 text-sm text-muted">Most opened packs</p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {trendingPacks.map((pack, i) => (
              <PackCard key={pack.id} pack={pack} index={i} showTrending />
            ))}
          </div>
        </motion.section>
      )}

      {/* Explore by Set */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="pb-20"
        id="explore"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-muted-dim" />
          <h2 className="text-xl font-bold tracking-tight">Explore</h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Browse all available sets and packs
        </p>

        {/* Set tabs */}
        <div className="mt-6 overflow-x-auto">
          <div className="flex items-center gap-1 border-b border-border">
            {sets.map((set) => (
              <button
                key={set.id}
                onClick={() => setSelectedSetId(set.id)}
                className={cn(
                  'relative shrink-0 px-4 pb-3 pt-1 text-sm font-medium transition-colors',
                  selectedSetId === set.id
                    ? 'text-foreground'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {set.name}
                {selectedSetId === set.id && (
                  <motion.div
                    layoutId="explore-set-underline"
                    className="absolute inset-x-0 -bottom-px h-[1.5px] bg-foreground"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pack grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {packsInSet.map((pack, i) => (
            <PackCard key={pack.id} pack={pack} index={i} />
          ))}
        </div>

        {packsInSet.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">
            No packs available for this set.
          </p>
        )}
      </motion.section>
    </div>
  );
}
