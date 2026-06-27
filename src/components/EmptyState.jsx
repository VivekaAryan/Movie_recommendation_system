export default function EmptyState({ hasSearched }) {
  if (hasSearched) return null;

  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-testid="empty-state"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-pastel-border bg-pastel-lilac/50 text-3xl">
        🎬
      </div>
      <h2 className="text-lg font-medium text-pastel-text">Search for a movie to get started</h2>
      <p className="mt-2 max-w-sm text-sm text-pastel-muted">
        Type a title above and pick from the list — we&apos;ll find the top 10 most similar films.
      </p>
    </div>
  );
}
