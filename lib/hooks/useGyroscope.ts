'use client';

import { useEffect, useState } from 'react';

interface GyroscopeOptions {
  enabled: boolean;
}

interface GyroscopeResult {
  beta: number | null;
  gamma: number | null;
  supported: boolean;
}

export function useGyroscope(options: GyroscopeOptions): GyroscopeResult {
  const { enabled } = options;
  const [beta, setBeta] = useState<number | null>(null);
  const [gamma, setGamma] = useState<number | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const hasDeviceOrientation = 'DeviceOrientationEvent' in window;
    if (!hasDeviceOrientation) {
      setSupported(false);
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      setSupported(true);
      setBeta(event.beta);
      setGamma(event.gamma);
    };

    const startListening = () => {
      window.addEventListener('deviceorientation', handleOrientation);
    };

    // iOS 13+ requires permission request
    const DOE = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            startListening();
          } else {
            setSupported(false);
          }
        })
        .catch(() => {
          setSupported(false);
        });
    } else {
      startListening();
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled]);

  return { beta, gamma, supported };
}
