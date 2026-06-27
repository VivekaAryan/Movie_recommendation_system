import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BASE_POSTER_URL = "https://image.tmdb.org/t/p/w500";
const API_MOVIES = "/api/movies";
const API_RECOMMENDATIONS = "/api/recommendations";
const API_SUMMARY = "/api/summary";
const API_HEALTH = "/api/health";

function extractErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  return "Something went wrong. Is the backend running?";
}

const MovieRecommender = () => {
  const [movieTitle, setMovieTitle] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [allMovies, setAllMovies] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryLoadingFor, setSummaryLoadingFor] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [llmAvailable, setLlmAvailable] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await axios.get(API_HEALTH);
        setLlmAvailable(response.data.llm === true);
      } catch {
        setLlmAvailable(false);
      }
    };

    fetchHealth();
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoadingMovies(true);
      setErrorMessage(null);
      try {
        const response = await axios.get(API_MOVIES);
        setAllMovies(response.data);
      } catch (error) {
        setErrorMessage(extractErrorMessage(error));
      } finally {
        setIsLoadingMovies(false);
      }
    };

    fetchMovies();
  }, []);

  const filterSuggestions = useCallback((value, movies) => {
    if (!value) {
      setFilteredSuggestions([]);
      setDropdownOpen(false);
      return;
    }
    const matches = movies.filter(movie =>
      movie.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestions(matches);
    setDropdownOpen(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      filterSuggestions(movieTitle, allMovies);
    }, 200);
    return () => clearTimeout(timer);
  }, [movieTitle, allMovies, filterSuggestions]);

  const getRecommendations = async () => {
    if (!selectedMovieId) {
      setErrorMessage("Please select a movie from the dropdown first.");
      return;
    }

    setIsLoadingRecs(true);
    setErrorMessage(null);
    try {
      const response = await axios.post(API_RECOMMENDATIONS, { id: selectedMovieId });
      setRecommendations(response.data);
      if (response.data.length === 0) {
        setErrorMessage("No similar movies found for this title.");
      }
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setRecommendations([]);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const getSummary = async (movie) => {
    if (!llmAvailable) {
      setErrorMessage(
        "Summaries disabled — ensure Ollama is running and restart the app with npm run dev."
      );
      return;
    }

    if (summaries[movie.movie]) {
      setSelectedMovie(movie);
      setModalOpen(true);
      return;
    }

    const payload = {
      movie: movie.movie,
      language: movie.language || "English",
      score: movie.score.toString(),
      synopsis: movie.synopsis,
      year: movie.year.toString()
    };

    setIsLoadingSummary(true);
    setSummaryLoadingFor(movie.movie);
    setErrorMessage(null);

    try {
      const response = await axios.post(API_SUMMARY, payload);
      setSummaries(prev => ({ ...prev, [movie.movie]: response.data.summary }));
      setSelectedMovie(movie);
      setModalOpen(true);
    } catch (error) {
      const message = extractErrorMessage(error);
      if (error.response?.status === 503) {
        setErrorMessage(
          "Summary service unavailable. Ensure Ollama is running and OLLAMA_MODEL is set in .env."
        );
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsLoadingSummary(false);
      setSummaryLoadingFor(null);
    }
  };

  const formatMovieLabel = (movie) => `${movie.title} (${movie.year})`;

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMovieTitle(value);
    setSelectedMovieId(null);
    setErrorMessage(null);
  };

  const handleSuggestionSelect = (movie) => {
    setMovieTitle(formatMovieLabel(movie));
    setSelectedMovieId(movie.id);
    setDropdownOpen(false);
    setErrorMessage(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedMovie(null);
  };

  const recommendationKey = (movie) => `${movie.movie_id ?? movie.movie}-${movie.year}`;

  return (
    <div className="min-h-screen bg-blue-100 flex flex-col items-center p-6">
      {llmAvailable === false && (
        <div
          role="status"
          data-testid="llm-unavailable-banner"
          className="w-full max-w-3xl mb-4 p-4 bg-amber-100 border border-amber-400 text-amber-900 rounded-lg"
        >
          Summaries are disabled. Ensure Ollama is running and start the app with{" "}
          <code className="font-mono text-sm">npm run dev</code>.
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="w-full max-w-3xl mb-4 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg"
        >
          {errorMessage}
        </div>
      )}

      <div
        className="w-full max-w-full flex flex-col items-center p-6 mb-8 rounded-lg shadow-lg bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600"
      >
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Movie Recommendation System</h1>

        {isLoadingMovies ? (
          <p className="text-white mb-4" data-testid="loading-movies">Loading movie list...</p>
        ) : null}

        <input
          type="text"
          value={movieTitle}
          onChange={handleInputChange}
          placeholder="Start typing your movie here:"
          disabled={isLoadingMovies}
          className="border p-3 mb-5 w-full max-w-md rounded-full shadow-2xl focus:outline-none focus:ring-2 focus:ring-black bg-white disabled:opacity-60"
        />
        {dropdownOpen && filteredSuggestions.length > 0 && (
          <ul className="bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto w-full max-w-md">
            {filteredSuggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                className="p-2 cursor-pointer hover:bg-gray-200"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                {formatMovieLabel(suggestion)}
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={getRecommendations}
          disabled={isLoadingMovies || isLoadingRecs}
          className="bg-white text-black py-2 px-6 rounded-full shadow hover:bg-blue-400 hover:ring-1 hover:ring-black hover:font-bold transition mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoadingRecs ? "Loading recommendations..." : "Get Recommendations"}
        </button>
      </div>

      {recommendations.length > 0 && (
        <h2 className="text-2xl font-semibold mb-6">
          Top 10 movies similar to: <span className="font-bold">{movieTitle}</span>
        </h2>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-5/6 max-w-7xl">
        {recommendations.slice(0, 10).map((movie) => (
          <div
            key={recommendationKey(movie)}
            className="bg-blue-400 p-4 rounded-lg shadow-md flex flex-col items-center group relative"
          >
            <div className="h-auto w-full mb-4 group-hover:opacity-50 transition-opacity duration-300">
              <img src={BASE_POSTER_URL + movie.poster_path} alt={`${movie.movie} poster`} className="rounded w-full" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => getSummary(movie)}
                disabled={isLoadingSummary || llmAvailable === false}
                className="bg-gray-800 text-white py-1 px-3 rounded shadow hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoadingSummary && summaryLoadingFor === movie.movie
                  ? "Generating..."
                  : llmAvailable === false
                    ? "Summary Unavailable"
                    : "Generate Summary"}
              </button>
            </div>
            <h4 className="font-bold text-lg text-center">{movie.movie}</h4>
            <p className="text-gray-600 mb-4 text-center">{movie.language} ({movie.year}) | Score: {movie.score}</p>
          </div>
        ))}
      </div>

      {modalOpen && selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-300 p-6 rounded-lg shadow-lg w-3/4 max-w-lg">
            <h4 className="font-bold text-xl mb-4">{selectedMovie.movie} - Summary</h4>
            <p className="text-gray-700">{summaries[selectedMovie.movie]}</p>
            <div className="flex justify-center mt-4">
              <button onClick={closeModal} className="bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-700 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieRecommender;
