'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PackOpeningAnimation } from '@/components/PackOpeningAnimation';
import type { Pack, PulledCard } from '@/types';

export default function PackOpeningPage() {
  const { packId } = useParams<{ packId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [pack, setPack] = useState<Pack | null>(null);
  const [cards, setCards] = useState<PulledCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        openPack();
      } else {
        setError('Pack not found');
        setLoading(false);
      }
    };

    loadPack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId]);

  const openPack = async () => {
    setLoading(true);
    setCards(null);
    setError(null);

    try {
      const res = await fetch('/api/packs/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to open pack');
        return;
      }

      setCards(data.cards);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-4">
        <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
        <button
          onClick={() => router.push('/store')}
          className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
        >
          Back to store
        </button>
      </div>
    );
  }

  if (loading || !cards || !pack) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" />
          <p className="text-sm text-muted">Preparing your pack...</p>
        </div>
      </div>
    );
  }

  return (
    <PackOpeningAnimation
      cards={cards}
      packName={pack.name}
      packImage={pack.image_url}
      onOpenAnother={openPack}
    />
  );
}
