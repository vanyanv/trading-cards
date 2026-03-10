'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardDisplay } from './CardDisplay';
import { CollectionFilters } from './CollectionFilters';
import type { UserCard, Rarity } from '@/types';
import { useRouter } from 'next/navigation';

export function CollectionGrid({ userCards }: { userCards: UserCard[] }) {
  const [selectedRarities, setSelectedRarities] = useState<Rarity[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>('all');
  const [search, setSearch] = useState('');

  const router = useRouter();

  const cardCounts = useMemo(() => {
    const counts = new Map<string, { card: UserCard; count: number }>();
    for (const uc of userCards) {
      const key = `${uc.card_id}-${uc.is_reverse_holo}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { card: uc, count: 1 });
      }
    }
    return Array.from(counts.values());
  }, [userCards]);

  const sets = useMemo(() => {
    const s = new Set<string>();
    for (const { card } of cardCounts) {
      if (card.card?.set_name) s.add(card.card.set_name);
    }
    return Array.from(s).sort();
  }, [cardCounts]);

  const filtered = useMemo(() => {
    return cardCounts.filter(({ card }) => {
      if (!card.card) return false;
      if (
        selectedRarities.length > 0 &&
        !selectedRarities.includes(card.card.rarity)
      )
        return false;
      if (selectedSet !== 'all' && card.card.set_name !== selectedSet)
        return false;
      if (
        search &&
        !card.card.name.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [cardCounts, selectedRarities, selectedSet, search]);

  return (
    <div>
      <CollectionFilters
        selectedRarities={selectedRarities}
        onRaritiesChange={setSelectedRarities}
        selectedSet={selectedSet}
        onSetChange={setSelectedSet}
        search={search}
        onSearchChange={setSearch}
        sets={sets}
        totalCards={userCards.length}
        uniqueCards={cardCounts.length}
      />

      {filtered.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <AnimatePresence mode="popLayout">
            {filtered.map(({ card, count }, i) =>
              card.card ? (
                <motion.div
                  key={`${card.card_id}-${card.is_reverse_holo}`}
                  layout
                  className="relative"
                >
                  <CardDisplay
                    card={card.card}
                    isReverseHolo={card.is_reverse_holo}
                    index={i}
                    onClick={() => router.push(`/card/${card.card_id}`)}
                  />
                  {count > 1 && (
                    <span className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                      {count}
                    </span>
                  )}
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-muted">
            {userCards.length === 0
              ? 'No cards in your collection yet.'
              : 'No cards match your filters.'}
          </p>
          {userCards.length === 0 && (
            <a
              href="/"
              className="mt-3 rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Open your first pack
            </a>
          )}
        </div>
      )}
    </div>
  );
}
