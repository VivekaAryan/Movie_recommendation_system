import pytest

from backend.generate_movies_recommendations import MovieRecommender


def test_resolve_movie_id_by_id(sample_movies_df, sample_soups, mock_vector_db):
    recommender = MovieRecommender(sample_soups, mock_vector_db, sample_movies_df)
    assert recommender.resolve_movie_id(movie_id=1) == 1


def test_resolve_movie_id_by_exact_title(sample_movies_df, sample_soups, mock_vector_db):
    recommender = MovieRecommender(sample_soups, mock_vector_db, sample_movies_df)
    assert recommender.resolve_movie_id(title="The Dark Knight") == 2


def test_resolve_movie_id_fuzzy_title(sample_movies_df, sample_soups, mock_vector_db):
    recommender = MovieRecommender(sample_soups, mock_vector_db, sample_movies_df)
    assert recommender.resolve_movie_id(title="Batman Begin") == 1


def test_resolve_movie_id_not_found(sample_movies_df, sample_soups, mock_vector_db):
    recommender = MovieRecommender(sample_soups, mock_vector_db, sample_movies_df)
    with pytest.raises(ValueError, match="not found"):
        recommender.resolve_movie_id(title="Totally Unknown Film XYZ")


def test_resolve_movie_id_requires_input(sample_movies_df, sample_soups, mock_vector_db):
    recommender = MovieRecommender(sample_soups, mock_vector_db, sample_movies_df)
    with pytest.raises(ValueError, match="Either 'id' or 'title'"):
        recommender.resolve_movie_id()


def test_normalize_empty():
    assert MovieRecommender._normalize([]) == []


def test_normalize_constant_values():
    assert MovieRecommender._normalize([5.0, 5.0, 5.0]) == [1.0, 1.0, 1.0]


def test_normalize_range():
    result = MovieRecommender._normalize([0.0, 5.0, 10.0])
    assert result == [0.0, 0.5, 1.0]


def test_get_recommendations_excludes_source(
    sample_movies_df, sample_soups, mock_vector_db
):
    recommender = MovieRecommender(sample_soups, mock_vector_db, sample_movies_df)
    recs = recommender.get_recommendations(movie_id=1)

    assert len(recs) == 2
    assert all(r["movie_id"] != 1 for r in recs)
    assert all("similarity_score" in r for r in recs)
    assert all("final_score" in r for r in recs)
    assert "sim" not in recs[0]


def test_get_recommendations_sorted_by_final_score(
    sample_movies_df, sample_soups, mock_vector_db
):
    recommender = MovieRecommender(sample_soups, mock_vector_db, sample_movies_df)
    recs = recommender.get_recommendations(movie_id=1)
    scores = [r["final_score"] for r in recs]
    assert scores == sorted(scores, reverse=True)
