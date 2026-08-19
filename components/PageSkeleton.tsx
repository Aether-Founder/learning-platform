export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="page-skeleton-grid" aria-label="Pagina laden" role="status">
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="page-skeleton-card" />
      ))}
    </div>
  );
}
