'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { DollarSign, ArrowRight, Package, Search, X, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import type { Pack, Edition } from '@/types';
import { groupPacks, type PackGroup } from '@/lib/packGroups';
import { EDITION_CONFIG } from '@/lib/constants';

type SortOption = 'popular' | 'newest' | 'name' | 'price-asc' | 'price-desc';
type PriceRange = 'all' | 'low' | 'mid' | 'high';

export function BrowsePacks({ packs }: { packs: Pack[] }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [setDropdownOpen, setSetDropdownOpen] = useState(false);
  const [setQuery, setSetQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSetDropdownOpen(false);
        setSetQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Unique sets with counts
  const setOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const pack of packs) {
      map.set(pack.set_name, (map.get(pack.set_name) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [packs]);

  // Filtered set options for dropdown search
  const filteredSetOptions = useMemo(() => {
    if (!setQuery) return setOptions;
    const q = setQuery.toLowerCase();
    return setOptions.filter((s) => s.name.toLowerCase().includes(q));
  }, [setOptions, setQuery]);

  // Price thresholds (thirds)
  const priceThresholds = useMemo(() => {
    const prices = packs.map((p) => p.price_usd ?? 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return null; // all same price — hide filter
    const third = (max - min) / 3;
    return { low: min + third, mid: min + 2 * third };
  }, [packs]);

  // Filter & sort
  const filteredPacks = useMemo(() => {
    let result = packs;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.set_name.toLowerCase().includes(q)
      );
    }

    if (selectedSets.length > 0) {
      result = result.filter((p) => selectedSets.includes(p.set_name));
    }

    if (priceRange !== 'all' && priceThresholds) {
      result = result.filter((p) => {
        const price = p.price_usd ?? 0;
        switch (priceRange) {
          case 'low':
            return price <= priceThresholds.low;
          case 'mid':
            return price > priceThresholds.low && price <= priceThresholds.mid;
          case 'high':
            return price > priceThresholds.mid;
          default:
            return true;
        }
      });
    }

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return (a.price_usd ?? 0) - (b.price_usd ?? 0);
        case 'price-desc':
          return (b.price_usd ?? 0) - (a.price_usd ?? 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
        default:
          return b.open_count - a.open_count;
      }
    });

    return groupPacks(sorted);
  }, [packs, search, selectedSets, priceRange, priceThresholds, sortBy]);

  const isFiltered =
    search !== '' || selectedSets.length > 0 || priceRange !== 'all';

  const toggleSet = (setName: string) => {
    setSelectedSets((prev) =>
      prev.includes(setName)
        ? prev.filter((s) => s !== setName)
        : [...prev, setName]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedSets([]);
    setPriceRange('all');
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Browse</h1>
        <p className="mt-1 text-sm text-muted">
          Explore all sets and their cards.
        </p>
      </div>

      <div className="mb-6 h-px bg-border" />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search packs..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-dim transition-colors focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors focus:border-accent focus:outline-none"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="name">Name A–Z</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {/* Filters row */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Set dropdown */}
        {setOptions.length > 1 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setSetDropdownOpen(!setDropdownOpen);
                setSetQuery('');
              }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                selectedSets.length > 0
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-surface text-foreground hover:border-accent'
              }`}
            >
              {selectedSets.length > 0
                ? `${selectedSets.length} set${selectedSets.length > 1 ? 's' : ''} selected`
                : 'All Sets'}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${setDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {setDropdownOpen && (
              <div className="absolute left-0 top-full z-30 mt-1.5 w-72 rounded-xl border border-border bg-surface shadow-warm-lg">
                {/* Search within dropdown */}
                <div className="border-b border-border p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-dim" />
                    <input
                      type="text"
                      value={setQuery}
                      onChange={(e) => setSetQuery(e.target.value)}
                      placeholder="Search sets..."
                      autoFocus
                      className="w-full rounded-lg border border-border bg-surface-elevated py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-dim focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Options list */}
                <div className="max-h-64 overflow-y-auto p-1">
                  {filteredSetOptions.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted">No sets found</p>
                  ) : (
                    filteredSetOptions.map(({ name, count }) => {
                      const isSelected = selectedSets.includes(name);
                      return (
                        <button
                          key={name}
                          onClick={() => toggleSet(name)}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? 'bg-surface-elevated text-foreground'
                              : 'text-muted hover:bg-surface-elevated hover:text-foreground'
                          }`}
                        >
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                            isSelected
                              ? 'border-accent bg-accent'
                              : 'border-border'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-background" />}
                          </div>
                          <span className="flex-1 truncate">{name}</span>
                          <span className="text-xs text-muted-dim">{count}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer with clear */}
                {selectedSets.length > 0 && (
                  <div className="border-t border-border p-2">
                    <button
                      onClick={() => {
                        setSelectedSets([]);
                        setSetDropdownOpen(false);
                        setSetQuery('');
                      }}
                      className="w-full rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                    >
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Price range pills */}
        {priceThresholds && (
          <>
            {(['all', 'low', 'mid', 'high'] as PriceRange[]).map((range) => {
              const label = { all: 'All prices', low: '$', mid: '$$', high: '$$$' }[range];
              return (
                <button
                  key={range}
                  onClick={() => setPriceRange(range)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    priceRange === range
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Results count & clear */}
      {isFiltered && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm text-muted">
            Showing {filteredPacks.length} of {groupPacks(packs).length} pack
            {groupPacks(packs).length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        </div>
      )}

      {/* Pack grid */}
      {filteredPacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted">No packs match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredPacks.map((group, i) => {
              const pack = group.displayPack;
              return (
                <motion.div
                  key={group.groupKey}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.45,
                    delay: i * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <div className="pack-card-glow group overflow-hidden rounded-2xl border border-border bg-surface shadow-warm-sm">
                    <Link href={`/pack/${pack.id}`}>
                      <div className="relative aspect-3/4 overflow-hidden bg-surface-elevated">
                        {pack.image_url ? (
                          <Image
                            src={pack.image_url}
                            alt={pack.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="h-full w-full object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.07]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-12 w-12 text-muted-dim" />
                          </div>
                        )}
                        {/* Edition dots indicator */}
                        {group.hasMultipleEditions && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
                            {group.editionVariants.map((v) => (
                              <div
                                key={v.id}
                                className="h-2 w-2 rounded-full ring-1 ring-white/20"
                                style={{ backgroundColor: EDITION_CONFIG[v.edition as Edition].color }}
                                title={EDITION_CONFIG[v.edition as Edition].label}
                              />
                            ))}
                            <span className="ml-0.5 text-[9px] font-semibold text-white/80">
                              {group.editionVariants.length} editions
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 pb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-dim">
                          {pack.set_name}
                        </p>
                        <h3 className="mt-1.5 font-heading text-sm font-bold leading-tight text-foreground">
                          {pack.name}
                        </h3>

                        <div className="mt-3.5 flex items-center justify-between border-t border-border-subtle pt-3">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                            <DollarSign className="h-3.5 w-3.5 text-accent" />
                            <span>
                              {group.hasMultipleEditions
                                ? `${Math.min(...group.editionVariants.map((v) => v.price_usd ?? 0)).toFixed(2)}+`
                                : pack.price_usd?.toFixed(2) ?? '—'}
                            </span>
                          </div>

                          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-dim transition-colors group-hover:text-accent">
                            Open
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="px-4 pb-3">
                      <Link
                        href={`/browse?set=${pack.set_id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-dim transition-colors hover:text-accent"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Package className="h-3 w-3" />
                        View cards
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
