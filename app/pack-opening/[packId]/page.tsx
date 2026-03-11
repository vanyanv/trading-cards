'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PackOpeningAnimation } from '@/components/PackOpeningAnimation';
import type { Pack, PulledCard } from '@/types';

export default function PackOpeningPage() {
  const { packId } = useParams<{ packId: string }>();
  const searchParams = useSearchParams();
  const unopenedId = searchParams.get('unopenedId');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [pack, setPack] = useState<Pack | null>(null);
  const [cards, setCards] = useState<PulledCard[] | null>(null);
  const [packCost, setPackCost] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Track the current unopened pack ID so we can reveal it on animation complete
  const currentUnopenedIdRef = useRef<string | null>(null);

  // Peek at card data without moving cards (pack stays in unopened_packs)
  const peekPack = useCallback(async (peekId: string) => {
    const res = await fetch('/api/packs/peek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unopenedPackId: peekId }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to load pack');
    }

    return data.cards as PulledCard[];
  }, []);

  // Reveal: move cards from unopened_packs to user_cards (called on animation complete)
  const revealPack = useCallback(async (revealId: string) => {
    const res = await fetch('/api/packs/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unopenedPackId: revealId }),
    });

    if (!res.ok) {
      // Non-critical: cards were already shown, just log
      console.error('Failed to finalize reveal');
      return;
    }

    // Navbar will pick up the new count on next navigation
  }, []);

  // Buy a new pack, then peek at the cards (don't reveal yet)
  const buyAndPeek = useCallback(async () => {
    const openRes = await fetch('/api/packs/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId }),
    });

    const openData = await openRes.json();

    if (!openRes.ok) {
      throw new Error(openData.error || 'Failed to open pack');
    }

    setPackCost(openData.packCost);
    window.dispatchEvent(new CustomEvent('balance-update', { detail: { balance: openData.newBalance } }));
    // Store the unopened pack ID for later reveal
    currentUnopenedIdRef.current = openData.unopenedPackId;

    // Peek to get card data for animation (no mutation)
    const pulledCards = await peekPack(openData.unopenedPackId);
    return pulledCards;
  }, [packId, peekPack]);

  // Main open flow
  const openPack = useCallback(async (savedPackId?: string) => {
    setLoading(true);
    setCards(null);
    setError(null);

    try {
      let pulledCards: PulledCard[];

      if (savedPackId) {
        // Opening a saved pack — just peek at it
        currentUnopenedIdRef.current = savedPackId;
        pulledCards = await peekPack(savedPackId);
      } else {
        // Fresh purchase — buy then peek
        pulledCards = await buyAndPeek();
      }

      setCards(pulledCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [peekPack, buyAndPeek]);

  useEffect(() => {
    if (!supabase) return;
    const loadPack = async () => {
      const { data } = await supabase
        .from('packs')
        .select('*')
        .eq('id', packId)
        .single();

      if (data) {
        setPack(data as Pack);
        openPack(unopenedId || undefined);
      } else {
        setError('Pack not found');
        setLoading(false);
      }
    };

    loadPack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId]);

  // Called when animation reaches "complete" phase — finalize the reveal
  const handleAnimationComplete = useCallback(() => {
    const id = currentUnopenedIdRef.current;
    if (id) {
      revealPack(id);
      currentUnopenedIdRef.current = null;
    }
  }, [revealPack]);

  // "Open Another" always buys a fresh pack
  const handleOpenAnother = useCallback(() => {
    openPack();
  }, [openPack]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-4">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openPack(unopenedId || undefined)}
            className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
          >
            Try again
          </button>
          <button
            onClick={() => router.push('/browse')}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Back to packs
          </button>
        </div>
      </div>
    );
  }

  if (loading || !cards || !pack) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" />
          <p className="text-sm text-muted">
            Preparing your pack...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PackOpeningAnimation
      cards={cards}
      packName={pack.name}
      packImage={pack.featured_card_image || pack.image_url}
      packCost={packCost}
      onOpenAnother={handleOpenAnother}
      onComplete={handleAnimationComplete}
      edition={pack.edition}
    />
  );
}
