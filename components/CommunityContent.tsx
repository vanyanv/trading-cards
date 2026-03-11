'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaderboard } from '@/components/Leaderboard';
import type { LeaderboardEntry, PokedexLeaderboardEntry } from '@/types';

const TABS = [
  { id: 'value', label: 'Top Value' },
  { id: 'pokedex', label: 'Pokédex Masters' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface CommunityContentProps {
  valueLeaderboard: LeaderboardEntry[];
  pokedexLeaderboard: PokedexLeaderboardEntry[];
  currentUserId: string | null;
}

export function CommunityContent({
  valueLeaderboard,
  pokedexLeaderboard,
  currentUserId,
}: CommunityContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('value');

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-elevated p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="community-tab"
                className="absolute inset-0 rounded-lg bg-surface shadow-warm-sm"
                transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'value' ? (
          <motion.div
            key="value"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Leaderboard variant="value" entries={valueLeaderboard} currentUserId={currentUserId} />
          </motion.div>
        ) : (
          <motion.div
            key="pokedex"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Leaderboard variant="pokedex" entries={pokedexLeaderboard} currentUserId={currentUserId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
