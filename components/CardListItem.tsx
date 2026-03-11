'use client';

import Image from 'next/image';
import { TrendingUp, TrendingDown, Minus, HandCoins } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RarityBadge } from './RarityBadge';
import type { Card, Rarity } from '@/types';

function getCardNumber(tcgId: string): string {
  const parts = tcgId.split('-');
  return parts[parts.length - 1];
}

export function CardListItem({
  card,
  onClick,
  owned,
  sellMode = false,
  selected = false,
  onSelect,
  sellPrice,
  onQuickSell,
}: {
  card: Card;
  onClick?: () => void;
  owned?: number;
  sellMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  sellPrice?: number;
  onQuickSell?: () => void;
}) {
  const isUnowned = owned !== undefined && owned === 0;
  const cardNumber = getCardNumber(card.tcg_id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={sellMode ? onSelect : onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (sellMode ? onSelect : onClick)?.(); } }}
      className={cn(
        'group flex w-full items-center gap-4 rounded-lg border px-3 py-2 text-left transition-all cursor-pointer',
        selected
          ? 'border-accent bg-accent/5'
          : 'border-transparent hover:bg-surface-elevated hover:border-border',
        isUnowned && 'opacity-45'
      )}
    >
      {sellMode && (
        <div className={cn(
          'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          selected ? 'border-accent bg-accent' : 'border-muted-dim'
        )}>
          {selected && (
            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}
      <Image
        src={card.image_url}
        alt={card.name}
        width={36}
        height={48}
        className="h-12 w-9 rounded object-contain"
      />
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {card.name}{' '}
          <span className="text-muted-dim">#{cardNumber}</span>
        </span>
        <span className="hidden text-xs text-muted sm:block">{card.set_name}</span>
        <RarityBadge rarity={card.rarity as Rarity} />
        {card.types && card.types.length > 0 && (
          <span className="hidden text-xs text-muted md:block">
            {card.types.join(', ')}
          </span>
        )}
        {card.price != null && (
          <span className="flex items-center gap-1 text-sm font-semibold tabular-nums">
            ${card.price.toFixed(2)}
            {card.condition && card.condition !== 'NM' && (
              <span className="text-[10px] text-muted-dim">({card.condition})</span>
            )}
            {card.price_trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
            {card.price_trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
            {card.price_trend === 'stable' && <Minus className="h-3 w-3 text-muted-dim" />}
          </span>
        )}
        {sellMode && sellPrice != null && (
          <span className="text-xs font-medium text-accent tabular-nums">
            Sell: ${sellPrice.toFixed(2)}
          </span>
        )}
        {!sellMode && onQuickSell && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickSell(); }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-dim opacity-0 transition-all hover:bg-accent/10 hover:text-accent group-hover:opacity-100"
            title={`Sell for $${sellPrice?.toFixed(2) ?? '—'}`}
          >
            <HandCoins className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
