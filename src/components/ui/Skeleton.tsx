'use client';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden bg-white/5',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-xl',
        className
      )}
      style={{ width, height }}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function WeatherCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <Skeleton className="h-5 w-32" />
      <div className="flex items-end gap-4">
        <Skeleton className="h-16 w-24" />
        <Skeleton variant="circular" className="h-12 w-12" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

export function AlertCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function CameraCardSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <Skeleton variant="rectangular" className="aspect-video w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function CameraGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CameraCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MapLoadingSkeleton() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)]/30 border-t-[var(--primary)] animate-spin mx-auto" />
        <p className="text-sm text-[var(--text-secondary)]">Loading radar map...</p>
      </div>
    </div>
  );
}
