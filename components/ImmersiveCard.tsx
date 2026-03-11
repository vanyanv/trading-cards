'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTiltEffect } from '@/lib/hooks/useTiltEffect';
import { useGyroscope } from '@/lib/hooks/useGyroscope';
import { RARITY_CONFIG } from '@/lib/constants';
import { RarityBadge } from '@/components/RarityBadge';
import { TypeParticles } from '@/components/TypeParticles';
import type { PulledCard, Rarity } from '@/types';

interface ImmersiveCardProps {
  card: PulledCard;
  onClose: () => void;
}

export function ImmersiveCard({ card, onClose }: ImmersiveCardProps) {
  const config = RARITY_CONFIG[card.rarity as Rarity];
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const mouseTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
    }
  }, []);

  const tiltEnabled = !prefersReducedMotion;
  const { ref: tiltRef, style: tiltStyle, handlers } = useTiltEffect({
    enabled: tiltEnabled,
    perspective: 1200,
    maxTilt: 15,
  });

  const { beta, gamma, supported: gyroSupported } = useGyroscope({
    enabled: tiltEnabled,
  });

  // Track mouse movement to decide between mouse vs gyroscope control
  const handleMouseMove = (e: React.MouseEvent) => {
    setHasMouseMoved(true);
    handlers.onMouseMove(e);
    // Reset after inactivity
    clearTimeout(mouseTimerRef.current);
    mouseTimerRef.current = setTimeout(() => setHasMouseMoved(false), 3000);
  };

  // Compute gyroscope-based tilt style when gyro is active and no mouse
  const useGyro = gyroSupported && !hasMouseMoved && !prefersReducedMotion;
  const gyroStyle: React.CSSProperties = useGyro && beta !== null && gamma !== null
    ? {
        transform: `perspective(1200px) rotateX(${Math.max(-15, Math.min(15, beta - 45))}deg) rotateY(${Math.max(-15, Math.min(15, gamma))}deg)`,
        '--holo-angle': `${Math.atan2((beta - 45) / 90, gamma / 90) * (180 / Math.PI) + 90}deg`,
        '--holo-x': `${((gamma + 45) / 90) * 100}%`,
      } as React.CSSProperties
    : {};

  const activeStyle = useGyro ? gyroStyle : tiltStyle;

  // Close on escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(mouseTimerRef.current);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-black/40 p-2 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Particles behind card */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 z-0">
            <TypeParticles types={card.types} count={30} />
          </div>
        )}

        {/* Card container */}
        <motion.div
          className="relative z-10 w-72 sm:w-80"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div
            ref={tiltRef}
            className="relative"
            style={{
              ...activeStyle,
              transformStyle: 'preserve-3d',
              willChange: prefersReducedMotion ? undefined : 'transform',
              transition: hasMouseMoved ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
            }}
            onMouseMove={handleMouseMove}
            onTouchMove={handlers.onTouchMove}
            onMouseLeave={() => {
              handlers.onMouseLeave();
              setHasMouseMoved(false);
            }}
          >
            {/* Layer 0 - Card image (back layer) */}
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{ transform: 'translateZ(-20px)' }}
            >
              <img
                src={card.image_url_hires || card.image_url}
                alt={card.name}
                width={320}
                height={448}
                className="h-auto w-full rounded-2xl"
                draggable={false}
              />

              {/* Rarity glow border */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  boxShadow: `0 0 30px ${config.color}40, 0 0 60px ${config.glowColor}, inset 0 0 30px ${config.glowColor}`,
                }}
              />
            </div>

            {/* Holographic overlay */}
            <div
              className="holo-overlay active pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                ...activeStyle,
                opacity: 0.7,
                transform: 'translateZ(10px)',
              }}
            />

            {/* Specular highlight */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(circle at ${(activeStyle as Record<string, string>)?.['--holo-x'] || '50%'} 50%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
                transform: 'translateZ(15px)',
              }}
            />

            {/* Layer 1 - Info overlay (front layer) */}
            <div
              className="pointer-events-none absolute inset-0 flex flex-col justify-end rounded-2xl"
              style={{ transform: 'translateZ(20px)' }}
            >
              <div className="rounded-b-2xl bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-16">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white drop-shadow-lg">
                      {card.name}
                    </h2>
                    <RarityBadge
                      rarity={card.rarity as Rarity}
                      className="mt-1"
                    />
                  </div>
                  {card.hp && (
                    <span className="text-sm font-semibold text-white/80">
                      {card.hp} HP
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
