import { useState } from "react";
import Image from "next/image";
import { BASE_POSTER_URL } from "../lib/constants";

function PosterImage({ posterPath, title }) {
  const [failed, setFailed] = useState(false);
  const src = posterPath ? `${BASE_POSTER_URL}${posterPath}` : null;

  if (!src || failed) {
    return (
      <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-pastel-peach text-pastel-peach-deep/60">
        <span className="text-4xl" aria-hidden="true">
          🎞
        </span>
        <span className="sr-only">No poster for {title}</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={`${title} poster`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
        className="object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function MovieCard({
  movie,
  index,
  llmAvailable,
  isLoadingInsights,
  insightsLoadingFor,
  insightsError,
  onInsights,
}) {
  const matchPercent = movie.similarity_score != null
    ? Math.round(movie.similarity_score * 100)
    : movie.final_score != null
      ? Math.round(movie.final_score * 100)
      : null;

  const isGenerating = isLoadingInsights && insightsLoadingFor === movie.movie;

  return (
    <article
      className="movie-card-enter flex flex-col rounded-xl border border-pastel-border bg-pastel-surface p-3 shadow-sm transition duration-200 hover:scale-[1.02] hover:border-pastel-lilac-deep/40 hover:shadow-md hover:shadow-pastel-text/5 motion-reduce:transition-none motion-reduce:hover:scale-100"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative">
        <PosterImage posterPath={movie.poster_path} title={movie.movie} />
        {matchPercent != null && (
          <span className="absolute right-2 top-2 rounded-full bg-pastel-match px-2.5 py-1 text-xs font-semibold text-white shadow-md ring-1 ring-black/15">
            {matchPercent}% match
          </span>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-pastel-text">
        {movie.movie}
      </h3>

      {movie.genres && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-pastel-muted">
          {movie.genres}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-pastel-muted">
        <span>{movie.year}</span>
        <span aria-hidden="true">·</span>
        <span>{movie.language}</span>
        <span className="rounded-full bg-pastel-peach px-2 py-0.5 font-semibold text-pastel-text">
          ★ {movie.score}
        </span>
      </div>

      {(movie.director || movie.cast) && (
        <div className="mt-2 space-y-1 text-xs leading-relaxed text-pastel-muted">
          {movie.director && (
            <p className="line-clamp-1">
              <span className="font-medium text-pastel-text">Director:</span> {movie.director}
            </p>
          )}
          {movie.cast && (
            <p className="line-clamp-2">
              <span className="font-medium text-pastel-text">Cast:</span> {movie.cast}
            </p>
          )}
        </div>
      )}

      {insightsError && (
        <p role="alert" className="mt-2 text-xs text-pastel-blush-deep">
          {insightsError}
        </p>
      )}

      <button
        type="button"
        onClick={() => onInsights(movie)}
        disabled={isLoadingInsights || llmAvailable === false}
        title={llmAvailable === false ? "Start Ollama to enable insights" : undefined}
        className="mt-3 w-full rounded-lg bg-pastel-sage-deep/20 px-3 py-2 text-xs font-medium text-pastel-sage-deep transition active:scale-95 hover:bg-pastel-sage-deep/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:active:scale-100"
      >
        {isGenerating
          ? "Generating..."
          : llmAvailable === false
            ? "Insights unavailable"
            : "Explore match"}
      </button>
    </article>
  );
}
