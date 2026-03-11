'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useInfiniteScroll<T>(items: T[], chunkSize = 24) {
  const [visibleCount, setVisibleCount] = useState(chunkSize);
  const sentinelNodeRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reset visible count when items change (filter/sort produces new array ref)
  const prevItemsRef = useRef(items);
  useEffect(() => {
    if (prevItemsRef.current !== items) {
      setVisibleCount(chunkSize);
      prevItemsRef.current = items;
    }
  }, [items, chunkSize]);

  // Set up IntersectionObserver
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + chunkSize, items.length));
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelNodeRef.current) {
      observerRef.current.observe(sentinelNodeRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items.length, chunkSize]);

  // Callback ref for the sentinel element
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    if (sentinelNodeRef.current) {
      observerRef.current?.unobserve(sentinelNodeRef.current);
    }
    sentinelNodeRef.current = node;
    if (node) {
      observerRef.current?.observe(node);
    }
  }, []);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return { visibleItems, sentinelRef, hasMore, totalCount: items.length };
}
