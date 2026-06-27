function StatusPill({ label, ready, loading, testId, readyClassName, warningClassName, readyTitle, warningTitle }) {
  if (loading) {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1.5 rounded-full border border-pastel-border bg-pastel-surface/80 px-3 py-1 text-xs text-pastel-muted"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-pastel-muted/50" aria-hidden="true" />
        Checking…
      </span>
    );
  }

  if (ready) {
    return (
      <span
        role="status"
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${readyClassName}`}
        title={readyTitle}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <span
      role="status"
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${warningClassName}`}
      title={warningTitle}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {label}
    </span>
  );
}

export default function StatusBanner({ faissAvailable, llmAvailable }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <StatusPill
        label={faissAvailable === false ? "Recs unavailable" : "Recommendations ready"}
        ready={faissAvailable === true}
        loading={faissAvailable === null}
        readyClassName="border-pastel-sage-deep/30 bg-pastel-sage/60 text-pastel-sage-deep"
        warningClassName="border-pastel-peach-deep/30 bg-pastel-peach text-pastel-peach-deep"
        readyTitle="Recommendation engine is ready"
        warningTitle="FAISS index not loaded"
      />
      <StatusPill
        label={llmAvailable === false ? "Insights disabled" : "AI insights ready"}
        ready={llmAvailable === true}
        loading={llmAvailable === null}
        testId={llmAvailable === false ? "llm-unavailable-banner" : undefined}
        readyClassName="border-pastel-lilac-deep/30 bg-pastel-lilac/60 text-pastel-lilac-deep"
        warningClassName="border-pastel-peach-deep/30 bg-pastel-peach text-pastel-peach-deep"
        readyTitle="AI insights are available"
        warningTitle="Start Ollama to enable insights"
      />
    </div>
  );
}
