'use client';

import { useEffect, useRef } from 'react';

export function useImagePreloader(
  imageUrls: string[],
  visibleCount: number,
  preloadAhead = 24,
) {
  const preloadedRef = useRef(new Set<string>());

  useEffect(() => {
    const end = Math.min(visibleCount + preloadAhead, imageUrls.length);
    for (let i = visibleCount; i < end; i++) {
      const url = imageUrls[i];
      if (url && !preloadedRef.current.has(url)) {
        preloadedRef.current.add(url);
        const img = new Image();
        img.src = url;
      }
    }
  }, [imageUrls, visibleCount, preloadAhead]);
}
