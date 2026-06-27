from unittest.mock import MagicMock, patch

from backend.summarizer import OllamaSummaries


@patch("backend.summarizer.ollama.Client")
def test_get_summary_calls_ollama(mock_client_class):
    mock_client = MagicMock()
    mock_client_class.return_value = mock_client
    mock_client.chat.return_value = {
        "message": {"content": "A thief enters shared dreams to plant an idea."}
    }

    summarizer = OllamaSummaries(
        model="llama3.2:1b-instruct-q4_K_M",
        base_url="http://localhost:11434",
    )
    result = summarizer.get_summary(
        movie="Inception",
        language="English",
        score="8.0",
        synopsis="A thief enters dreams.",
        year="2010",
    )

    assert result == "A thief enters shared dreams to plant an idea."
    mock_client_class.assert_called_once_with(host="http://localhost:11434")
    mock_client.chat.assert_called_once()
    call_kwargs = mock_client.chat.call_args.kwargs
    assert call_kwargs["model"] == "llama3.2:1b-instruct-q4_K_M"
    assert "Inception" in call_kwargs["messages"][0]["content"]
    assert "2010" in call_kwargs["messages"][0]["content"]
