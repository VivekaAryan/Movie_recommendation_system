import pandas as pd
import pytest

from backend.generate_movies_recommendations import MovieRecommender
from backend.movie_data import EMBEDDING_MODEL, load_movies_df


@pytest.fixture
def faiss_recommender(faiss_index_path):
    from langchain_community.vectorstores import FAISS
    from langchain_huggingface import HuggingFaceEmbeddings

    df = load_movies_df()
    soups = pd.Series(df["soup"].values, index=df["id"].astype(int))
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
    )
    vector_db = FAISS.load_local(
        faiss_index_path, embeddings, allow_dangerous_deserialization=True
    )
    return MovieRecommender(soups, vector_db, df)


@pytest.mark.integration
def test_batman_begins_recommendations(faiss_recommender):
    recs = faiss_recommender.get_recommendations(movie_id=272)
    assert len(recs) == 10
    assert all(r["movie_id"] != 272 for r in recs)
    rec_titles = {r["movie"] for r in recs}
    assert "The Dark Knight" in rec_titles


@pytest.mark.integration
def test_matrix_sequels_in_top_ten(faiss_recommender):
    recs = faiss_recommender.get_recommendations(movie_id=603)
    rec_titles = {r["movie"] for r in recs}
    assert {"The Matrix Reloaded", "The Matrix Revolutions"} & rec_titles
