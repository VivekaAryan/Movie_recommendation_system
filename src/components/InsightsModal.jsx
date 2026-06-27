import { useEffect, useRef } from "react";
import Image from "next/image";
import { BASE_POSTER_URL } from "../lib/constants";

const SECTIONS = [
  { key: "why_recommended", label: "Why recommended", bg: "bg-pastel-sky/40", heading: "text-pastel-sky-deep" },
  { key: "who_should_watch", label: "Who should watch", bg: "bg-pastel-sage/40", heading: "text-pastel-sage-deep" },
  { key: "contrast_note", label: "Contrast note", bg: "bg-pastel-peach/40", heading: "text-pastel-peach-deep" },
];

export default function InsightsModal({ movie, insights, seedLabel, onClose }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const elements = Array.from(focusable);
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  const posterSrc = movie.poster_path
    ? `${BASE_POSTER_URL}${movie.poster_path}`
    : null;

  const questions = insights?.discussion_questions ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-pastel-text/30 backdrop-blur-sm transition-opacity"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="insights-modal-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg scale-100 overflow-y-auto rounded-2xl border border-pastel-border bg-pastel-surface p-6 shadow-xl shadow-pastel-border/50 transition duration-200"
      >
        <div className="flex gap-4">
          {posterSrc && (
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-pastel-border">
              <Image
                src={posterSrc}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="insights-modal-title" className="text-lg font-semibold text-pastel-text">
              {movie.movie}
            </h2>
            <p className="mt-0.5 text-sm text-pastel-muted">
              {movie.year} · {movie.language} · ★ {movie.score}
            </p>
            {movie.genres && (
              <p className="mt-1 text-xs text-pastel-muted">{movie.genres}</p>
            )}
            {seedLabel && (
              <p className="mt-1 text-xs text-pastel-muted">
                Compared to <span className="font-medium text-pastel-text">{seedLabel}</span>
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-pastel-muted transition hover:bg-pastel-lilac/50 hover:text-pastel-text"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {questions.length === 0 && !insights?.summary && !SECTIONS.some(({ key }) => insights?.[key]) && (
            <p className="rounded-xl bg-pastel-blush/40 p-4 text-sm text-pastel-blush-deep">
              No insights were generated. Close and try again.
            </p>
          )}

          {insights?.summary && (
            <div className="rounded-xl bg-pastel-lilac/30 p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-pastel-lilac-deep">
                Summary
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-pastel-text">{insights.summary}</p>
            </div>
          )}

          {SECTIONS.map(({ key, label, bg, heading }) =>
            insights?.[key] ? (
              <div key={key} className={`rounded-xl p-4 ${bg}`}>
                <h3 className={`text-xs font-medium uppercase tracking-wide ${heading}`}>
                  {label}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-pastel-text">{insights[key]}</p>
              </div>
            ) : null
          )}

          {questions.length > 0 && (
            <div className="rounded-xl bg-pastel-lilac/40 p-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-pastel-lilac-deep">
                Discussion questions
              </h3>
              <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-pastel-text">
                {questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-pastel-muted">
          Generated by a local AI model. May contain inaccuracies.
        </p>
      </div>
    </div>
  );
}
