'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import type { Card } from '@/types';

type FeaturedCard = Pick<Card, 'id' | 'name' | 'image_url' | 'image_url_hires' | 'rarity'>;

const CARD_POSITIONS = [
  // Front-center cluster (highest z, most visible)
  { x: 0, y: -30, rotate: -6, scale: 1, z: 4, floatDuration: 4.2, opacity: 1 },
  { x: 130, y: -60, rotate: 8, scale: 0.92, z: 3, floatDuration: 3.6, opacity: 1 },
  { x: -100, y: 10, rotate: -12, scale: 0.88, z: 3, floatDuration: 5.0, opacity: 1 },
  // Mid-depth cards
  { x: 190, y: 20, rotate: 15, scale: 0.78, z: 2, floatDuration: 4.8, opacity: 0.85 },
  { x: -50, y: -100, rotate: 4, scale: 0.8, z: 2, floatDuration: 3.8, opacity: 0.85 },
  { x: -180, y: -50, rotate: -18, scale: 0.75, z: 1, floatDuration: 4.4, opacity: 0.65 },
  // Background cards (low z, faded for depth-of-field)
  { x: 240, y: -90, rotate: 22, scale: 0.65, z: 0, floatDuration: 5.4, opacity: 0.45 },
  { x: -210, y: 40, rotate: -25, scale: 0.6, z: 0, floatDuration: 5.8, opacity: 0.4 },
  { x: 60, y: 50, rotate: 10, scale: 0.55, z: 0, floatDuration: 6.0, opacity: 0.35 },
  { x: -140, y: -120, rotate: -8, scale: 0.58, z: 0, floatDuration: 5.2, opacity: 0.38 },
];

const CYCLE_INTERVAL = 3500;

export function HeroCardStack({ cards }: { cards: FeaturedCard[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  // Track which card index from the pool is shown at each position
  const [cardSlots, setCardSlots] = useState<number[]>(() =>
    CARD_POSITIONS.map((_, i) => i % cards.length)
  );

  const cycleCards = useCallback(() => {
    if (cards.length <= CARD_POSITIONS.length) return;

    setCardSlots((prev) => {
      const next = [...prev];
      const activeIds = new Set(next);

      // Swap 1-2 cards per tick
      const swapCount = Math.random() < 0.4 ? 2 : 1;
      // Shuffle position indices to pick random slots
      const shuffledPositions = [...Array(CARD_POSITIONS.length).keys()]
        .sort(() => Math.random() - 0.5);

      let swapped = 0;
      for (const posIdx of shuffledPositions) {
        if (swapped >= swapCount) break;

        // Find a card not currently displayed
        const available: number[] = [];
        for (let idx = 0; idx < cards.length; idx++) {
          if (!activeIds.has(idx)) available.push(idx);
        }
        if (available.length === 0) break;

        const newIdx = available[Math.floor(Math.random() * available.length)];
        activeIds.delete(next[posIdx]);
        activeIds.add(newIdx);
        next[posIdx] = newIdx;
        swapped++;
      }
      return next;
    });
  }, [cards.length]);

  useEffect(() => {
    if (cards.length <= CARD_POSITIONS.length) return;
    const interval = setInterval(cycleCards, CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, [cycleCards, cards.length]);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-[340px] w-full sm:h-[420px] lg:h-[500px]"
    >
      {CARD_POSITIONS.map((pos, i) => {
        const card = cards[cardSlots[i]];
        if (!card) return null;
        return (
          <CardSlot
            key={`slot-${i}`}
            card={card}
            position={pos}
            smoothX={smoothX}
            smoothY={smoothY}
            index={i}
          />
        );
      })}
    </div>
  );
}

function CardSlot({
  card,
  position,
  smoothX,
  smoothY,
  index,
}: {
  card: FeaturedCard;
  position: (typeof CARD_POSITIONS)[number];
  smoothX: ReturnType<typeof useSpring>;
  smoothY: ReturnType<typeof useSpring>;
  index: number;
}) {
  const parallaxFactor = (position.z + 1) * 12;
  const px = useTransform(smoothX, (v) => v * parallaxFactor);
  const py = useTransform(smoothY, (v) => v * parallaxFactor);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-[150px] sm:w-[175px] lg:w-[210px]"
      initial={{ opacity: 0, x: 60, rotate: position.rotate + 10 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      transition={{
        duration: 0.7,
        delay: 0.3 + index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        x: px,
        y: py,
        zIndex: position.z,
        marginLeft: position.x,
        marginTop: position.y,
        rotate: position.rotate,
        scale: position.scale,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: position.opacity, scale: 1 }}
          exit={{ opacity: 0, scale: 0.88 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: position.floatDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            <img
              src={card.image_url}
              alt={card.name}
              width={170}
              height={238}
              className="rounded-xl shadow-warm-lg select-none pointer-events-none"
              draggable={false}
              loading="eager"
              decoding="async"
              fetchPriority={position.z >= 3 ? 'high' : 'auto'}
            />
            {/* Holographic shimmer on front-most card */}
            {position.z >= 4 && (
              <div className="holo-overlay active absolute inset-0 rounded-xl" />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
