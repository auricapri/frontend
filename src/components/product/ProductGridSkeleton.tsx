import React from 'react';

const SkeletonCard: React.FC = () => (
  <div className="border border-neutral-100">
    <div className="aspect-square bg-neutral-100 animate-pulse" />
    <div className="p-3 space-y-2">
      <div className="h-2.5 bg-neutral-100 rounded animate-pulse w-3/4" />
      <div className="h-2.5 bg-neutral-100 rounded animate-pulse w-1/2" />
      <div className="h-2 bg-neutral-100 rounded animate-pulse w-1/3 mt-1" />
    </div>
  </div>
);

interface ProductGridSkeletonProps {
  count: number;
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ count }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
