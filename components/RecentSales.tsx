'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { ExternalLink } from 'lucide-react';
import type { CardSoldListing, EbayActiveListing } from '@/types';

type SalesTab = 'sold' | 'active';

function GradingBadge({ grading }: { grading: string }) {
  const isPSA = grading.startsWith('PSA');
  const isBGS = grading.startsWith('BGS');
  const isCGC = grading.startsWith('CGC');
  const isRaw = grading === 'Raw';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        isPSA && 'border-red-300/30 bg-red-500/10 text-red-400',
        isBGS && 'border-amber-300/30 bg-amber-500/10 text-amber-400',
        isCGC && 'border-blue-300/30 bg-blue-500/10 text-blue-400',
        isRaw && 'border-border bg-surface-elevated text-muted'
      )}
    >
      {grading}
    </span>
  );
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SoldListingRow({ listing }: { listing: CardSoldListing }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 transition-colors hover:bg-surface-elevated/50">
      {/* Date */}
      <div className="w-20 shrink-0">
        <p className="text-[10px] font-semibold text-accent">ebay</p>
        <p className="text-[10px] text-muted">{listing.soldDate}</p>
      </div>

      {/* Grading */}
      <div className="w-16 shrink-0">
        <GradingBadge grading={listing.grading || 'Raw'} />
      </div>

      {/* Title */}
      <a
        href={listing.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-sm text-foreground transition-colors hover:text-accent"
      >
        {listing.title}
      </a>

      {/* Price */}
      <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
        {formatPrice(listing.price)}
      </span>
    </div>
  );
}

function ActiveListingRow({ listing }: { listing: EbayActiveListing }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 transition-colors hover:bg-surface-elevated/50">
      {/* Condition */}
      <div className="w-20 shrink-0">
        <span className="inline-flex rounded-md border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          {listing.condition}
        </span>
      </div>

      {/* Seller */}
      <div className="w-24 shrink-0 truncate text-[11px] text-muted">
        {listing.seller}
      </div>

      {/* Title */}
      <a
        href={listing.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-sm text-foreground transition-colors hover:text-accent"
      >
        {listing.title}
      </a>

      {/* Price */}
      <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
        {formatPrice(listing.price)}
      </span>
    </div>
  );
}

export function RecentSales({ cardId }: { cardId: string }) {
  const [tab, setTab] = useState<SalesTab>('sold');
  const [soldData, setSoldData] = useState<{
    sales: CardSoldListing[];
    searchUrl: string;
  } | null>(null);
  const [activeData, setActiveData] = useState<EbayActiveListing[]>([]);
  const [loadingSold, setLoadingSold] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);

  useEffect(() => {
    fetch(`/api/card-sales/${cardId}`)
      .then((r) => r.json())
      .then((d) => setSoldData(d.sales ? d : { sales: [], searchUrl: '' }))
      .catch(() => setSoldData({ sales: [], searchUrl: '' }))
      .finally(() => setLoadingSold(false));

    fetch(`/api/card-listings/${cardId}`)
      .then((r) => r.json())
      .then((d) => setActiveData(Array.isArray(d) ? d : []))
      .catch(() => setActiveData([]))
      .finally(() => setLoadingActive(false));
  }, [cardId]);

  const tabs: { id: SalesTab; label: string; count: number }[] = [
    {
      id: 'sold',
      label: 'Recent Sales',
      count: soldData?.sales.length || 0,
    },
    { id: 'active', label: 'Active Listings', count: activeData.length },
  ];

  const loading = tab === 'sold' ? loadingSold : loadingActive;

  return (
    <div className="mt-10 rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="font-heading text-lg font-bold tracking-tight">
            eBay Market
          </h2>
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-all',
                  tab === t.id
                    ? 'bg-surface text-foreground shadow-warm-sm'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {t.label}
                {!loading && t.count > 0 && (
                  <span className="ml-1 text-muted-dim">({t.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {tab === 'sold' && soldData?.searchUrl && (
          <a
            href={soldData.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
          >
            View All on eBay
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border px-4 py-3"
              >
                <div className="h-4 w-20 animate-pulse rounded bg-border" />
                <div className="h-4 w-16 animate-pulse rounded bg-border" />
                <div className="h-4 flex-1 animate-pulse rounded bg-border" />
                <div className="h-4 w-16 animate-pulse rounded bg-border" />
              </div>
            ))}
          </div>
        ) : tab === 'sold' ? (
          soldData && soldData.sales.length > 0 ? (
            soldData.sales.map((listing, i) => (
              <SoldListingRow key={`${listing.url}-${i}`} listing={listing} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-sm text-muted">No recent sales found</p>
              <p className="text-xs text-muted-dim">
                eBay sold listings will appear here when available
              </p>
            </div>
          )
        ) : activeData.length > 0 ? (
          activeData.map((listing, i) => (
            <ActiveListingRow key={`${listing.url}-${i}`} listing={listing} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm text-muted">No active listings found</p>
            <p className="text-xs text-muted-dim">
              {!process.env.NEXT_PUBLIC_EBAY_ENABLED
                ? 'Configure eBay API keys to see active listings'
                : 'No listings currently available on eBay'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
