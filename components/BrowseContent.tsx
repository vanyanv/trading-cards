'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CardDisplay } from './CardDisplay';
import { CardListItem } from './CardListItem';
import { CardTable } from './CardTable';
import { ScrollSentinel } from './ScrollSentinel';
import { FilterSidebar, emptyFilters } from './FilterSidebar';
import { ViewModeToggle } from './ViewModeToggle';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { useImagePreloader } from '@/lib/hooks/useImagePreloader';
import { usePrefetchCardOnHover } from '@/lib/hooks/usePrefetchOnHover';
import { queryKeys } from '@/lib/query/queryKeys';
import { fetchCardsBySet } from '@/lib/query/fetchers';
import type { FilterState } from './FilterSidebar';
import type { ViewMode } from './ViewModeToggle';
import type { Card } from '@/types';

interface BrowseContentProps {
  cards: Card[];
  currentSet: string;
  setName: string;
  ownedCounts: Record<string, number>;
  isLoggedIn: boolean;
}

export function BrowseContent({
  cards: initialCards,
  currentSet,
  setName,
  ownedCounts,
  isLoggedIn,
}: BrowseContentProps) {
  const { data: cards } = useQuery({
    queryKey: queryKeys.cards.bySet(currentSet),
    queryFn: () => fetchCardsBySet(currentSet),
    initialData: initialCards,
  });

  const router = useRouter();
  const prefetchCard = usePrefetchCardOnHover();
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'price-asc' | 'price-desc'>('number');

  // Restore view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('browse-view-mode') as ViewMode | null;
    if (saved) setViewMode(saved);
  }, []);

  const handleViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('browse-view-mode', mode);
  }, []);

  const filtered = useMemo(() => {
    let result = cards;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (filters.supertypes.length > 0) {
      result = result.filter((c) => filters.supertypes.includes(c.supertype));
    }
    if (filters.types.length > 0) {
      result = result.filter((c) => c.types?.some((t) => filters.types.includes(t)));
    }
    if (filters.rarities.length > 0) {
      result = result.filter((c) => filters.rarities.includes(c.rarity));
    }
    if (filters.subtypes.length > 0) {
      result = result.filter((c) => c.subtypes?.some((s) => filters.subtypes.includes(s)));
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return (a.price ?? 0) - (b.price ?? 0);
        case 'price-desc':
          return (b.price ?? 0) - (a.price ?? 0);
        case 'number':
        default: {
          const numA = parseInt(a.tcg_id.split('-').pop() || '0');
          const numB = parseInt(b.tcg_id.split('-').pop() || '0');
          return numA - numB;
        }
      }
    });

    return result;
  }, [cards, filters, sortBy]);

  const { visibleItems, sentinelRef, hasMore } = useInfiniteScroll(filtered, 24);

  const imageUrls = useMemo(() => filtered.map((c) => c.image_url), [filtered]);
  useImagePreloader(imageUrls, visibleItems.length);

  const ownedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const [id, count] of Object.entries(ownedCounts)) {
      map.set(id, count);
    }
    return map;
  }, [ownedCounts]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Set Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 text-sm text-muted mb-2">
          <a href="/browse" className="hover:text-foreground transition-colors">Browse</a>
          <span className="text-muted-dim">/</span>
          <span className="text-foreground">{setName}</span>
        </div>
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {setName}
          </h1>
          <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-xs font-medium text-muted">
            {currentSet}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {filtered.length} card{filtered.length !== 1 ? 's' : ''}
          {cards.length !== filtered.length && ` of ${cards.length}`}
        </p>
      </div>

      <div className="mb-6 h-px bg-border" />

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search cards..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-dim transition-colors focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors focus:border-accent focus:outline-none"
        >
          <option value="number">Sort by #</option>
          <option value="name">Sort by Name</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="price-asc">Price: Low to High</option>
        </select>
        <ViewModeToggle mode={viewMode} onChange={handleViewMode} />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-muted transition-colors hover:text-foreground lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-65 shrink-0 lg:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-surface p-4 shadow-warm-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Filters
            </h3>
            <FilterSidebar cards={cards} filters={filters} onFilterChange={setFilters} />
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 z-50 h-full w-75 overflow-y-auto bg-surface p-5 shadow-warm-lg lg:hidden"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-lg p-1 text-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <FilterSidebar cards={cards} filters={filters} onFilterChange={setFilters} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Card content */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="text-sm text-muted">No cards match your filters.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {visibleItems.map((card, i) => (
                    <motion.div key={card.id} layout>
                      <CardDisplay
                        card={card}
                        index={i}
                        owned={isLoggedIn ? (ownedCounts[card.id] ?? 0) : undefined}
                        onClick={() => router.push(`/card/${card.id}`)}
                        onMouseEnter={() => prefetchCard(card.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <ScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
            </>
          ) : viewMode === 'list' ? (
            <>
              <div className="space-y-0.5">
                {visibleItems.map((card) => (
                  <CardListItem
                    key={card.id}
                    card={card}
                    owned={isLoggedIn ? (ownedCounts[card.id] ?? 0) : undefined}
                    onClick={() => router.push(`/card/${card.id}`)}
                    onMouseEnter={() => prefetchCard(card.id)}
                  />
                ))}
              </div>
              <ScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
            </>
          ) : (
            <CardTable
              cards={filtered}
              onCardClick={(card) => router.push(`/card/${card.id}`)}
              ownedMap={isLoggedIn ? ownedMap : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
