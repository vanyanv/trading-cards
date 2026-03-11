'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { PokedexIcon } from '@/components/PokedexIcon';
import { RARITY_CONFIG } from '@/lib/constants';
import type { SetCompletion, PokedexCard, Rarity } from '@/types';

interface PokedexContentProps {
  sets: SetCompletion[];
}

export function PokedexContent({ sets }: PokedexContentProps) {
  const [selectedSet, setSelectedSet] = useState<SetCompletion | null>(null);
  const [setCards, setSetCards] = useState<Record<string, PokedexCard[]>>({});
  const [loadingSet, setLoadingSet] = useState<string | null>(null);

  const openSet = useCallback(
    async (set: SetCompletion) => {
      setSelectedSet(set);

      if (!setCards[set.set_id]) {
        setLoadingSet(set.set_id);
        try {
          const res = await fetch(`/api/pokedex?set_id=${set.set_id}`);
          const data: PokedexCard[] = await res.json();
          setSetCards((prev) => ({ ...prev, [set.set_id]: data }));
        } catch {
          // silently fail
        } finally {
          setLoadingSet(null);
        }
      }
    },
    [setCards]
  );

  const closeModal = useCallback(() => setSelectedSet(null), []);

  // Escape key to close modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (selectedSet) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKey);
        document.body.style.overflow = '';
      };
    }
  }, [selectedSet, closeModal]);

  if (sets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16">
        <PokedexIcon className="mb-4 h-16 w-16 text-red-400 opacity-60" />
        <p className="text-sm font-medium text-foreground">
          Your Pokédex is empty
        </p>
        <p className="mt-1 text-xs text-muted">
          Start opening packs to fill your Pokédex!
        </p>
        <Link
          href="/browse"
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Browse Packs
        </Link>
      </div>
    );
  }

  const totalOwned = sets.reduce((sum, s) => sum + s.owned_count, 0);
  const totalCards = sets.reduce((sum, s) => sum + s.total_count, 0);

  return (
    <>
      {/* Overall stats */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3">
        <div className="text-sm text-muted">
          <span className="font-semibold text-foreground">{totalOwned}</span>
          {' / '}
          {totalCards} cards across{' '}
          <span className="font-semibold text-foreground">{sets.length}</span> sets
        </div>
      </div>

      {/* Set grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {sets.map((set, i) => {
          const pct = set.total_count > 0 ? Math.round((set.owned_count / set.total_count) * 100) : 0;
          const isComplete = pct === 100;

          return (
            <motion.button
              key={set.set_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              onClick={() => openSet(set)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:shadow-warm-md hover:scale-[1.02]"
            >
              {/* Set image */}
              <div className="flex h-32 items-center justify-center bg-surface-elevated p-4">
                {set.set_image_url ? (
                  <img
                    src={set.set_image_url}
                    alt={set.set_name}
                    className="h-full max-h-24 w-auto object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <PokedexIcon className="h-12 w-12 text-muted opacity-40" />
                )}
              </div>

              {/* Set info */}
              <div className="flex flex-1 flex-col p-3">
                <p className="truncate text-xs font-semibold text-foreground">
                  {set.set_name}
                </p>
                <p className="mt-0.5 text-[10px] text-muted">
                  {set.owned_count} / {set.total_count} cards
                </p>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04 + 0.2 }}
                    className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-accent'}`}
                  />
                </div>
                <p className={`mt-1 text-[10px] font-medium ${isComplete ? 'text-green-500' : 'text-muted'}`}>
                  {pct}%{isComplete && ' Complete!'}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Set detail modal */}
      <AnimatePresence>
        {selectedSet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl rounded-2xl border border-border bg-background p-6 shadow-warm-lg"
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal header */}
              <div className="mb-6 flex items-center gap-4">
                {selectedSet.set_image_url ? (
                  <img
                    src={selectedSet.set_image_url}
                    alt={selectedSet.set_name}
                    className="h-14 w-auto object-contain"
                  />
                ) : (
                  <PokedexIcon className="h-10 w-10 text-red-500" />
                )}
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {selectedSet.set_name}
                  </h2>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-sm text-muted">
                      {selectedSet.owned_count} / {selectedSet.total_count} cards
                    </span>
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-elevated">
                      <div
                        className={`h-full rounded-full ${
                          selectedSet.owned_count === selectedSet.total_count
                            ? 'bg-green-500'
                            : 'bg-accent'
                        }`}
                        style={{
                          width: `${selectedSet.total_count > 0 ? Math.round((selectedSet.owned_count / selectedSet.total_count) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted">
                      {selectedSet.total_count > 0
                        ? Math.round((selectedSet.owned_count / selectedSet.total_count) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Card grid */}
              {loadingSet === selectedSet.set_id ? (
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-2.5/3.5 animate-pulse rounded-lg bg-surface-elevated"
                    />
                  ))}
                </div>
              ) : setCards[selectedSet.set_id] ? (
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
                  {setCards[selectedSet.set_id].map((card) => {
                    const rarityConfig = RARITY_CONFIG[card.card_rarity as Rarity];
                    return (
                      <div
                        key={card.card_id}
                        className="group relative"
                        title={`${card.card_name} (${rarityConfig?.label ?? card.card_rarity})${card.owned ? '' : ' — Not collected'}`}
                      >
                        <img
                          src={card.card_image_url}
                          alt={card.card_name}
                          className={`aspect-2.5/3.5 w-full rounded-lg object-cover transition-all ${
                            card.owned
                              ? 'shadow-warm-sm'
                              : 'brightness-[0.3] grayscale opacity-50'
                          }`}
                        />
                        {card.owned && (
                          <div
                            className="absolute bottom-0.5 right-0.5 rounded-full px-1 text-[8px] font-bold"
                            style={{
                              backgroundColor: rarityConfig?.color ?? '#9CA3AF',
                              color: '#fff',
                            }}
                          >
                            {rarityConfig?.label?.[0] ?? '?'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
