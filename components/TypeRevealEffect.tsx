'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTypeEffect } from '@/lib/type-effects';
import type { ParticleMotion } from '@/lib/type-effects';

interface TypeRevealEffectProps {
  types: string[] | null | undefined;
  active: boolean;
}

function RiseEffect({ color, gradient }: { color: string; gradient: string }) {
  const embers = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        x: 20 + Math.random() * 60,
        size: 3 + Math.random() * 5,
        delay: Math.random() * 0.3,
        duration: 0.6 + Math.random() * 0.4,
      })),
    []
  );

  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}60 0%, ${color}20 40%, transparent 70%)`,
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2] }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {embers.map((e, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${e.x}%`,
            bottom: '20%',
            width: e.size,
            height: e.size,
            backgroundColor: color,
            boxShadow: `0 0 ${e.size * 3}px ${color}`,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: -(80 + Math.random() * 120) }}
          transition={{ duration: e.duration, delay: e.delay, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

function WobbleEffect({ color }: { color: string }) {
  return (
    <>
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border-2"
          style={{
            borderColor: color,
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10,
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: [0, 8 + i * 2], opacity: [0.8, 0] }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

function FloatDownEffect({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute bottom-0 left-0 h-full w-1/2"
        style={{
          background: `linear-gradient(to top right, ${color}50, transparent)`,
          clipPath: 'polygon(0% 100%, 100% 100%, 0% 40%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 h-full w-1/2"
        style={{
          background: `linear-gradient(to top left, ${color}50, transparent)`,
          clipPath: 'polygon(100% 100%, 0% 100%, 100% 40%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
      />
    </>
  );
}

function ZigzagEffect({ color }: { color: string }) {
  const bolts = [
    'M 50 0 L 45 30 L 55 35 L 40 70 L 52 72 L 35 100',
    'M 70 0 L 65 25 L 75 30 L 60 65 L 72 68 L 58 100',
    'M 30 10 L 25 40 L 35 45 L 22 80',
  ];

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {bolts.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          filter={`drop-shadow(0 0 4px ${color})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.6, delay: i * 0.12, ease: 'easeOut' }}
        />
      ))}
    </svg>
  );
}

function OrbitEffect({ color, gradient }: { color: string; gradient: string }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: `conic-gradient(from 0deg, ${color}60, transparent, ${color}30, transparent, ${color}60)`,
      }}
      initial={{ rotate: 0, opacity: 0, scale: 0.3 }}
      animate={{ rotate: 360, opacity: [0, 0.6, 0], scale: [0.3, 1.2] }}
      transition={{ duration: 1, ease: 'easeOut' }}
    />
  );
}

function BurstEffect({ color }: { color: string }) {
  const lines = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        angle: (360 / 8) * i,
      })),
    []
  );

  return (
    <>
      {lines.map((l, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{
            width: 2,
            height: 0,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
            transformOrigin: 'center top',
            rotate: `${l.angle}deg`,
            marginLeft: -1,
          }}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: [0, 80], opacity: [0, 1, 0] }}
          transition={{ duration: 0.7, delay: i * 0.03, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

function DriftEffect({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(circle at 50% 50%, ${color}50 0%, ${color}20 30%, transparent 60%)`,
      }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: [0, 0.6, 0], scale: [0.3, 2] }}
      transition={{ duration: 1, ease: 'easeOut' }}
    />
  );
}

function TwinkleEffect({ color }: { color: string }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 0.5,
      })),
    []
  );

  return (
    <>
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            backgroundColor: color,
            boxShadow: `0 0 ${s.size}px ${color}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: 0.6, delay: s.delay, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

function SpiralEffect({ color, gradient }: { color: string; gradient: string }) {
  // Two-color spiral using conic gradient
  const secondColor = gradient.includes(',')
    ? gradient.split(',').pop()?.replace(')', '').trim() || color
    : color;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: `conic-gradient(from 0deg, ${color}60, ${secondColor}40, ${color}60, ${secondColor}40, ${color}60)`,
      }}
      initial={{ rotate: 0, opacity: 0, scale: 0.2 }}
      animate={{ rotate: 720, opacity: [0, 0.5, 0], scale: [0.2, 1.5] }}
      transition={{ duration: 1, ease: 'easeOut' }}
    />
  );
}

function ShimmerEffect({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(90deg, transparent 0%, ${color}50 50%, transparent 100%)`,
        backgroundSize: '200% 100%',
      }}
      initial={{ opacity: 0, x: '-100%' }}
      animate={{ opacity: [0, 0.7, 0], x: ['-100%', '100%'] }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    />
  );
}

function getRevealComponent(
  motionType: ParticleMotion,
  color: string,
  gradient: string
) {
  switch (motionType) {
    case 'rise':
      return <RiseEffect color={color} gradient={gradient} />;
    case 'wobble':
      return <WobbleEffect color={color} />;
    case 'float-down':
      return <FloatDownEffect color={color} />;
    case 'zigzag':
      return <ZigzagEffect color={color} />;
    case 'orbit':
      return <OrbitEffect color={color} gradient={gradient} />;
    case 'burst':
      return <BurstEffect color={color} />;
    case 'drift':
      return <DriftEffect color={color} />;
    case 'twinkle':
      return <TwinkleEffect color={color} />;
    case 'spiral':
      return <SpiralEffect color={color} gradient={gradient} />;
    case 'shimmer':
      return <ShimmerEffect color={color} />;
    default:
      return <DriftEffect color={color} />;
  }
}

export function TypeRevealEffect({ types, active }: TypeRevealEffectProps) {
  const config = getTypeEffect(types);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            {getRevealComponent(
              config.particleMotion,
              config.revealColor,
              config.revealGradient
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
