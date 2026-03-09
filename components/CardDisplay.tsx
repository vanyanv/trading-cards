'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG } from '@/lib/constants';
import { RarityBadge } from './RarityBadge';
import type { Card, Rarity } from '@/types';

export function CardDisplay({
  card,
  isReverseHolo = false,
  onClick,
  className,
  animate = true,
  index = 0,
}: {
  card: Card;
  isReverseHolo?: boolean;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
  index?: number;
}) {
  const config = RARITY_CONFIG[card.rarity as Rarity];
  const isSpecial =
    card.rarity === 'Special Illustration Rare' ||
    card.rarity === 'Hyper Rare';

  const Wrapper = animate ? motion.div : 'div';
  const animateProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.4,
          delay: index * 0.05,
          ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
      }
    : {};

  return (
    <Wrapper
      {...animateProps}
      className={cn(
        'group relative cursor-pointer',
        isSpecial &&
          (card.rarity === 'Hyper Rare'
            ? 'animated-border-special animated-border-hyper'
            : 'animated-border-special'),
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-surface transition-all duration-300',
          isSpecial ? 'border-transparent' : config.borderClass,
          'hover:scale-[1.02]'
        )}
        style={{
          boxShadow: `0 0 20px ${config.glowColor}`,
        }}
      >
        <div className="relative aspect-[2.5/3.5] overflow-hidden">
          <img
            src={card.image_url}
            alt={card.name}
            className="h-full w-full object-contain"
            loading="lazy"
          />
          {isReverseHolo && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
          )}
          {card.rarity === 'Hyper Rare' && (
            <div className="pointer-events-none absolute inset-0 shimmer" />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
          <p className="truncate text-sm font-semibold">{card.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <RarityBadge rarity={card.rarity as Rarity} />
            {isReverseHolo && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
                Reverse Holo
              </span>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
