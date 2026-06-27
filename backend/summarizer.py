import ollama


def _build_summary_prompt(
    movie: str, language: str, score: str, synopsis: str, year: str
) -> str:
    return f"""Write a brief movie summary based on the provided information. Do not repeat the question in the output.

Movie: {movie}
Language: {language}
Weighted score: {score}
Plot Overview: {synopsis}
Year: {year}

Summary:"""


class OllamaSummaries:
    """Generate movie summaries via a local Ollama server."""

    def __init__(self, model: str, base_url: str):
        self.model = model
        self.client = ollama.Client(host=base_url)

    def get_summary(
        self, movie: str, language: str, score: str, synopsis: str, year: str
    ) -> str:
        prompt = _build_summary_prompt(movie, language, score, synopsis, year)

        response = self.client.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            options={"num_predict": 256},
        )

        return response["message"]["content"].strip()
