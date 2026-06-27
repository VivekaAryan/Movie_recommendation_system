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
    similarity_score: 0.9,
    final_score: 0.85,
  },
];

describe("MovieRecommender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    const input = screen.getByPlaceholderText("Start typing your movie here:");
    fireEvent.change(input, { target: { value: "Batman" } });

    await waitFor(() => {
      expect(screen.getByText("Batman Begins (2005)")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Batman Begins (2005)"));
    fireEvent.click(screen.getByRole("button", { name: /get recommendations/i }));

    await waitFor(() => {
      expect(screen.getByText("The Dark Knight")).toBeInTheDocument();
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
        /Summaries are disabled/
      );
    });
  });

  it("shows message when summary service returns 503", async () => {
    axios.post
      .mockResolvedValueOnce({ data: sampleRecs })
      .mockRejectedValueOnce({
        response: { status: 503, data: { error: "Summary service unavailable" } },
      });

    render(<MovieRecommender />);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    const input = screen.getByPlaceholderText("Start typing your movie here:");
    fireEvent.change(input, { target: { value: "Batman" } });

    await waitFor(() => {
      fireEvent.click(screen.getByText("Batman Begins (2005)"));
    });

    fireEvent.click(screen.getByRole("button", { name: /get recommendations/i }));

    await waitFor(() => {
      expect(screen.getByText("The Dark Knight")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /generate summary/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/summary service unavailable/i);
    });
  });
});
