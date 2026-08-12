'use client';

export function ContentSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Section title skeleton */}
      <div className="pb-4 border-b border-border">
        <div className="h-8 bg-secondary rounded w-1/2"></div>
      </div>

      {/* Content block skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-3">
            <div className="h-4 bg-secondary rounded w-3/4"></div>
            <div className="h-4 bg-secondary rounded w-full"></div>
            <div className="h-4 bg-secondary rounded w-5/6"></div>
            <div className="h-4 bg-secondary rounded w-2/3"></div>
          </div>
        ))}
      </div>

      {/* Questions skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-secondary rounded w-1/4"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-4 bg-secondary rounded w-10"></div>
            <div className="h-4 bg-secondary rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-8 bg-secondary rounded w-full"></div>
      ))}
    </div>
  );
}
