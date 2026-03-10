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
  const Wrapper = animate ? motion.div : 'div';
  const animateProps = animate
    ? {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.4,
          delay: index * 0.03,
          ease: [0.16, 1, 0.3, 1] as const,
        },
      }
    : {};

  return (
    <Wrapper
      {...animateProps}
      className={cn('group cursor-pointer', className)}
      onClick={onClick}
    >
      <div className="overflow-hidden rounded-lg border border-border bg-surface transition-all duration-300 hover:shadow-md hover:border-muted-dim">
        <div className="relative aspect-[2.5/3.5] overflow-hidden">
          <img
            src={card.image_url}
            alt={card.name}
            className="h-full w-full object-contain"
            loading="lazy"
          />
          {isReverseHolo && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/10" />
          )}
        </div>

        <div className="p-2.5">
          <p className="truncate text-sm font-medium">{card.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <RarityBadge rarity={card.rarity as Rarity} />
            {isReverseHolo && (
              <span className="text-[10px] font-medium text-muted-dim">
                Reverse Holo
              </span>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
