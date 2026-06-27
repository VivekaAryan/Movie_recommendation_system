import pytest
from fastapi.testclient import TestClient

from backend.recommender import MovieRecommender


@pytest.fixture
def client(sample_movies_df, sample_soups, mock_vector_db):
    from backend.dependencies import reset_state, set_state_for_testing
    from backend.main import create_app

    reset_state()
    recommender = MovieRecommender(sample_soups, mock_vector_db, sample_movies_df)
    movies_list = [
        {"id": int(row["id"]), "title": row["title"], "year": int(row["year"])}
        for _, row in sample_movies_df.iterrows()
    ]

    class MockSummarizer:
        def get_insights(self, **kwargs):
            return {
                "summary": "Batman faces the Joker in a fight for Gotham.",
                "why_recommended": "A gripping follow-up for fans of the seed movie.",
                "who_should_watch": "Action and thriller fans.",
                "contrast_note": "Darker and more intense than the seed film.",
                "discussion_questions": [
                    "Does the hero change by the end?",
                    "What drives the villain?",
                    "Which scene stayed with you?",
                ],
            }

    set_state_for_testing(
        recommender=recommender,
        summarizer=MockSummarizer(),
        movies_list=movies_list,
        faiss_loaded=True,
        llm_loaded=True,
    )

    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    reset_state()


@pytest.fixture
def client_no_llm(sample_movies_df, sample_soups, mock_vector_db):
    from backend.dependencies import reset_state, set_state_for_testing
    from backend.main import create_app

    reset_state()
    recommender = MovieRecommender(sample_soups, mock_vector_db, sample_movies_df)
    movies_list = [
        {"id": int(row["id"]), "title": row["title"], "year": int(row["year"])}
        for _, row in sample_movies_df.iterrows()
    ]

    set_state_for_testing(
        recommender=recommender,
        summarizer=None,
        movies_list=movies_list,
        faiss_loaded=True,
        llm_loaded=False,
    )

    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
    reset_state()


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["faiss"] is True
    assert data["llm"] is True
    assert data["movies"] == 3


def test_get_movies(client):
    response = client.get("/api/movies")
    assert response.status_code == 200
    movies = response.json()
    assert len(movies) > 0
    assert {"id", "title", "year"} <= set(movies[0].keys())


def test_recommendations_by_id(client):
    response = client.post("/recommendations", json={"id": 1})
    assert response.status_code == 200
    recs = response.json()
    assert 0 < len(recs) <= 10
    assert all("movie" in r and "similarity_score" in r for r in recs)


def test_recommendations_invalid_id(client):
    response = client.post("/recommendations", json={"id": 999999999})
    assert response.status_code == 400


def test_insights_with_mock_summarizer(client):
    response = client.post(
        "/insights",
        json={
            "seed_movie_id": 1,
            "recommended": {
                "movie": "The Dark Knight",
                "language": "English",
                "score": 8.5,
                "synopsis": "Batman faces the Joker.",
                "year": 2008,
                "genres": "Action",
                "cast": "Christian Bale",
                "director": "Christopher Nolan",
            },
        },
    )
    assert response.status_code == 200
    data = response.json()["insights"]
    assert data["why_recommended"]
    assert len(data["discussion_questions"]) == 3


def test_insights_unavailable_when_no_llm(client_no_llm):
    response = client_no_llm.post(
        "/insights",
        json={
            "seed_movie_id": 1,
            "recommended": {
                "movie": "Test",
                "language": "English",
                "score": 7.0,
                "synopsis": "A test plot.",
                "year": 2020,
                "genres": "Drama",
                "cast": "Actor",
                "director": "Director",
            },
        },
    )
    assert response.status_code == 503
