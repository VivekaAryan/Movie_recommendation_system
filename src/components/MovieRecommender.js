import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import SearchBar from "./SearchBar";
import MovieCard from "./MovieCard";
import InsightsModal from "./InsightsModal";
import AppHeader from "./AppHeader";
import SkeletonCard from "./SkeletonCard";
import SortControls from "./SortControls";
import EmptyState from "./EmptyState";
import {
  API_HEALTH,
  API_MOVIES,
  API_RECOMMENDATIONS,
  API_INSIGHTS,
  extractErrorMessage,
  formatMovieLabel,
  recommendationKey,
} from "../lib/constants";
import { DEFAULT_SORT, sortRecommendations } from "../lib/sortRecommendations";

function insightsHaveContent(insights) {
  if (!insights) return false;
  if (insights.summary || insights.why_recommended || insights.who_should_watch || insights.contrast_note) {
    return true;
  }
  return Array.isArray(insights.discussion_questions) && insights.discussion_questions.length > 0;
}

function DismissibleAlert({ message, onDismiss, className = "" }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-xl border border-pastel-blush-deep/30 bg-pastel-blush px-4 py-3 text-sm text-pastel-blush-deep ${className}`}
    >
      <span>{message}</span>
      <div className="flex shrink-0 items-center gap-2">
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-pastel-blush-deep/80 hover:text-pastel-blush-deep"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

const MovieRecommender = () => {
  const resultsRef = useRef(null);

  const [movieTitle, setMovieTitle] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedMovieLabel, setSelectedMovieLabel] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState({});
  const [allMovies, setAllMovies] = useState([]);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsLoadingFor, setInsightsLoadingFor] = useState(null);

  const [searchError, setSearchError] = useState(null);
  const [recsError, setRecsError] = useState(null);
  const [insightsErrors, setInsightsErrors] = useState({});
  const [backendDown, setBackendDown] = useState(false);

  const [llmAvailable, setLlmAvailable] = useState(null);
  const [faissAvailable, setFaissAvailable] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);

  const displayedRecommendations = useMemo(
    () => sortRecommendations(recommendations, sortBy).slice(0, 10),
    [recommendations, sortBy]
  );

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await axios.get(API_HEALTH);
        setLlmAvailable(response.data.llm === true);
        setFaissAvailable(response.data.faiss === true);
      } catch {
        setLlmAvailable(false);
        setFaissAvailable(false);
      }
    };
    fetchHealth();
  }, []);

  useEffect(() => {
    const cached = sessionStorage.getItem("movieList");
    if (cached) {
      try {
        setAllMovies(JSON.parse(cached));
        setIsLoadingMovies(false);
        return;
      } catch {
        sessionStorage.removeItem("movieList");
      }
    }

    const fetchMovies = async () => {
      setIsLoadingMovies(true);
      setSearchError(null);
      try {
        const response = await axios.get(API_MOVIES);
        setAllMovies(response.data);
        sessionStorage.setItem("movieList", JSON.stringify(response.data));
        setBackendDown(false);
      } catch (error) {
        setBackendDown(true);
        setSearchError(extractErrorMessage(error));
      } finally {
        setIsLoadingMovies(false);
      }
    };

    fetchMovies();
  }, []);

  const scrollToResults = useCallback(() => {
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  }, []);

  const fetchRecommendations = useCallback(
    async (movieId) => {
      const id = movieId ?? selectedMovieId;
      if (!id) {
        setSearchError("Please select a movie from the dropdown first.");
        return;
      }

      setIsLoadingRecs(true);
      setRecsError(null);
      setSearchError(null);
      setHasSearched(true);

      try {
        const response = await axios.post(API_RECOMMENDATIONS, { id });
        setRecommendations(response.data);
        setSortBy(DEFAULT_SORT);
        if (response.data.length === 0) {
          setRecsError("No similar movies found. Try another title.");
        }
        scrollToResults();
      } catch (error) {
        setRecsError(extractErrorMessage(error));
        setRecommendations([]);
        scrollToResults();
      } finally {
        setIsLoadingRecs(false);
      }
    },
    [selectedMovieId, scrollToResults]
  );

  const handleSelect = (movie) => {
    setMovieTitle(formatMovieLabel(movie));
    setSelectedMovieId(movie.id);
    setSelectedMovieLabel(formatMovieLabel(movie));
    setSearchError(null);
    fetchRecommendations(movie.id);
  };

  const handleInputChange = (value) => {
    setMovieTitle(value);
    setSelectedMovieId(null);
    setSelectedMovieLabel(null);
    setSearchError(null);
  };

  const handleClearSelection = () => {
    setMovieTitle("");
    setSelectedMovieId(null);
    setSelectedMovieLabel(null);
    setRecommendations([]);
    setRecsError(null);
    setHasSearched(false);
  };

  const getInsights = async (movie) => {
    if (!llmAvailable || !selectedMovieId) return;

    setInsightsErrors((prev) => {
      const next = { ...prev };
      delete next[movie.movie];
      return next;
    });

    if (insightsHaveContent(insights[movie.movie])) {
      setSelectedMovie(movie);
      setModalOpen(true);
      return;
    }

    const payload = {
      seed_movie_id: selectedMovieId,
      recommended: {
        movie: movie.movie,
        language: movie.language || "English",
        score: movie.score,
        synopsis: movie.synopsis || "",
        year: movie.year,
        genres: movie.genres || "",
        cast: movie.cast || "",
        director: movie.director || "",
      },
    };

    setIsLoadingInsights(true);
    setInsightsLoadingFor(movie.movie);

    try {
      const response = await axios.post(API_INSIGHTS, payload);
      const nextInsights = response.data.insights;
      if (!insightsHaveContent(nextInsights)) {
        throw new Error("No insights were generated. Please try again.");
      }
      setInsights((prev) => ({ ...prev, [movie.movie]: nextInsights }));
      setSelectedMovie(movie);
      setModalOpen(true);
    } catch (error) {
      const message =
        error.response?.status === 503
          ? "Insights service unavailable. Ensure Ollama is running."
          : extractErrorMessage(error);
      setInsightsErrors((prev) => ({ ...prev, [movie.movie]: message }));
    } finally {
      setIsLoadingInsights(false);
      setInsightsLoadingFor(null);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedMovie(null);
  };

  if (backendDown && !isLoadingMovies && allMovies.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-pastel-canvas px-6 text-center">
        <div className="mb-4 text-4xl" aria-hidden="true">⚠️</div>
        <h1 className="text-xl font-semibold text-pastel-text">Backend unavailable</h1>
        <p className="mt-2 max-w-md text-sm text-pastel-muted" role="alert">
          {searchError || "Start the app with npm run dev to connect to the API."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-pastel-lilac px-6 py-2.5 text-sm font-medium text-pastel-lilac-deep transition hover:bg-pastel-lilac-deep/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pastel-canvas via-[#e8e2db] to-pastel-sky/50 text-pastel-text">
      <AppHeader faissAvailable={faissAvailable} llmAvailable={llmAvailable} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="relative flex flex-col items-center">
          <SearchBar
            isLoadingMovies={isLoadingMovies}
            allMovies={allMovies}
            movieTitle={movieTitle}
            selectedMovieId={selectedMovieId}
            selectedMovieLabel={selectedMovieLabel}
            searchError={searchError}
            isLoadingRecs={isLoadingRecs}
            onInputChange={handleInputChange}
            onSelect={handleSelect}
            onSearch={() => fetchRecommendations()}
            onClearSelection={handleClearSelection}
            onDismissError={() => setSearchError(null)}
          />
        </section>

        <section ref={resultsRef} className="mt-12">
          {isLoadingRecs && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!isLoadingRecs && recsError && (
            <DismissibleAlert
              message={recsError}
              onDismiss={() => setRecsError(null)}
              className="mb-6"
            />
          )}

          {!isLoadingRecs && recsError && (
            <button
              type="button"
              onClick={() => fetchRecommendations()}
              className="mb-6 rounded-xl border border-pastel-border bg-pastel-surface px-4 py-2 text-sm text-pastel-muted transition hover:bg-pastel-lilac/40"
            >
              Retry
            </button>
          )}

          {!isLoadingRecs && recommendations.length > 0 && (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-lg font-medium text-pastel-muted">
                  Top picks similar to{" "}
                  <span className="text-pastel-text">{selectedMovieLabel || movieTitle}</span>
                </h2>
                <SortControls value={sortBy} onChange={setSortBy} />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {displayedRecommendations.map((movie, index) => (
                  <MovieCard
                    key={recommendationKey(movie)}
                    movie={movie}
                    index={index}
                    llmAvailable={llmAvailable}
                    isLoadingInsights={isLoadingInsights}
                    insightsLoadingFor={insightsLoadingFor}
                    insightsError={insightsErrors[movie.movie]}
                    onInsights={getInsights}
                  />
                ))}
              </div>
            </>
          )}

          {!isLoadingRecs && recommendations.length === 0 && !recsError && (
            <EmptyState hasSearched={hasSearched} />
          )}
        </section>
      </main>

      {modalOpen && selectedMovie && insightsHaveContent(insights[selectedMovie.movie]) && (
        <InsightsModal
          movie={selectedMovie}
          insights={insights[selectedMovie.movie]}
          seedLabel={selectedMovieLabel || movieTitle}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default MovieRecommender;
