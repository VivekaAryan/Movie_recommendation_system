import { describe, it, expect } from "vitest";
import { DEFAULT_SORT, sortRecommendations } from "./sortRecommendations";

const sampleRecs = [
  {
    movie: "Inception",
    year: 2010,
    score: 8.0,
    similarity_score: 0.7,
    final_score: 0.75,
    popularity: 150,
    language: "English",
    genres: "Sci-Fi, Action",
    director: "Christopher Nolan",
    cast: "Leonardo DiCaprio",
  },
  {
    movie: "The Dark Knight",
    year: 2008,
    score: 8.5,
    similarity_score: 0.9,
    final_score: 0.85,
    popularity: 200,
    language: "English",
    genres: "Action, Crime",
    director: "Christopher Nolan",
    cast: "Christian Bale",
  },
  {
    movie: "Memento",
    year: 2000,
    score: 7.8,
    similarity_score: 0.5,
    final_score: 0.6,
    popularity: 80,
    language: "English",
    genres: "Mystery, Thriller",
    director: "Christopher Nolan",
    cast: "Guy Pearce",
  },
];

describe("sortRecommendations", () => {
  it("defaults to best match by final score", () => {
    const sorted = sortRecommendations(sampleRecs, DEFAULT_SORT);
    expect(sorted.map((movie) => movie.movie)).toEqual([
      "The Dark Knight",
      "Inception",
      "Memento",
    ]);
  });

  it("sorts by year descending", () => {
    const sorted = sortRecommendations(sampleRecs, "year-desc");
    expect(sorted[0].movie).toBe("Inception");
    expect(sorted[2].movie).toBe("Memento");
  });

  it("sorts by popularity descending", () => {
    const sorted = sortRecommendations(sampleRecs, "popularity-desc");
    expect(sorted[0].movie).toBe("The Dark Knight");
    expect(sorted[2].movie).toBe("Memento");
  });

  it("sorts by rating ascending", () => {
    const sorted = sortRecommendations(sampleRecs, "rating-asc");
    expect(sorted[0].movie).toBe("Memento");
    expect(sorted[2].movie).toBe("The Dark Knight");
  });
});
