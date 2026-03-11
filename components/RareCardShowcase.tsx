'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RARITY_CONFIG } from '@/lib/constants';
import { RarityBadge } from './RarityBadge';
import type { Card, Rarity } from '@/types';

type FeaturedCard = Pick<Card, 'id' | 'name' | 'image_url' | 'image_url_hires' | 'rarity'>;

export function RareCardShowcase({ cards }: { cards: FeaturedCard[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate every 4 seconds
  useEffect(() => {
    if (cards.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [cards.length]);

  if (cards.length === 0) return null;

  const card = cards[activeIndex];
  const config = RARITY_CONFIG[card.rarity as Rarity];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card display with holo effect */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.92, rotateY: -8 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.92, rotateY: 8 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            style={{ perspective: '800px' }}
          >
            {/* Rarity glow behind card */}
            <div
              className="absolute -inset-3 rounded-2xl blur-xl opacity-40"
              style={{ backgroundColor: config?.color ?? '#C8972E' }}
            />
            <div className="relative w-[180px] sm:w-[200px] lg:w-[220px] overflow-hidden rounded-xl shadow-warm-lg">
              <img
                src={card.image_url_hires || card.image_url}
                alt={card.name}
                className="w-full select-none"
                draggable={false}
              />
              {/* Holographic overlay */}
              <div className="holo-overlay active absolute inset-0 rounded-xl" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Card info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={card.id + '-info'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-1.5"
        >
          <p className="text-sm font-semibold text-foreground">{card.name}</p>
          <RarityBadge rarity={card.rarity as Rarity} />
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      {cards.length > 1 && (
        <div className="flex items-center gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === activeIndex ? 16 : 6,
                backgroundColor: i === activeIndex ? (config?.color ?? '#C8972E') : 'var(--color-border)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
