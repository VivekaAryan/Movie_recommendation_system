export const BASE_POSTER_URL = "https://image.tmdb.org/t/p/w500";
export const API_MOVIES = "/api/movies";
export const API_RECOMMENDATIONS = "/api/recommendations";
export const API_INSIGHTS = "/api/insights";
export const API_HEALTH = "/api/health";
export const SUGGESTION_LIMIT = 10;
export const SUGGESTION_DEBOUNCE_MS = 150;

export function extractErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  return "Something went wrong. Is the backend running?";
}

export function formatMovieLabel(movie) {
  return `${movie.title} (${movie.year})`;
}

export function rankSuggestions(query, movies, limit = SUGGESTION_LIMIT) {
  const q = query.toLowerCase().trim();
  if (!q) return { matches: [], total: 0 };

  const startsWith = [];
  const contains = [];

  for (const movie of movies) {
    const title = movie.title.toLowerCase();
    if (title.startsWith(q)) startsWith.push(movie);
    else if (title.includes(q)) contains.push(movie);
  }

  const all = [...startsWith, ...contains];
  return { matches: all.slice(0, limit), total: all.length };
}

export function recommendationKey(movie) {
  return `${movie.movie_id ?? movie.movie}-${movie.year}`;
}
