"""Application state and FastAPI dependency providers."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator

import pandas as pd
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

from backend.config import (
    EMBEDDING_MODEL,
    FAISS_INDEX_PATH,
    METADATA_CSV,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    skip_summary,
)
from backend.recommender import MovieRecommender
from backend.summarizer import OllamaSummaries
from backend.movie_data import load_movies_df

logger = logging.getLogger(__name__)


@dataclass
class AppState:
    df: pd.DataFrame | None = None
    movies_list: list[dict] | None = None
    soups: pd.Series | None = None
    vector_db: FAISS | None = None
    recommender: MovieRecommender | None = None
    summarizer: OllamaSummaries | None = None
    faiss_loaded: bool = False
    llm_loaded: bool = False


_state = AppState()


def get_app_state() -> AppState:
    return _state


def _load_summarizer() -> OllamaSummaries | None:
    if skip_summary():
        logger.info("SKIP_SUMMARY set; insights endpoint disabled")
        return None

    try:
        return OllamaSummaries(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL)
    except Exception as exc:
        logger.error(
            "Failed to initialize Ollama summarizer (is Ollama running? model pulled?): %s",
            exc,
        )
        return None


def _initialize_state(state: AppState) -> None:
    faiss_dir = Path(FAISS_INDEX_PATH)
    if not faiss_dir.exists():
        raise RuntimeError(
            f"FAISS index not found at '{FAISS_INDEX_PATH}'. "
            "Run: python backend/build_faiss_index.py"
        )

    state.df = load_movies_df(METADATA_CSV)
    state.movies_list = [
        {"id": int(row["id"]), "title": row["title"], "year": int(row["year"])}
        for _, row in state.df.iterrows()
    ]
    state.soups = pd.Series(state.df["soup"].values, index=state.df["id"].astype(int))

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
    )
    state.vector_db = FAISS.load_local(
        FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True
    )
    state.faiss_loaded = True

    state.recommender = MovieRecommender(state.soups, state.vector_db, state.df)
    state.summarizer = _load_summarizer()
    state.llm_loaded = state.summarizer is not None


@asynccontextmanager
async def lifespan(_app) -> AsyncIterator[None]:
    global _state
    if _state.recommender is None:
        _initialize_state(_state)
    yield


def get_recommender() -> MovieRecommender:
    if _state.recommender is None:
        raise RuntimeError("Recommender not initialized")
    return _state.recommender


def get_summarizer() -> OllamaSummaries | None:
    return _state.summarizer


def get_movies_list() -> list[dict]:
    if _state.movies_list is None:
        raise RuntimeError("Movies list not initialized")
    return _state.movies_list


def set_state_for_testing(
    *,
    recommender: MovieRecommender | None = None,
    summarizer: OllamaSummaries | None = None,
    movies_list: list[dict] | None = None,
    faiss_loaded: bool = True,
    llm_loaded: bool = False,
) -> None:
    """Replace app state for fast API tests without loading FAISS/LLM."""
    global _state
    _state.recommender = recommender
    _state.summarizer = summarizer
    _state.movies_list = movies_list or []
    _state.faiss_loaded = faiss_loaded
    _state.llm_loaded = llm_loaded


def reset_state() -> None:
    global _state
    _state = AppState()
