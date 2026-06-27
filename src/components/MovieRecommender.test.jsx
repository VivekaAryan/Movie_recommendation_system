import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import MovieRecommender from "./MovieRecommender";

vi.mock("axios");

const sampleMovies = [
  { id: 1, title: "Batman Begins", year: 2005 },
  { id: 2, title: "The Dark Knight", year: 2008 },
];

const sampleRecs = [
  {
    movie_id: 2,
    movie: "The Dark Knight",
    language: "English",
    popularity: 200,
    score: 8.5,
    synopsis: "Batman faces the Joker.",
    year: 2008,
    poster_path: "/b.jpg",
    genres: "Action",
    cast: "Christian Bale",
    director: "Christopher Nolan",
    similarity_score: 0.9,
    final_score: 0.85,
  },
  {
    movie_id: 3,
    movie: "Inception",
    language: "English",
    popularity: 150,
    score: 8.0,
    synopsis: "A thief enters dreams.",
    year: 2010,
    poster_path: "/c.jpg",
    genres: "Sci-Fi",
    cast: "Leonardo DiCaprio",
    director: "Christopher Nolan",
    similarity_score: 0.7,
    final_score: 0.75,
  },
];

describe("MovieRecommender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    axios.get.mockImplementation((url) => {
      if (url === "/api/health") {
        return Promise.resolve({ data: { faiss: true, llm: true, movies: 2 } });
      }
      return Promise.resolve({ data: sampleMovies });
    });
  });

  it("shows loading state while fetching movies", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/health") {
        return Promise.resolve({ data: { faiss: true, llm: false, movies: 2 } });
      }
      return new Promise((resolve) =>
        setTimeout(() => resolve({ data: sampleMovies }), 100)
      );
    });

    render(<MovieRecommender />);
    expect(screen.getByTestId("loading-movies")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("loading-movies")).not.toBeInTheDocument();
    });
  });

  it("shows error banner when movie list fetch fails", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/health") {
        return Promise.resolve({ data: { faiss: true, llm: false, movies: 0 } });
      }
      return Promise.reject({
        response: { data: { error: "Backend unavailable" } },
      });
    });

    render(<MovieRecommender />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Backend unavailable");
    });
  });

  it("renders recommendations after selection", async () => {
    axios.post.mockResolvedValue({ data: sampleRecs });

    render(<MovieRecommender />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/movies");
    });

    const input = screen.getByPlaceholderText("Search by title, e.g. Inception");
    fireEvent.change(input, { target: { value: "Batman" } });

    await waitFor(() => {
      expect(screen.getByText("Batman Begins (2005)")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Batman Begins (2005)"));

    await waitFor(() => {
      expect(screen.getByText("The Dark Knight")).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledWith("/api/recommendations", { id: 1 });
  });

  it("renders branded header and status pills when services are healthy", async () => {
    render(<MovieRecommender />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/MovieMatch/i);
      expect(screen.getByText("Recommendations ready")).toBeInTheDocument();
      expect(screen.getByText("AI insights ready")).toBeInTheDocument();
    });
  });

  it("shows LLM unavailable banner when health reports llm false", async () => {
    axios.get.mockImplementation((url) => {
      if (url === "/api/health") {
        return Promise.resolve({ data: { faiss: true, llm: false, movies: 2 } });
      }
      return Promise.resolve({ data: sampleMovies });
    });

    render(<MovieRecommender />);

    await waitFor(() => {
      expect(screen.getByTestId("llm-unavailable-banner")).toHaveTextContent(
        /Insights disabled/
      );
    });
  });

  it("does not show no-results dropdown when input matches selected movie", async () => {
    axios.post.mockResolvedValue({ data: sampleRecs });

    render(<MovieRecommender />);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    const input = screen.getByPlaceholderText("Search by title, e.g. Inception");
    fireEvent.change(input, { target: { value: "Batman" } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Batman Begins (2005)"));
    });

    await waitFor(() => {
      expect(input).toHaveValue("Batman Begins (2005)");
    });

    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.queryByText(/No movies found/i)).not.toBeInTheDocument();
    });
  });

  it("re-sorts recommendations when sort option changes", async () => {
    axios.post.mockResolvedValue({ data: sampleRecs });

    render(<MovieRecommender />);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    const input = screen.getByPlaceholderText("Search by title, e.g. Inception");
    fireEvent.change(input, { target: { value: "Batman" } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Batman Begins (2005)"));
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });

    const cards = () => screen.getAllByRole("article");
    expect(cards()[0]).toHaveTextContent("The Dark Knight");

    fireEvent.change(screen.getByLabelText(/sort by/i), {
      target: { value: "year-desc" },
    });

    await waitFor(() => {
      expect(cards()[0]).toHaveTextContent("Inception");
    });
  });

  it("shows message when insights service returns 503", async () => {
    axios.post
      .mockResolvedValueOnce({ data: [sampleRecs[0]] })
      .mockRejectedValueOnce({
        response: { status: 503, data: { error: "Insights service unavailable" } },
      });

    render(<MovieRecommender />);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    const input = screen.getByPlaceholderText("Search by title, e.g. Inception");
    fireEvent.change(input, { target: { value: "Batman" } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Batman Begins (2005)"));
    });

    await waitFor(() => {
      expect(screen.getByText("The Dark Knight")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /explore match/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/insights service unavailable/i);
    });
  });
});
