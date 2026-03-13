'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { isShinyRarity } from '@/lib/constants';
import { Rarity } from '@/types';

// Simple string hash for deterministic sparkle positioning
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Seeded pseudo-random (mulberry32)
function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ShinyEffectProps {
  rarity: Rarity;
  children?: React.ReactNode;
  className?: string;
  /** When true, always uses CSS auto-sweep instead of mouse tracking. */
  disableMouseTracking?: boolean;
  /** Externally-provided holo angle (degrees). Accepts number or CSS string like "145.3deg". */
  holoAngle?: number | string;
  /** Stable string for deterministic sparkle positioning. */
  seed?: string;
  /** When true, renders only overlay layers (no wrapper div around children). */
  asOverlay?: boolean;
}

const SHINY_CONFIG = {
  [Rarity.OneShiny]: {
    holoOpacity: 0.3,
    holoBlur: 12,
    holoSaturation: 0.8,
    borderGlow: '0 0 6px rgba(232, 121, 249, 0.3)',
    particleCountDesktop: 5,
    particleCountMobile: 3,
    maxSize: 6,
    particleColor: 'rgba(255, 255, 255, 0.85)',
    particleShadowColor: 'rgba(255, 255, 255, 0.6)',
  },
  [Rarity.TwoShiny]: {
    holoOpacity: 0.5,
    holoBlur: 8,
    holoSaturation: 1.0,
    borderGlow: '0 0 12px rgba(192, 132, 252, 0.5)',
    particleCountDesktop: 10,
    particleCountMobile: 6,
    maxSize: 10,
    particleColor: 'rgba(255, 248, 220, 0.95)',
    particleShadowColor: 'rgba(255, 215, 0, 0.7)',
  },
} as const satisfies Record<string, {
  holoOpacity: number;
  holoBlur: number;
  holoSaturation: number;
  borderGlow: string;
  particleCountDesktop: number;
  particleCountMobile: number;
  maxSize: number;
  particleColor: string;
  particleShadowColor: string;
}>;

export function ShinyEffect({
  rarity,
  children,
  className,
  disableMouseTracking = false,
  holoAngle,
  seed,
  asOverlay = false,
}: ShinyEffectProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
    }
  }, []);

  // Early return for non-shiny or reduced motion
  if (!isShinyRarity(rarity) || prefersReducedMotion) {
    return asOverlay ? null : <>{children}</>;
  }

  const config = SHINY_CONFIG[rarity as Rarity.OneShiny | Rarity.TwoShiny];
  if (!config) {
    return asOverlay ? null : <>{children}</>;
  }

  const overlayLayers = (
    <ShinyOverlayLayers
      config={config}
      disableMouseTracking={disableMouseTracking}
      holoAngle={holoAngle}
      seed={seed}
    />
  );

  if (asOverlay) {
    return overlayLayers;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      {overlayLayers}
    </div>
  );
}

// Separated into its own component to avoid conditional hooks in ShinyEffect
function ShinyOverlayLayers({
  config,
  disableMouseTracking,
  holoAngle: externalAngle,
  seed,
}: {
  config: (typeof SHINY_CONFIG)[keyof typeof SHINY_CONFIG];
  disableMouseTracking: boolean;
  holoAngle?: number | string;
  seed?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [angle, setAngle] = useState<number | null>(null);

  // Normalize external angle
  const normalizedExternal = useMemo(() => {
    if (externalAngle == null) return null;
    if (typeof externalAngle === 'number') return externalAngle;
    return parseFloat(externalAngle) || null;
  }, [externalAngle]);

  const hasExternalAngle = normalizedExternal != null;
  const useMouseTracking = !disableMouseTracking && !hasExternalAngle;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!useMouseTracking) return;
      const el = wrapperRef.current;
      if (!el) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const a = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90;
        setAngle(a);
      });
    },
    [useMouseTracking],
  );

  const handleMouseLeave = useCallback(() => {
    if (useMouseTracking) setAngle(null);
  }, [useMouseTracking]);

  // Generate sparkle particles
  const particles = useMemo(() => {
    const hash = hashSeed(seed || 'default');
    const rng = seededRandom(hash);
    const totalDesktop = config.particleCountDesktop;
    const totalMobile = config.particleCountMobile;

    return Array.from({ length: totalDesktop }, (_, i) => ({
      x: rng() * 90 + 5, // 5-95% to keep within bounds
      y: rng() * 90 + 5,
      size: 2 + rng() * (config.maxSize - 2),
      delay: rng() * 2.5,
      duration: 1.5 + rng() * 1.5,
      desktopOnly: i >= totalMobile,
    }));
  }, [seed, config.particleCountDesktop, config.particleCountMobile, config.maxSize]);

  // Determine holo angle style
  const effectiveAngle = hasExternalAngle ? normalizedExternal : angle;
  const holoStyle: React.CSSProperties =
    effectiveAngle != null
      ? { '--holo-angle': `${effectiveAngle}deg` } as React.CSSProperties
      : {};

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none absolute inset-0"
      style={{ borderRadius: 'inherit' }}
      onMouseMove={useMouseTracking ? handleMouseMove : undefined}
      onMouseLeave={useMouseTracking ? handleMouseLeave : undefined}
    >
      {/* Holographic overlay */}
      <div
        className="shiny-holo-overlay"
        style={{
          ...holoStyle,
          opacity: config.holoOpacity,
          filter: `blur(${config.holoBlur}px) saturate(${config.holoSaturation})`,
          boxShadow: config.borderGlow,
        }}
      />

      {/* Sparkle particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className={cn(
            'shiny-sparkle absolute',
            p.desktopOnly && 'shiny-sparkle-desktop-only',
          )}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: config.particleColor,
            boxShadow: `0 0 ${p.size * 2}px ${config.particleShadowColor}`,
            clipPath: 'polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)',
            animation: `shiny-sparkle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
}
