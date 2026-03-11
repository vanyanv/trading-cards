'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/cn';

interface ImageWithSkeletonProps extends ImageProps {
  containerClassName?: string;
}

export function ImageWithSkeleton({
  containerClassName,
  className,
  onLoad,
  ...props
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('relative', containerClassName)}>
      {!loaded && <div className="skeleton absolute inset-0 rounded-xl" />}
      <Image
        {...props}
        className={cn(
          className,
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={(e) => {
          setLoaded(true);
          if (typeof onLoad === 'function') {
            (onLoad as (e: React.SyntheticEvent<HTMLImageElement>) => void)(e);
          }
        }}
      />
    </div>
  );
}
