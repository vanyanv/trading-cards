'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ImmersiveCard } from './ImmersiveCard';
import type { Card, PulledCard, Rarity } from '@/types';
import { rarityOrder } from '@/lib/rarity';

interface CardShowcaseProps {
  card: Card;
  onClose: () => void;
}

function cardToPulledCard(card: Card): PulledCard {
  return {
    ...card,
    is_reverse_holo: false,
    slot_number: 0,
  };
}

export function CardShowcase({ card, onClose }: CardShowcaseProps) {
  return (
    <AnimatePresence>
      <ImmersiveCard
        card={cardToPulledCard(card)}
        onClose={onClose}
      />
    </AnimatePresence>
  );
}

export function useCardShowcase() {
  const [showcaseCard, setShowcaseCard] = useState<Card | null>(null);

  const openShowcase = (card: Card) => {
    if (rarityOrder(card.rarity) >= 2) {
      setShowcaseCard(card);
    }
  };

  const closeShowcase = () => setShowcaseCard(null);

  return { showcaseCard, openShowcase, closeShowcase };
}
