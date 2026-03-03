'use client';

import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-6 space-y-4 animate-pulse',
        'bg-muted/50',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-full" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-lg border p-6 space-y-4 animate-pulse bg-muted/50">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-lg bg-muted" />
        <div className="h-6 bg-muted rounded w-1/4" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 p-4 animate-pulse">
      {[...Array(columns)].map((_, i) => (
        <div key={i} className="flex-1 h-4 bg-muted rounded" />
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-muted/30 animate-pulse border-b">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-muted rounded" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  );
}
