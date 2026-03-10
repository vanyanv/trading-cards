'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG } from '@/lib/constants';
import { rarityOrder } from '@/lib/rarity';
import { RarityBadge } from './RarityBadge';
import type { PulledCard, Rarity } from '@/types';
import { RotateCcw } from 'lucide-react';
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

  const sortedCards = [...cards].sort(
    (a, b) => rarityOrder(a.rarity) - rarityOrder(b.rarity)
  );

  const startOpening = useCallback(() => {
    setPhase('shaking');
    setTimeout(() => setPhase('opening'), 1000);
    setTimeout(() => {
      setPhase('revealing');
      sortedCards.forEach((_, i) => {
        setTimeout(() => {
          setRevealedIndex(i);
          if (i === sortedCards.length - 1) {
            setTimeout(() => setPhase('complete'), 1200);
          }
        }, i * 600);
      });
    }, 1800);
  }, [sortedCards]);

  const bestPull = sortedCards[sortedCards.length - 1];
  const bestConfig = RARITY_CONFIG[bestPull?.rarity as Rarity];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      {/* White flash during opening */}
      <AnimatePresence>
        {phase === 'opening' && (
          <motion.div
            className="fixed inset-0 z-50 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* SEALED + SHAKING + OPENING */}
        {(phase === 'sealed' || phase === 'shaking' || phase === 'opening') && (
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
                      rotate: [0, -1.5, 1.5, -1, 1, -0.5, 0.5, 0],
                      transition: { duration: 0.8, ease: 'easeInOut' },
                    }
                  : phase === 'opening'
                    ? {
                        scale: [1, 1.08, 0],
                        opacity: [1, 1, 0],
                        transition: { duration: 0.6, ease: 'easeIn' },
                      }
                    : {}
              }
            >
              {/* Subtle pulse ring */}
              {phase === 'sealed' && (
                <motion.div
                  className="absolute -inset-3 rounded-xl border border-border"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <div className="relative h-96 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                <img
                  src={packImage}
                  alt={packName}
                  className="h-full w-full object-contain p-6"
                />
              </div>
            </motion.div>

            {phase === 'sealed' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-sm text-muted"
              >
                Tap to open
              </motion.p>
            )}
          </motion.div>
        )}

        {/* REVEALING */}
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
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {/* Front face */}
                      <div
                        className={cn(
                          'backface-hidden absolute inset-0 overflow-hidden rounded-lg border',
                          isRevealed ? config.borderClass : 'border-border'
                        )}
                      >
                        <img
                          src={card.image_url}
                          alt={card.name}
                          className="h-full w-full object-contain"
                        />
                        {card.is_reverse_holo && (
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/10" />
                        )}
                        {/* White flash on reveal */}
                        {isRevealed && (
                          <motion.div
                            className="pointer-events-none absolute inset-0 z-20 rounded-lg bg-white"
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                          <p className="truncate text-xs font-medium text-white">
                            {card.name}
                          </p>
                          <RarityBadge
                            rarity={card.rarity as Rarity}
                            className="mt-0.5 text-[9px]"
                          />
                        </div>
                      </div>

                      {/* Back face */}
                      <div className="backface-hidden rotate-y-180 absolute inset-0 overflow-hidden rounded-lg border border-border bg-surface-elevated">
                        <div className="flex h-full items-center justify-center">
                          <div className="h-16 w-16 rounded-full border border-border bg-surface" />
                        </div>
                        <div className="absolute inset-2 rounded-md border border-border/50" />
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
                  transition={{ duration: 0.6 }}
                  className="mt-10 flex flex-col items-center gap-6"
                >
                  <div className="h-px w-16 bg-border" />

                  {rarityOrder(bestPull.rarity) >= 3 && (
                    <p
                      className="text-lg font-semibold"
                      style={{ color: bestConfig.color }}
                    >
                      You pulled a {bestPull.rarity}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={onOpenAnother}
                      className="flex items-center gap-2 rounded-md bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 active:opacity-70"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Open another
                    </button>
                    <Link
                      href="/collection"
                      className="flex items-center gap-2 rounded-md border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
                    >
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
