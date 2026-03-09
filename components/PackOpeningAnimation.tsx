'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG } from '@/lib/constants';
import { rarityOrder } from '@/lib/rarity';
import { RarityBadge } from './RarityBadge';
import type { PulledCard, Rarity } from '@/types';
import { Layers, RotateCcw } from 'lucide-react';
import Link from 'next/link';

type Phase = 'sealed' | 'shaking' | 'opening' | 'revealing' | 'complete';

export function PackOpeningAnimation({
  cards,
  packName,
  packImage,
  onOpenAnother,
}: {
  cards: PulledCard[];
  packName: string;
  packImage: string;
  onOpenAnother: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [revealedIndex, setRevealedIndex] = useState(-1);

  // Sort cards so rarest is revealed last
  const sortedCards = [...cards].sort(
    (a, b) => rarityOrder(a.rarity) - rarityOrder(b.rarity)
  );

  const startOpening = useCallback(() => {
    setPhase('shaking');
    setTimeout(() => setPhase('opening'), 600);
    setTimeout(() => {
      setPhase('revealing');
      // Reveal cards one by one
      sortedCards.forEach((_, i) => {
        setTimeout(() => {
          setRevealedIndex(i);
          if (i === sortedCards.length - 1) {
            setTimeout(() => setPhase('complete'), 800);
          }
        }, i * 400);
      });
    }, 1200);
  }, [sortedCards]);

  // Find the best pull for the summary
  const bestPull = sortedCards[sortedCards.length - 1];
  const bestConfig = RARITY_CONFIG[bestPull?.rarity as Rarity];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <AnimatePresence mode="wait">
        {/* SEALED + SHAKING + OPENING PHASES */}
        {(phase === 'sealed' ||
          phase === 'shaking' ||
          phase === 'opening') && (
          <motion.div
            key="pack"
            className="flex flex-col items-center"
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative cursor-pointer"
              onClick={phase === 'sealed' ? startOpening : undefined}
              animate={
                phase === 'shaking'
                  ? {
                      rotate: [0, -2, 2, -2, 2, 0],
                      transition: { duration: 0.4, ease: 'easeInOut' },
                    }
                  : phase === 'opening'
                    ? {
                        scale: [1, 1.05, 0],
                        opacity: [1, 1, 0],
                        transition: { duration: 0.6, ease: 'easeIn' },
                      }
                    : {}
              }
            >
              <div className="relative h-80 w-56 overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-2xl">
                <img
                  src={packImage}
                  alt={packName}
                  className="h-full w-full object-contain p-6"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-white/5 blur-2xl" />
            </motion.div>

            {phase === 'sealed' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-sm text-muted"
              >
                Tap to open
              </motion.p>
            )}
          </motion.div>
        )}

        {/* REVEALING PHASE */}
        {(phase === 'revealing' || phase === 'complete') && (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {sortedCards.map((card, i) => {
                const config = RARITY_CONFIG[card.rarity as Rarity];
                const isRevealed = i <= revealedIndex;

                return (
                  <div key={`${card.id}-${i}`} className="perspective-1000">
                    <motion.div
                      className="preserve-3d relative aspect-[2.5/3.5]"
                      initial={{ rotateY: 180 }}
                      animate={isRevealed ? { rotateY: 0 } : { rotateY: 180 }}
                      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      {/* Front face */}
                      <div
                        className={cn(
                          'backface-hidden absolute inset-0 overflow-hidden rounded-xl border',
                          config.borderClass
                        )}
                        style={{
                          boxShadow: isRevealed
                            ? `0 0 24px ${config.glowColor}`
                            : 'none',
                        }}
                      >
                        <img
                          src={card.image_url}
                          alt={card.name}
                          className="h-full w-full object-contain"
                        />
                        {card.is_reverse_holo && (
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
                        )}
                        {card.rarity === 'Hyper Rare' && (
                          <div className="pointer-events-none absolute inset-0 shimmer" />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                          <p className="truncate text-xs font-medium">
                            {card.name}
                          </p>
                          <RarityBadge
                            rarity={card.rarity as Rarity}
                            className="mt-0.5 text-[9px]"
                          />
                        </div>
                      </div>

                      {/* Back face */}
                      <div className="backface-hidden rotate-y-180 absolute inset-0 overflow-hidden rounded-xl border border-border bg-surface-elevated">
                        <div className="flex h-full items-center justify-center">
                          <div className="h-16 w-16 rounded-full bg-white/5" />
                        </div>
                        <div className="absolute inset-2 rounded-lg border border-white/5" />
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <AnimatePresence>
              {phase === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-8 flex flex-col items-center gap-4"
                >
                  {rarityOrder(bestPull.rarity) >= 3 && (
                    <p className="text-sm font-medium" style={{ color: bestConfig.color }}>
                      You pulled a {bestPull.rarity}!
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={onOpenAnother}
                      className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.97]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Open another
                    </button>
                    <Link
                      href="/collection"
                      className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted transition-all hover:border-white/20 hover:text-foreground active:scale-[0.97]"
                    >
                      <Layers className="h-4 w-4" />
                      Collection
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
