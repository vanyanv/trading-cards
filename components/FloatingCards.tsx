'use client';

import { useState, useEffect, useMemo, useSyncExternalStore, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { RARITY_CONFIG } from '@/lib/constants';
import type { Rarity } from '@/types';

interface ShowcaseCard {
  id: string;
  name: string;
  image_url: string;
  rarity: Rarity;
}

// Hydration-safe mount detection using useSyncExternalStore
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
}

interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  drift: number;
  duration: number;
}

function hexToGlow(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `0 0 24px 10px rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate card positions that avoid the center zone where the form sits.
 * Center exclusion: x 30%-70%, y 25%-75% on desktop; x 20%-80%, y 30%-70% on mobile.
 */
function generatePositions(
  count: number,
  isMobile: boolean
): CardPosition[] {
  const positions: CardPosition[] = [];
  const minW = isMobile ? 60 : 80;
  const maxW = isMobile ? 80 : 120;

  // Exclusion zone for the center form
  const exclX = isMobile ? [20, 80] : [30, 70];
  const exclY = isMobile ? [30, 70] : [25, 75];

  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;

    // Generate positions outside the exclusion zone
    let attempts = 0;
    do {
      x = randomInRange(5, 90);
      y = randomInRange(5, 90);
      attempts++;
    } while (
      x > exclX[0] && x < exclX[1] &&
      y > exclY[0] && y < exclY[1] &&
      attempts < 20
    );

    const width = Math.round(randomInRange(minW, maxW));
    const height = Math.round(width * 1.4);

    positions.push({
      x,
      y,
      width,
      height,
      rotation: randomInRange(-20, 20),
      opacity: randomInRange(0.5, 0.8),
      drift: randomInRange(20, 40),
      duration: randomInRange(20, 35),
    });
  }

  return positions;
}

export function FloatingCards() {
  const [cards, setCards] = useState<ShowcaseCard[]>([]);
  const mounted = useIsMounted();
  const prefersReducedMotion = usePrefersReducedMotion();

  const fetchCards = useCallback(() => {
    fetch('/api/cards/showcase')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCards(data.cards ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const isMobile = mounted && typeof window !== 'undefined' && window.innerWidth < 768;
  const cardCount = isMobile ? 4 : 8;
  const displayCards = cards.slice(0, cardCount);

  const positions = useMemo(
    () => (mounted ? generatePositions(cardCount, isMobile) : []),
    [mounted, cardCount, isMobile]
  );

  if (!mounted || displayCards.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {displayCards.map((card, i) => {
        const pos = positions[i];
        if (!pos) return null;

        const rarityColor =
          RARITY_CONFIG[card.rarity as Rarity]?.color ?? '#FBBF24';
        const glowShadow = hexToGlow(rarityColor, 0.5);

        return (
          <motion.div
            key={card.id}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              willChange: 'transform',
            }}
            initial={{ opacity: 0 }}
            animate={
              prefersReducedMotion
                ? {
                    opacity: pos.opacity,
                    rotate: pos.rotation,
                  }
                : {
                    opacity: pos.opacity,
                    x: [0, pos.drift, -pos.drift, 0],
                    y: [0, -pos.drift, pos.drift, 0],
                    rotate: [
                      pos.rotation,
                      pos.rotation + 5,
                      pos.rotation - 5,
                      pos.rotation,
                    ],
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.8 }
                : {
                    opacity: { duration: 0.8 },
                    x: {
                      duration: pos.duration,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                    y: {
                      duration: pos.duration,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                    rotate: {
                      duration: pos.duration,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
            }
          >
            <Image
              src={card.image_url}
              alt={card.name}
              width={pos.width}
              height={pos.height}
              loading="lazy"
              draggable={false}
              className="select-none rounded-lg"
              style={{ boxShadow: glowShadow }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
