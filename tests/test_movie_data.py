import math

import pandas as pd
import pytest

from backend.movie_data import build_soup, load_movies_df


def test_build_soup_includes_overview():
    row = pd.Series(
        {
            "title": "Test Movie",
            "overview": "A hero saves the day.",
            "genres": "Action",
            "keywords": "hero",
            "cast": "Actor One",
            "director": "Director One",
        }
    )
    soup = build_soup(row)
    assert "Overview: A hero saves the day." in soup
    assert "Title: Test Movie." in soup


def test_build_soup_handles_nan_overview():
    row = pd.Series(
        {
            "title": "Test Movie",
            "overview": float("nan"),
            "genres": "Action",
            "keywords": "hero",
            "cast": "Actor One",
            "director": "Director One",
        }
    )
    soup = build_soup(row)
    assert "Overview: ." in soup


def test_build_soup_truncates_overview():
    long_overview = "x" * 600
    row = pd.Series(
        {
            "title": "Test Movie",
            "overview": long_overview,
            "genres": "Action",
            "keywords": "hero",
            "cast": "Actor One",
            "director": "Director One",
        }
    )
    soup = build_soup(row)
    assert "Overview: " + ("x" * 500) in soup
    assert "x" * 501 not in soup


def test_load_movies_df_unique_ids():
    df = load_movies_df()
    assert df["id"].is_unique


def test_load_movies_df_has_soup_column():
    df = load_movies_df()
    assert "soup" in df.columns
    assert all(isinstance(s, str) for s in df["soup"].head())
