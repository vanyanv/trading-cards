'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus, HandCoins } from 'lucide-react';
import { RarityBadge } from './RarityBadge';
import { RARITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Card, Rarity } from '@/types';

function getCardNumber(tcgId: string): string {
  const parts = tcgId.split('-');
  return parts[parts.length - 1];
}

type SortKey = 'number' | 'name' | 'rarity' | 'hp' | 'price';
type SortDir = 'asc' | 'desc';

function SortHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      className={cn(
        'cursor-pointer select-none px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-foreground',
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (currentDir === 'asc' ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        ))}
      </span>
    </th>
  );
}

export function CardTable({
  cards,
  onCardClick,
  ownedMap,
  sellMode = false,
  selectedIds,
  onToggleSelect,
  sellPriceMap,
  onQuickSell,
}: {
  cards: Card[];
  onCardClick?: (card: Card) => void;
  ownedMap?: Map<string, number>;
  sellMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (cardId: string) => void;
  sellPriceMap?: Map<string, number>;
  onQuickSell?: (cardId: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('number');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...cards].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'number':
        return dir * (parseInt(getCardNumber(a.tcg_id)) - parseInt(getCardNumber(b.tcg_id)));
      case 'name':
        return dir * a.name.localeCompare(b.name);
      case 'rarity':
        return dir * ((RARITY_CONFIG[a.rarity]?.order ?? 0) - (RARITY_CONFIG[b.rarity]?.order ?? 0));
      case 'hp':
        return dir * ((parseInt(a.hp || '0') || 0) - (parseInt(b.hp || '0') || 0));
      case 'price':
        return dir * ((a.price ?? 0) - (b.price ?? 0));
      default:
        return 0;
    }
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface-elevated">
          <tr className="border-b border-border">
            {sellMode && (
              <th className="w-10 px-3 py-2">
                <div
                  onClick={() => {
                    if (!onToggleSelect) return;
                    const allSelected = sorted.every((c) => selectedIds?.has(c.id));
                    sorted.forEach((c) => {
                      const isSelected = selectedIds?.has(c.id);
                      if (allSelected ? isSelected : !isSelected) onToggleSelect(c.id);
                    });
                  }}
                  className={cn(
                    'flex h-4 w-4 cursor-pointer items-center justify-center rounded border-2 transition-all',
                    sorted.length > 0 && sorted.every((c) => selectedIds?.has(c.id))
                      ? 'border-accent bg-accent'
                      : 'border-muted-dim'
                  )}
                >
                  {sorted.length > 0 && sorted.every((c) => selectedIds?.has(c.id)) && (
                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </th>
            )}
            <SortHeader label="#" sortKey="number" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="w-12" />
            <th className="w-10 px-2 py-2" />
            <SortHeader label="Name" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <th className="hidden px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Set</th>
            <SortHeader label="Rarity" sortKey="rarity" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
            <SortHeader label="HP" sortKey="hp" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
            <SortHeader label="Price" sortKey="price" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            {sellMode && <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-accent">Sell</th>}
            {ownedMap && (
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">Owned</th>
            )}
            {!sellMode && onQuickSell && (
              <th className="w-12 px-3 py-2" />
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((card) => {
            const num = getCardNumber(card.tcg_id);
            const ownedCount = ownedMap?.get(card.id);
            const isUnowned = ownedMap !== undefined && !ownedCount;
            return (
              <tr
                key={card.id}
                onClick={() => sellMode ? onToggleSelect?.(card.id) : onCardClick?.(card)}
                className={cn(
                  'cursor-pointer border-b border-border transition-colors',
                  selectedIds?.has(card.id)
                    ? 'bg-accent/5'
                    : 'hover:bg-surface-elevated',
                  isUnowned && 'opacity-45'
                )}
              >
                {sellMode && (
                  <td className="px-3 py-2">
                    <div className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border-2 transition-all',
                      selectedIds?.has(card.id)
                        ? 'border-accent bg-accent'
                        : 'border-muted-dim'
                    )}>
                      {selectedIds?.has(card.id) && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-3 py-2 tabular-nums text-muted-dim">{num}</td>
                <td className="px-2 py-1">
                  <Image
                    src={card.image_url}
                    alt={card.name}
                    width={24}
                    height={32}
                    className="h-8 w-6 rounded-sm object-contain"
                  />
                </td>
                <td className="px-3 py-2 font-medium">{card.name}</td>
                <td className="hidden px-3 py-2 text-muted md:table-cell">{card.set_name}</td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  <RarityBadge rarity={card.rarity as Rarity} />
                </td>
                <td className="hidden px-3 py-2 tabular-nums text-muted md:table-cell">
                  {card.hp || '—'}
                </td>
                <td className="px-3 py-2">
                  {card.price != null ? (
                    <span className="flex items-center gap-1 font-semibold tabular-nums">
                      ${card.price.toFixed(2)}
                      {card.price_source === 'estimate' && (
                        <span className="text-[9px] text-muted-dim">est.</span>
                      )}
                      {card.condition && card.condition !== 'NM' && (
                        <span className="text-[10px] text-muted-dim">({card.condition})</span>
                      )}
                      {card.price_trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                      {card.price_trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
                      {card.price_trend === 'stable' && <Minus className="h-3 w-3 text-muted-dim" />}
                    </span>
                  ) : (
                    <span className="text-muted-dim">—</span>
                  )}
                </td>
                {sellMode && (
                  <td className="px-3 py-2 text-sm font-semibold text-accent tabular-nums">
                    {sellPriceMap?.get(card.id) != null
                      ? `$${sellPriceMap.get(card.id)!.toFixed(2)}`
                      : '—'}
                  </td>
                )}
                {ownedMap && (
                  <td className="px-3 py-2 tabular-nums">
                    {ownedCount ? (
                      <span className="text-emerald-500 font-medium">{ownedCount}x</span>
                    ) : (
                      <span className="text-muted-dim">—</span>
                    )}
                  </td>
                )}
                {!sellMode && onQuickSell && (
                  <td className="px-3 py-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuickSell(card.id); }}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-dim transition-all hover:bg-accent/10 hover:text-accent"
                      title={`Sell for $${sellPriceMap?.get(card.id)?.toFixed(2) ?? '—'}`}
                    >
                      <HandCoins className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
