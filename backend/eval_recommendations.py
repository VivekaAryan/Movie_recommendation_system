"""
Small evaluation harness for recommendation quality.

Run from the project root (requires a built FAISS index):
    python backend/eval_recommendations.py
"""

import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

from backend.generate_movies_recommendations import MovieRecommender
from backend.movie_data import EMBEDDING_MODEL, FAISS_INDEX_PATH, load_movies_df

# source_id -> set of movie titles expected in top 10
TEST_CASES = {
    272: {"Batman Begins", "The Dark Knight", "The Dark Knight Rises"},
    155: {"The Dark Knight", "Batman Begins", "Joker"},
    603: {"The Matrix Reloaded", "The Matrix Revolutions"},
    157336: {"Interstellar"},
    19995: {"Avatar: The Way of Water"},
}


def run_eval() -> None:
    index_path = PROJECT_ROOT / FAISS_INDEX_PATH
    if not index_path.exists():
        raise FileNotFoundError(
            f"FAISS index not found at {index_path}. "
            "Run: python backend/build_faiss_index.py"
        )

    df = load_movies_df(str(PROJECT_ROOT / "Data" / "final_metadata.csv"))
    soups = pd.Series(df["soup"].values, index=df["id"].astype(int))

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
    )
    vector_db = FAISS.load_local(
        str(index_path), embeddings, allow_dangerous_deserialization=True
    )

    recommender = MovieRecommender(soups, vector_db, df)

    hits = 0
    total_expected = 0

    print("Recommendation eval\n" + "=" * 40)
    for source_id, expected_titles in TEST_CASES.items():
        source_row = df[df["id"] == source_id]
        if source_row.empty:
            print(f"SKIP id={source_id}: not in dataset")
            continue

        source_title = source_row.iloc[0]["title"]
        recs = recommender.get_recommendations(movie_id=source_id)
        rec_titles = {r["movie"] for r in recs}

        matched = expected_titles & rec_titles
        hits += len(matched)
        total_expected += len(expected_titles)

        print(f"\nSource: {source_title} (id={source_id})")
        print(f"  Expected any of: {sorted(expected_titles)}")
        print(f"  Got top 10: {[r['movie'] for r in recs]}")
        print(f"  Hit {len(matched)}/{len(expected_titles)} expected titles")

    if total_expected:
        print(f"\nOverall hit rate: {hits}/{total_expected} ({100 * hits / total_expected:.1f}%)")


if __name__ == "__main__":
    run_eval()
