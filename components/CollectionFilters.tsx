'use client';

import { Rarity } from '@/types';
import { RARITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { Search } from 'lucide-react';

const ALL_RARITIES = Object.values(Rarity);

export function CollectionFilters({
  selectedRarities,
  onRaritiesChange,
  selectedSet,
  onSetChange,
  search,
  onSearchChange,
  sets,
  totalCards,
  uniqueCards,
}: {
  selectedRarities: Rarity[];
  onRaritiesChange: (r: Rarity[]) => void;
  selectedSet: string;
  onSetChange: (s: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  sets: string[];
  totalCards: number;
  uniqueCards: number;
}) {
  const toggleRarity = (r: Rarity) => {
    if (selectedRarities.includes(r)) {
      onRaritiesChange(selectedRarities.filter((x) => x !== r));
    } else {
      onRaritiesChange([...selectedRarities, r]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted">
        <span>
          <strong className="text-foreground">{totalCards}</strong> total
        </span>
        <span className="text-muted-dim">/</span>
        <span>
          <strong className="text-foreground">{uniqueCards}</strong> unique
        </span>
      </div>

      {/* Search + set filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cards..."
            className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-dim transition-colors focus:border-foreground focus:outline-none"
          />
        </div>

        {sets.length > 1 && (
          <select
            value={selectedSet}
            onChange={(e) => onSetChange(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors focus:border-foreground focus:outline-none"
          >
            <option value="all">All sets</option>
            {sets.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Rarity pills */}
      <div className="flex flex-wrap gap-2">
        {ALL_RARITIES.map((r) => {
          const config = RARITY_CONFIG[r];
          const isSelected = selectedRarities.includes(r);
          return (
            <button
              key={r}
              onClick={() => toggleRarity(r)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97]',
                isSelected
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted border-border hover:border-muted-dim'
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
