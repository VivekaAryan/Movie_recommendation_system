from unittest.mock import MagicMock, patch

from backend.summarizer import (
    OllamaSummaries,
    _extract_questions,
    _shorten_question,
    insights_have_content,
)


def test_extract_questions_numbered():
    raw = "1. Was the ending earned?\n2. Who changed the most?\n3. What theme stood out?"
    assert len(_extract_questions(raw)) == 3


def test_shorten_question_limits_words():
    long_question = "How does the character development of Bruce Wayne compare across both films in detail?"
    shortened = _shorten_question(long_question, max_words=12)
    assert len(shortened.rstrip("?").split()) <= 12


def test_insights_have_content():
    assert insights_have_content(
        {
            "summary": "A dark Batman thriller.",
            "why_recommended": "",
            "who_should_watch": "",
            "contrast_note": "",
            "discussion_questions": [],
        }
    )
    assert not insights_have_content(
        {
            "summary": "",
            "why_recommended": "",
            "who_should_watch": "",
            "contrast_note": "",
            "discussion_questions": [],
        }
    )


@patch("backend.summarizer.ollama.Client")
def test_get_insights_calls_ollama(mock_client_class):
    mock_client = MagicMock()
    mock_client_class.return_value = mock_client
    mock_client.chat.side_effect = [
        {"message": {"content": "Batman faces the Joker in a battle for Gotham's soul."}},
        {"message": {"content": "Fans of the seed movie will enjoy the darker sequel."}},
        {"message": {"content": "Superhero and crime thriller fans."}},
        {"message": {"content": "It is darker and more intense than the seed movie."}},
        {
            "message": {
                "content": "1. Is the Joker purely evil?\n2. Does Batman go too far?\n3. What does Harvey Dent symbolize?"
            }
        },
    ]

    summarizer = OllamaSummaries(
        model="llama3.2:1b-instruct-q4_K_M",
        base_url="http://localhost:11434",
    )
    result = summarizer.get_insights(
        seed_movie="Batman Begins",
        seed_year="2005",
        seed_genres="Action",
        seed_synopsis="Bruce Wayne becomes Batman.",
        seed_director="Christopher Nolan",
        recommended_movie="The Dark Knight",
        recommended_year="2008",
        recommended_language="English",
        recommended_score="8.5",
        recommended_genres="Action",
        recommended_synopsis="Batman faces the Joker.",
        recommended_cast="Christian Bale",
        recommended_director="Christopher Nolan",
    )

    assert insights_have_content(result)
    assert result["summary"]
    assert len(result["discussion_questions"]) == 3
    assert mock_client.chat.call_count == 5
    first_prompt = mock_client.chat.call_args_list[0].kwargs["messages"][0]["content"]
    assert "Plot overview" in first_prompt
    assert "Batman Begins" in mock_client.chat.call_args_list[1].kwargs["messages"][0]["content"]
    assert "The Dark Knight" in mock_client.chat.call_args_list[1].kwargs["messages"][0]["content"]
