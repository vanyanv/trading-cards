'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, HandCoins } from 'lucide-react';
import { CardDisplay } from './CardDisplay';
import { CardListItem } from './CardListItem';
import { CardTable } from './CardTable';
import { ScrollSentinel } from './ScrollSentinel';
import { FilterSidebar, emptyFilters } from './FilterSidebar';
import { ViewModeToggle } from './ViewModeToggle';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { CollectionValueHeader } from './CollectionValueHeader';
import { SellModeBar } from './SellModeBar';
import { SellConfirmModal } from './SellConfirmModal';
import type { FilterState } from './FilterSidebar';
import type { ViewMode } from './ViewModeToggle';
import type { CollectionStats, RarityBreakdown } from './CollectionValueHeader';
import type { UserCard, Card, Rarity } from '@/types';
import { RARITY_CONFIG } from '@/lib/constants';
import { useRouter } from 'next/navigation';

import { SELL_RATE } from '@/lib/constants';

function computeSellPrice(price: number | undefined): number {
  return parseFloat(((price ?? 0) * SELL_RATE).toFixed(2));
}

function cardKey(card: UserCard): string {
  return `${card.card_id}-${card.is_reverse_holo}-${card.edition || 'none'}`;
}

export function CollectionGrid({ userCards }: { userCards: UserCard[] }) {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'number' | 'name' | 'price-asc' | 'price-desc'>('recent');
  const [sellMode, setSellMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [quickSellKey, setQuickSellKey] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('collection-view-mode') as ViewMode | null;
    if (saved) setViewMode(saved);
  }, []);

  const handleViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('collection-view-mode', mode);
  }, []);

  // Deduplicate cards (same card in both holo/normal shown once with count)
  const cardCounts = useMemo(() => {
    const counts = new Map<string, { card: UserCard; count: number; allIds: string[] }>();
    for (const uc of userCards) {
      const key = `${uc.card_id}-${uc.is_reverse_holo}-${uc.edition || 'none'}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
        existing.allIds.push(uc.id);
      } else {
        counts.set(key, { card: uc, count: 1, allIds: [uc.id] });
      }
    }
    return Array.from(counts.values());
  }, [userCards]);

  // Extract all cards for filter counting
  const allCards = useMemo(() => {
    return cardCounts.map(({ card }) => card.card).filter(Boolean) as NonNullable<UserCard['card']>[];
  }, [cardCounts]);

  // Collection stats for the value header
  const collectionStats = useMemo<CollectionStats>(() => {
    let totalValue = 0;
    let trendUp = 0;
    let trendDown = 0;
    let mostValuableCard: { name: string; price: number } | null = null;
    const rarityMap = new Map<string, RarityBreakdown>();

    for (const uc of userCards) {
      const c = uc.card;
      if (!c) continue;
      const price = c.price ?? 0;
      totalValue += price;

      if (c.price_trend === 'up') trendUp++;
      if (c.price_trend === 'down') trendDown++;

      if (!mostValuableCard || price > mostValuableCard.price) {
        mostValuableCard = { name: c.name, price };
      }

      const existing = rarityMap.get(c.rarity);
      if (existing) {
        existing.count++;
        existing.totalValue += price;
      } else {
        rarityMap.set(c.rarity, { rarity: c.rarity, count: 1, totalValue: price });
      }
    }

    const rarityBreakdown = Array.from(rarityMap.values()).sort((a, b) => {
      const orderA = RARITY_CONFIG[a.rarity as Rarity]?.order ?? 99;
      const orderB = RARITY_CONFIG[b.rarity as Rarity]?.order ?? 99;
      return orderA - orderB;
    });

    return {
      totalValue,
      totalCards: userCards.length,
      uniqueCards: cardCounts.length,
      averageValue: userCards.length > 0 ? totalValue / userCards.length : 0,
      mostValuableCard,
      rarityBreakdown,
      trendUp,
      trendDown,
    };
  }, [userCards, cardCounts]);

  const filtered = useMemo(() => {
    let result = cardCounts;

    result = result.filter(({ card }) => {
      if (!card.card) return false;
      const c = card.card;

      if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.supertypes.length > 0 && !filters.supertypes.includes(c.supertype)) return false;
      if (filters.types.length > 0 && !c.types?.some((t) => filters.types.includes(t))) return false;
      if (filters.rarities.length > 0 && !filters.rarities.includes(c.rarity)) return false;
      if (filters.subtypes.length > 0 && !c.subtypes?.some((s) => filters.subtypes.includes(s))) return false;

      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      const ca = a.card.card!;
      const cb = b.card.card!;
      switch (sortBy) {
        case 'recent':
          return new Date(b.card.obtained_at).getTime() - new Date(a.card.obtained_at).getTime();
        case 'name':
          return ca.name.localeCompare(cb.name);
        case 'price-asc':
          return (ca.price ?? 0) - (cb.price ?? 0);
        case 'price-desc':
          return (cb.price ?? 0) - (ca.price ?? 0);
        case 'number':
        default: {
          const numA = parseInt(ca.tcg_id.split('-').pop() || '0');
          const numB = parseInt(cb.tcg_id.split('-').pop() || '0');
          return numA - numB;
        }
      }
    });

    return result;
  }, [cardCounts, filters, sortBy]);

  const { visibleItems, sentinelRef, hasMore } = useInfiniteScroll(filtered, 24);

  // For table view
  const flatCards = useMemo(() => {
    return filtered.map(({ card }) => card.card).filter(Boolean) as NonNullable<UserCard['card']>[];
  }, [filtered]);

  const ownedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const { card, count } of cardCounts) {
      map.set(card.card_id, count);
    }
    return map;
  }, [cardCounts]);

  // Sell mode helpers
  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleSelectByCardId = useCallback((cardId: string) => {
    // Find the key for this card in cardCounts
    const entry = cardCounts.find(({ card }) => card.card_id === cardId);
    if (entry) {
      const key = cardKey(entry.card);
      toggleSelect(key);
    }
  }, [cardCounts, toggleSelect]);

  // Selected card IDs for the table view
  const selectedCardIds = useMemo(() => {
    const ids = new Set<string>();
    for (const key of selectedKeys) {
      const entry = cardCounts.find(({ card }) => cardKey(card) === key);
      if (entry?.card.card_id) ids.add(entry.card.card_id);
    }
    return ids;
  }, [selectedKeys, cardCounts]);

  // Sell price map for table view
  const sellPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const { card } of cardCounts) {
      if (card.card) {
        map.set(card.card_id, computeSellPrice(card.card.price));
      }
    }
    return map;
  }, [cardCounts]);

  // Calculate total sell value for selected cards
  const { selectedCount, totalSellValue, sellItems } = useMemo(() => {
    let count = 0;
    let value = 0;
    const items: { card: Card; quantity: number; sellPrice: number }[] = [];

    for (const key of selectedKeys) {
      const entry = cardCounts.find(({ card }) => cardKey(card) === key);
      if (!entry?.card.card) continue;
      const sellPrice = computeSellPrice(entry.card.card.price);
      // Sell one copy per selection
      count += 1;
      value += sellPrice;
      items.push({ card: entry.card.card, quantity: 1, sellPrice });
    }

    return { selectedCount: count, totalSellValue: value, sellItems: items };
  }, [selectedKeys, cardCounts]);

  // Quick sell single card
  const quickSellData = useMemo(() => {
    if (!quickSellKey) return null;
    const entry = cardCounts.find(({ card }) => cardKey(card) === quickSellKey);
    if (!entry?.card.card) return null;
    const sellPrice = computeSellPrice(entry.card.card.price);
    return {
      items: [{ card: entry.card.card, quantity: 1, sellPrice }],
      totalSellValue: sellPrice,
      userCardId: entry.allIds[0],
    };
  }, [quickSellKey, cardCounts]);

  const handleQuickSell = useCallback((key: string) => {
    setQuickSellKey(key);
    setShowConfirmModal(true);
  }, []);

  const handleQuickSellByCardId = useCallback((cardId: string) => {
    const entry = cardCounts.find(({ card }) => card.card_id === cardId);
    if (entry) {
      handleQuickSell(cardKey(entry.card));
    }
  }, [cardCounts, handleQuickSell]);

  const handleExitSellMode = useCallback(() => {
    setSellMode(false);
    setSelectedKeys(new Set());
  }, []);

  const handleConfirmSell = useCallback(async () => {
    let idsToSell: string[];

    if (quickSellKey) {
      // Quick sell single card
      const entry = cardCounts.find(({ card }) => cardKey(card) === quickSellKey);
      idsToSell = entry ? [entry.allIds[0]] : [];
    } else {
      // Bulk sell mode
      idsToSell = [];
      for (const key of selectedKeys) {
        const entry = cardCounts.find(({ card }) => cardKey(card) === key);
        if (entry) {
          idsToSell.push(entry.allIds[0]);
        }
      }
    }

    const res = await fetch('/api/cards/sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userCardIds: idsToSell }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sell cards');
    }

    const data = await res.json();

    // Dispatch balance update event for Navbar
    window.dispatchEvent(
      new CustomEvent('balance-update', { detail: { balance: data.newBalance } })
    );

    // Reset state
    if (quickSellKey) {
      setQuickSellKey(null);
    } else {
      setSellMode(false);
      setSelectedKeys(new Set());
    }

    // Refresh server data
    router.refresh();

    return data;
  }, [quickSellKey, selectedKeys, cardCounts, router]);

  return (
    <div>
      {/* Value Header */}
      {userCards.length > 0 && <CollectionValueHeader stats={collectionStats} />}

      {/* Stats */}
      <div className="mb-4 flex items-center gap-4 text-sm text-muted">
        <span>
          <strong className="font-bold text-foreground">{userCards.length}</strong> total
        </span>
        <span className="text-muted-dim">/</span>
        <span>
          <strong className="font-bold text-foreground">{cardCounts.length}</strong> unique
        </span>
      </div>

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
          <option value="recent">Most Recent</option>
          <option value="number">Sort by #</option>
          <option value="name">Sort by Name</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="price-asc">Price: Low to High</option>
        </select>
        <ViewModeToggle mode={viewMode} onChange={handleViewMode} />
        {/* Sell Mode Toggle */}
        <button
          onClick={sellMode ? handleExitSellMode : () => setSellMode(true)}
          className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-all ${
            sellMode
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-surface text-muted hover:text-foreground'
          }`}
        >
          <HandCoins className="h-4 w-4" />
          <span className="hidden sm:inline">{sellMode ? 'Cancel' : 'Sell Cards'}</span>
        </button>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-muted transition-colors hover:text-foreground lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-65 shrink-0 lg:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-surface p-4 shadow-warm-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Filters
            </h3>
            <FilterSidebar cards={allCards} filters={filters} onFilterChange={setFilters} />
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
                <FilterSidebar cards={allCards} filters={filters} onFilterChange={setFilters} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Card content */}
        <div className={`flex-1 min-w-0 ${sellMode && selectedKeys.size > 0 ? 'pb-20' : ''}`}>
          {filtered.length > 0 ? (
            viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {visibleItems.map(({ card, count }, i) => {
                      const key = cardKey(card);
                      const isSelected = selectedKeys.has(key);
                      return card.card ? (
                        <motion.div
                          key={key}
                          layout
                          className="relative"
                        >
                          <CardDisplay
                            card={card.card}
                            isReverseHolo={card.is_reverse_holo}
                            edition={card.edition}
                            index={i}
                            onClick={() => router.push(`/card/${card.card_id}`)}
                            sellMode={sellMode}
                            selected={isSelected}
                            onSelect={() => toggleSelect(key)}
                            sellPrice={computeSellPrice(card.card.price)}
                            onQuickSell={() => handleQuickSell(key)}
                          />
                          {count > 1 && (
                            <span className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                              {count}
                            </span>
                          )}
                        </motion.div>
                      ) : null;
                    })}
                  </AnimatePresence>
                </div>
                <ScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
              </>
            ) : viewMode === 'list' ? (
              <>
                <div className="space-y-0.5">
                  {visibleItems.map(({ card, count }) => {
                    const key = cardKey(card);
                    const isSelected = selectedKeys.has(key);
                    return card.card ? (
                      <div key={key} className="relative">
                        <CardListItem
                          card={card.card}
                          onClick={() => router.push(`/card/${card.card_id}`)}
                          sellMode={sellMode}
                          selected={isSelected}
                          onSelect={() => toggleSelect(key)}
                          sellPrice={computeSellPrice(card.card.price)}
                          onQuickSell={() => handleQuickSell(key)}
                        />
                        {count > 1 && !sellMode && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                            {count}x
                          </span>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
                <ScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} />
              </>
            ) : (
              <CardTable
                cards={flatCards}
                onCardClick={(card) => router.push(`/card/${card.id}`)}
                ownedMap={ownedMap}
                sellMode={sellMode}
                selectedIds={selectedCardIds}
                onToggleSelect={toggleSelectByCardId}
                sellPriceMap={sellPriceMap}
                onQuickSell={handleQuickSellByCardId}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="text-sm text-muted">
                {userCards.length === 0
                  ? 'No cards in your collection yet.'
                  : 'No cards match your filters.'}
              </p>
              {userCards.length === 0 && (
                <a
                  href="/"
                  className="mt-3 rounded-xl bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
                >
                  Open your first pack
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sell Mode Bottom Bar */}
      <AnimatePresence>
        {sellMode && selectedKeys.size > 0 && (
          <SellModeBar
            selectedCount={selectedCount}
            totalSellValue={totalSellValue}
            onSell={() => setShowConfirmModal(true)}
            onCancel={handleExitSellMode}
          />
        )}
      </AnimatePresence>

      {/* Sell Confirm Modal */}
      {showConfirmModal && (
        <SellConfirmModal
          items={quickSellData ? quickSellData.items : sellItems}
          totalSellValue={quickSellData ? quickSellData.totalSellValue : totalSellValue}
          onConfirm={handleConfirmSell}
          onClose={() => { setShowConfirmModal(false); setQuickSellKey(null); }}
        />
      )}
    </div>
  );
}
