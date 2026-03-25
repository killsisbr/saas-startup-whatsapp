import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-16 h-7" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="border-b border-white/5 p-4 flex gap-8">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-24 h-4 flex-1" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-white/5 p-5 flex gap-8">
          {[1, 2, 3, 4].map(j => <Skeleton key={j} className="w-full h-4 flex-1" />)}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-72 h-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
      <SkeletonTable />
    </div>
  );
}
