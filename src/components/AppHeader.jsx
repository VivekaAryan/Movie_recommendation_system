import StatusBanner from "./StatusBanner";

function LogoMark() {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pastel-lilac to-pastel-sky shadow-sm ring-1 ring-pastel-border/60"
      aria-hidden="true"
    >
      <svg className="h-6 w-6 text-pastel-lilac-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M7 4v16M17 4v16M3 8h4v8H3zM13 8h4v8h-4zM3 4h18M3 20h18"
        />
      </svg>
    </div>
  );
}

export default function AppHeader({ faissAvailable, llmAvailable }) {
  return (
    <header className="relative bg-gradient-to-r from-pastel-surface via-pastel-lilac/20 to-pastel-sky/30 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <LogoMark />
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              <span className="text-pastel-text">Movie</span>
              <span className="text-pastel-lilac-deep">Match</span>
            </h1>
            <p className="mt-0.5 text-sm text-pastel-muted">
              Discover films similar to the ones you love
            </p>
          </div>
        </div>
        <StatusBanner faissAvailable={faissAvailable} llmAvailable={llmAvailable} />
      </div>
      <div
        className="h-0.5 bg-gradient-to-r from-pastel-lilac via-pastel-sky to-pastel-sage"
        aria-hidden="true"
      />
    </header>
  );
}
