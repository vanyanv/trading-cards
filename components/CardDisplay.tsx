'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus, Sparkles, HandCoins } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RARITY_CONFIG, EDITION_CONFIG } from '@/lib/constants';
import { RarityBadge } from './RarityBadge';
import type { Card, Rarity, Edition } from '@/types';

function getCardNumber(tcgId: string): string {
  const parts = tcgId.split('-');
  return parts[parts.length - 1];
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-red-400" />;
  return <Minus className="h-3 w-3 text-muted-dim" />;
}

export function CardDisplay({
  card,
  isReverseHolo = false,
  onClick,
  className,
  animate = true,
  index = 0,
  owned,
  sellMode = false,
  selected = false,
  onSelect,
  sellPrice,
  onQuickSell,
  edition,
}: {
  card: Card;
  isReverseHolo?: boolean;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
  index?: number;
  owned?: number;
  sellMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  sellPrice?: number;
  onQuickSell?: () => void;
  edition?: Edition | null;
}) {
  const Wrapper = animate ? motion.div : 'div';
  const animateProps = animate
    ? {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.4,
          delay: Math.min(index * 0.03, 0.6),
          ease: [0.16, 1, 0.3, 1] as const,
        },
      }
    : {};

  const isUnowned = owned !== undefined && owned === 0;
  const cardNumber = getCardNumber(card.tcg_id);

  return (
    <Wrapper
      {...animateProps}
      className={cn('group cursor-pointer', isUnowned && 'opacity-45', className)}
      onClick={sellMode ? onSelect : onClick}
    >
      <div className={cn(
        'overflow-hidden rounded-xl border bg-surface shadow-warm-sm transition-all duration-300 hover:shadow-warm-md',
        selected
          ? 'border-accent shadow-[0_0_12px_rgba(200,151,46,0.25)] -translate-y-0.5'
          : 'border-border hover:border-border'
      )}>
        <div className="relative aspect-[2.5/3.5] overflow-hidden">
          <Image
            src={card.image_url}
            alt={card.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="h-full w-full object-contain"
          />
          {isReverseHolo && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/10" />
          )}
          {sellMode && (
            <div className="absolute left-2 top-2 z-10">
              <div className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200',
                selected
                  ? 'border-accent bg-accent'
                  : 'border-white/70 bg-black/30'
              )}>
                {selected && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}
          {!sellMode && onQuickSell && (
            <button
              onClick={(e) => { e.stopPropagation(); onQuickSell(); }}
              className="absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-accent hover:scale-110 group-hover:opacity-100"
              title={`Sell for $${sellPrice?.toFixed(2) ?? '—'}`}
            >
              <HandCoins className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="p-2.5">
          <p className="truncate text-sm font-medium">
            {card.name}{' '}
            <span className="text-muted-dim">#{cardNumber}</span>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <RarityBadge rarity={card.rarity as Rarity} />
            {isReverseHolo && (
              <span className="text-[10px] font-medium text-muted-dim">
                Reverse Holo
              </span>
            )}
            {edition && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${EDITION_CONFIG[edition].badgeClass}`}
              >
                {EDITION_CONFIG[edition].shortLabel}
              </span>
            )}
          </div>
          {card.price != null && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className="text-sm font-semibold tabular-nums"
                style={card.price >= 10 ? {
                  textShadow: `0 0 8px ${RARITY_CONFIG[card.rarity as Rarity]?.color ?? '#C8972E'}40`,
                } : undefined}
              >
                ${card.price.toFixed(2)}
              </span>
              {card.condition && card.condition !== 'NM' && (
                <span className="text-[10px] text-muted-dim">({card.condition})</span>
              )}
              {card.price_trend === 'up' && (
                <Sparkles className="h-3 w-3 text-amber-400" />
              )}
              <TrendIcon trend={card.price_trend} />
            </div>
          )}
          {sellMode && sellPrice != null && (
            <p className="mt-0.5 text-xs font-medium text-accent tabular-nums">
              Sell: ${sellPrice.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
