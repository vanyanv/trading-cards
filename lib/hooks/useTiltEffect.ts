'use client';

import { useCallback, useRef, useState } from 'react';

interface TiltOptions {
  enabled: boolean;
  perspective?: number;
  maxTilt?: number;
}

interface TiltResult {
  ref: React.RefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
  handlers: {
    onMouseMove: (e: React.MouseEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onMouseLeave: () => void;
  };
}

export function useTiltEffect(options: TiltOptions): TiltResult {
  const { enabled, perspective = 600, maxTilt = 12 } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !ref.current) return;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = ref.current!.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90;
        const rotateX = (y - 0.5) * -maxTilt;
        const rotateY = (x - 0.5) * maxTilt;

        setStyle({
          transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          '--holo-angle': `${angle}deg`,
          '--holo-x': `${x * 100}%`,
        } as React.CSSProperties);
      });
    },
    [enabled, perspective, maxTilt]
  );

  const handleReset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setStyle({});
  }, []);

  const handlers = {
    onMouseMove: (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleMove(touch.clientX, touch.clientY);
      }
    },
    onMouseLeave: handleReset,
  };

  return { ref, style, handlers };
}
