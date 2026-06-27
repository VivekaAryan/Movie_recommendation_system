import os
import warnings

import pandas as pd
import pytest
from langchain_core.documents import Document


def pytest_configure(config):
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    try:
        from starlette.exceptions import StarletteDeprecationWarning

        warnings.filterwarnings("ignore", category=StarletteDeprecationWarning)
    except ImportError:
        pass


@pytest.fixture(autouse=True)
def test_env(monkeypatch):
    monkeypatch.setenv("SKIP_SUMMARY", "1")
    monkeypatch.setenv("OMP_NUM_THREADS", "1")
    monkeypatch.setenv("TOKENIZERS_PARALLELISM", "false")


@pytest.fixture
def sample_movies_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "id": [1, 2, 3],
            "title": ["Batman Begins", "The Dark Knight", "Inception"],
            "genres": ["Action", "Action", "Sci-Fi"],
            "keywords": ["hero", "joker", "dream"],
            "cast": ["Christian Bale", "Christian Bale", "Leonardo DiCaprio"],
            "director": ["Christopher Nolan", "Christopher Nolan", "Christopher Nolan"],
            "overview": [
                "Bruce Wayne becomes Batman.",
                "Batman faces the Joker.",
                "A thief enters dreams.",
            ],
            "original_language": ["English", "English", "English"],
            "popularity": [100.0, 200.0, 150.0],
            "year": [2005, 2008, 2010],
            "score": [7.5, 8.5, 8.0],
            "poster_path": ["/a.jpg", "/b.jpg", "/c.jpg"],
        }
    )


@pytest.fixture
def sample_soups(sample_movies_df) -> pd.Series:
    from backend.movie_data import build_soup

    soups = sample_movies_df.apply(build_soup, axis=1)
    return pd.Series(soups.values, index=sample_movies_df["id"].astype(int))


@pytest.fixture
def mock_vector_db():
    class MockVectorDB:
        def similarity_search_with_score(self, query, k=50):
            docs = [
                (
                    Document(
                        page_content="doc",
                        metadata={
                            "movie_id": 2,
                            "movie": "The Dark Knight",
                            "language": "English",
                            "popularity": 200.0,
                            "year": 2008,
                            "synopsis": "Batman faces the Joker.",
                            "score": 8.5,
                            "poster_path": "/b.jpg",
                        },
                    ),
                    0.2,
                ),
                (
                    Document(
                        page_content="doc",
                        metadata={
                            "movie_id": 3,
                            "movie": "Inception",
                            "language": "English",
                            "popularity": 150.0,
                            "year": 2010,
                            "synopsis": "A thief enters dreams.",
                            "score": 8.0,
                            "poster_path": "/c.jpg",
                        },
                    ),
                    0.5,
                ),
                (
                    Document(
                        page_content="doc",
                        metadata={
                            "movie_id": 1,
                            "movie": "Batman Begins",
                            "language": "English",
                            "popularity": 100.0,
                            "year": 2005,
                            "synopsis": "Bruce Wayne becomes Batman.",
                            "score": 7.5,
                            "poster_path": "/a.jpg",
                        },
                    ),
                    0.0,
                ),
            ]
            return docs[:k]

    return MockVectorDB()


@pytest.fixture
def faiss_index_path():
    from backend.movie_data import FAISS_INDEX_PATH

    path = os.path.join(os.getcwd(), FAISS_INDEX_PATH)
    if not os.path.isdir(path):
        pytest.skip("FAISS index not built; run python backend/build_faiss_index.py")
    return path
