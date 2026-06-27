import { useEffect, useRef, useState, useCallback, useId } from "react";
import { formatMovieLabel, rankSuggestions, SUGGESTION_DEBOUNCE_MS, SUGGESTION_LIMIT } from "../lib/constants";

function SearchIcon() {
  return (
    <svg className="h-4 w-4 text-pastel-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function DismissibleAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mt-3 flex items-start justify-between gap-2 rounded-xl border border-pastel-blush-deep/30 bg-pastel-blush px-3 py-2 text-sm text-pastel-blush-deep"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-pastel-blush-deep/70 hover:text-pastel-blush-deep"
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
}

export default function SearchBar({
  isLoadingMovies,
  allMovies,
  movieTitle,
  selectedMovieId,
  selectedMovieLabel,
  searchError,
  isLoadingRecs,
  onInputChange,
  onSelect,
  onSearch,
  onClearSelection,
  onDismissError,
}) {
  const listboxId = useId();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);

  const inputMatchesSelection =
    selectedMovieId != null &&
    selectedMovieLabel != null &&
    movieTitle.trim() === selectedMovieLabel.trim();

  const updateSuggestions = useCallback(
    (value) => {
      if (!value.trim()) {
        setSuggestions([]);
        setTotalMatches(0);
        setDropdownOpen(false);
        setHighlightedIndex(-1);
        return;
      }

      if (
        selectedMovieId != null &&
        selectedMovieLabel != null &&
        value.trim() === selectedMovieLabel.trim()
      ) {
        setSuggestions([]);
        setTotalMatches(0);
        setDropdownOpen(false);
        setHighlightedIndex(-1);
        return;
      }

      const { matches, total } = rankSuggestions(value, allMovies);
      setSuggestions(matches);
      setTotalMatches(total);
      setDropdownOpen(true);
      setHighlightedIndex(matches.length > 0 ? 0 : -1);
    },
    [allMovies, selectedMovieId, selectedMovieLabel]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      updateSuggestions(movieTitle);
    }, SUGGESTION_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [movieTitle, updateSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectSuggestion = (movie) => {
    onSelect(movie);
    setDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!dropdownOpen && e.key === "ArrowDown" && suggestions.length > 0) {
      setDropdownOpen(true);
      setHighlightedIndex(0);
      e.preventDefault();
      return;
    }

    if (!dropdownOpen) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (suggestions.length === 1) {
          selectSuggestion(suggestions[0]);
        } else if (selectedMovieId) {
          onSearch();
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          selectSuggestion(suggestions[highlightedIndex]);
        } else if (suggestions.length === 1) {
          selectSuggestion(suggestions[0]);
        }
        break;
      case "Escape":
        setDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    onInputChange("");
    onClearSelection();
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  if (isLoadingMovies) {
    return (
      <div className="w-full max-w-xl" data-testid="loading-movies">
        <div className="h-12 animate-pulse rounded-xl bg-pastel-lilac/50" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
          }
          value={movieTitle}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputMatchesSelection) return;
            if (movieTitle.trim() && suggestions.length > 0) setDropdownOpen(true);
          }}
          placeholder="Search by title, e.g. Inception"
          autoComplete="off"
          className="w-full rounded-xl border border-pastel-border bg-pastel-surface py-3 pl-11 pr-10 text-pastel-text placeholder-pastel-muted/70 shadow-sm transition focus:border-pastel-lilac-deep/50 focus:outline-none focus:ring-2 focus:ring-pastel-lilac/60"
        />

        {movieTitle && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-pastel-muted hover:text-pastel-text"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {selectedMovieLabel && selectedMovieId && (
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-pastel-lilac-deep/30 bg-pastel-lilac px-3 py-1 text-xs text-pastel-lilac-deep">
            {selectedMovieLabel}
            <button
              type="button"
              onClick={onClearSelection}
              className="ml-1 hover:text-pastel-text"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      <DismissibleAlert message={searchError} onDismiss={onDismissError} />

      {dropdownOpen && movieTitle.trim() && (
        <ul
          id={listboxId}
          role="listbox"
          className="dropdown-enter absolute z-20 mt-2 max-h-60 w-full max-w-xl overflow-y-auto rounded-xl border border-pastel-border bg-pastel-surface py-1 shadow-lg shadow-pastel-border/40"
        >
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-pastel-muted" role="option" aria-selected="false">
              No movies found for &ldquo;{movieTitle}&rdquo;
            </li>
          ) : (
            <>
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition ${
                    index === highlightedIndex
                      ? "bg-pastel-lilac text-pastel-lilac-deep"
                      : "text-pastel-text hover:bg-pastel-sky/50"
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {formatMovieLabel(suggestion)}
                </li>
              ))}
              {totalMatches > SUGGESTION_LIMIT && (
                <li className="border-t border-pastel-border px-4 py-2 text-xs text-pastel-muted">
                  Showing {SUGGESTION_LIMIT} of {totalMatches} matches
                </li>
              )}
            </>
          )}
        </ul>
      )}

      <button
        type="button"
        onClick={onSearch}
        disabled={isLoadingRecs || !selectedMovieId}
        className="mt-4 w-full rounded-xl bg-pastel-lilac-deep/25 px-6 py-2.5 text-sm font-medium text-pastel-text transition active:scale-95 hover:bg-pastel-lilac-deep/35 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:active:scale-100 sm:w-auto"
      >
        {isLoadingRecs ? "Loading recommendations..." : "Search again"}
      </button>
    </div>
  );
}
