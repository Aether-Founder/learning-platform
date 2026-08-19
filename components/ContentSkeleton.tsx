'use client';

export function ContentSkeleton() {
  return (
    <div className="space-y-8">
      {/* Section title skeleton */}
      <div className="pb-4 border-b border-border">
        <div className="skeleton-line h-8 w-1/2"></div>
      </div>

      {/* Content block skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-3">
            <div className="skeleton-line h-4 w-3/4"></div>
            <div className="skeleton-line h-4 w-full"></div>
            <div className="skeleton-line h-4 w-5/6"></div>
            <div className="skeleton-line h-4 w-2/3"></div>
          </div>
        ))}
      </div>

      {/* Questions skeleton */}
      <div className="space-y-3">
        <div className="skeleton-line h-4 w-1/4"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton-line h-4 w-10"></div>
            <div className="skeleton-line h-4 flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="skeleton-line h-8 w-full"></div>
      ))}
    </div>
  );
}
