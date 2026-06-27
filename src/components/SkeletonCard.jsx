export default function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-xl border border-pastel-border bg-pastel-surface p-3"
      data-testid="skeleton-card"
    >
      <div className="aspect-[2/3] w-full rounded-lg bg-pastel-lilac/40" />
      <div className="mt-3 h-4 w-3/4 rounded bg-pastel-lilac/40" />
      <div className="mt-2 h-3 w-1/2 rounded bg-pastel-sky/40" />
      <div className="mt-3 h-8 w-full rounded-lg bg-pastel-sage/40" />
    </div>
  );
}
