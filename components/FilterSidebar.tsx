'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { FilterSection } from './FilterSection';
import { RARITY_CONFIG } from '@/lib/constants';
import type { Card } from '@/types';
import { Rarity } from '@/types';

export interface FilterState {
  supertypes: string[];
  types: string[];
  rarities: string[];
  subtypes: string[];
  search: string;
}

export const emptyFilters: FilterState = {
  supertypes: [],
  types: [],
  rarities: [],
  subtypes: [],
  search: '',
};

interface FilterSidebarProps {
  cards: Card[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

function CheckboxItem({
  label,
  count,
  checked,
  onChange,
  colorDot,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
  colorDot?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm transition-colors hover:bg-surface-elevated">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-border accent-accent"
      />
      {colorDot && (
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: colorDot }}
        />
      )}
      <span className="flex-1 text-foreground">{label}</span>
      <span className="text-xs tabular-nums text-muted-dim">{count}</span>
    </label>
  );
}

function SearchableList({
  items,
  selected,
  onToggle,
  getColor,
}: {
  items: { label: string; count: number }[];
  selected: string[];
  onToggle: (label: string, checked: boolean) => void;
  getColor?: (label: string) => string | undefined;
}) {
  const [query, setQuery] = useState('');
  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div className="space-y-1">
      {items.length > 6 && (
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-dim" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search...`}
            className="w-full rounded-md border border-border bg-surface-elevated py-1 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-dim focus:outline-none focus:border-accent"
          />
        </div>
      )}
      {filtered.map((item) => (
        <CheckboxItem
          key={item.label}
          label={item.label}
          count={item.count}
          checked={selected.includes(item.label)}
          onChange={(checked) => onToggle(item.label, checked)}
          colorDot={getColor?.(item.label)}
        />
      ))}
    </div>
  );
}

export function FilterSidebar({ cards, filters, onFilterChange }: FilterSidebarProps) {
  const counts = useMemo(() => {
    const supertypes: Record<string, number> = {};
    const types: Record<string, number> = {};
    const rarities: Record<string, number> = {};
    const subtypes: Record<string, number> = {};

    cards.forEach((card) => {
      supertypes[card.supertype] = (supertypes[card.supertype] || 0) + 1;
      card.types?.forEach((t) => {
        types[t] = (types[t] || 0) + 1;
      });
      rarities[card.rarity] = (rarities[card.rarity] || 0) + 1;
      card.subtypes?.forEach((s) => {
        subtypes[s] = (subtypes[s] || 0) + 1;
      });
    });

    return { supertypes, types, rarities, subtypes };
  }, [cards]);

  const toItems = (record: Record<string, number>) =>
    Object.entries(record)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count]) => ({ label, count }));

  const toggleFilter = (key: keyof FilterState, value: string, checked: boolean) => {
    const current = filters[key] as string[];
    const next = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    onFilterChange({ ...filters, [key]: next });
  };

  const hasActiveFilters =
    filters.supertypes.length > 0 ||
    filters.types.length > 0 ||
    filters.rarities.length > 0 ||
    filters.subtypes.length > 0;

  const getRarityColor = (label: string) => {
    const entry = Object.values(RARITY_CONFIG).find((r) => r.label === label);
    return entry?.color;
  };

  return (
    <div className="space-y-0">
      <FilterSection title="Supertype" defaultOpen count={Object.keys(counts.supertypes).length}>
        <SearchableList
          items={toItems(counts.supertypes)}
          selected={filters.supertypes}
          onToggle={(label, checked) => toggleFilter('supertypes', label, checked)}
        />
      </FilterSection>

      <FilterSection title="Type" count={Object.keys(counts.types).length}>
        <SearchableList
          items={toItems(counts.types)}
          selected={filters.types}
          onToggle={(label, checked) => toggleFilter('types', label, checked)}
        />
      </FilterSection>

      <FilterSection title="Rarity" count={Object.keys(counts.rarities).length}>
        <SearchableList
          items={toItems(counts.rarities)}
          selected={filters.rarities}
          onToggle={(label, checked) => toggleFilter('rarities', label, checked)}
          getColor={getRarityColor}
        />
      </FilterSection>

      <FilterSection title="Subtype" count={Object.keys(counts.subtypes).length}>
        <SearchableList
          items={toItems(counts.subtypes)}
          selected={filters.subtypes}
          onToggle={(label, checked) => toggleFilter('subtypes', label, checked)}
        />
      </FilterSection>

      {hasActiveFilters && (
        <button
          onClick={() => onFilterChange(emptyFilters)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs text-muted transition-colors hover:text-foreground hover:border-foreground"
        >
          <X className="h-3 w-3" />
          Clear all filters
        </button>
      )}
    </div>
  );
}
