import re

import ollama


def _sanitize_prompt_text(text: str, *, max_len: int = 350) -> str:
    cleaned = str(text or "").replace("\n", " ").replace("\r", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:max_len]


def _build_context_block(
    seed_movie: str,
    seed_year: str,
    seed_genres: str,
    seed_synopsis: str,
    seed_director: str,
    recommended_movie: str,
    recommended_year: str,
    recommended_language: str,
    recommended_score: str,
    recommended_genres: str,
    recommended_synopsis: str,
    recommended_cast: str,
    recommended_director: str,
) -> str:
    return f"""Seed movie: {_sanitize_prompt_text(seed_movie)} ({seed_year})
Seed genres: {_sanitize_prompt_text(seed_genres)}
Seed director: {_sanitize_prompt_text(seed_director)}
Seed overview: {_sanitize_prompt_text(seed_synopsis)}

Recommended movie: {_sanitize_prompt_text(recommended_movie)} ({recommended_year})
Recommended language: {_sanitize_prompt_text(recommended_language)}
Recommended score: {_sanitize_prompt_text(recommended_score)}
Recommended genres: {_sanitize_prompt_text(recommended_genres)}
Recommended director: {_sanitize_prompt_text(recommended_director)}
Recommended cast: {_sanitize_prompt_text(recommended_cast)}
Recommended overview: {_sanitize_prompt_text(recommended_synopsis)}"""


def _clean_response(text: str) -> str:
    cleaned = str(text or "").strip()
    cleaned = re.sub(r"^\*+|\*+$", "", cleaned)
    cleaned = re.sub(r"^#+\s*", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _extract_questions(raw: str, *, max_words: int = 12) -> list[str]:
    numbered = re.findall(r"(?:^|\n|\s)\d+[\).\s]+(.+?)(?=(?:\n|\s)\d+[\).\s]+|\Z)", raw, re.DOTALL)
    if numbered:
        questions = [_shorten_question(_clean_response(question), max_words=max_words) for question in numbered if _clean_response(question)]
        return questions[:3]

    lines = [_clean_response(line) for line in raw.splitlines() if _clean_response(line)]
    if len(lines) >= 3:
        return [_shorten_question(line, max_words=max_words) for line in lines[:3]]

    parts = [_clean_response(part) for part in re.split(r"[?\n]+", raw) if _clean_response(part)]
    questions = [_shorten_question(part if part.endswith("?") else f"{part}?", max_words=max_words) for part in parts]
    return questions[:3]


def _shorten_question(question: str, *, max_words: int = 12) -> str:
    cleaned = _clean_response(question)
    if not cleaned:
        return ""
    if not cleaned.endswith("?"):
        cleaned = f"{cleaned.rstrip('.')}?"
    words = cleaned.rstrip("?").split()
    if len(words) > max_words:
        cleaned = " ".join(words[:max_words]).rstrip(",") + "?"
    return cleaned


def insights_have_content(insights: dict) -> bool:
    if not insights:
        return False
    if any(
        insights.get(key)
        for key in ("summary", "why_recommended", "who_should_watch", "contrast_note")
    ):
        return True
    return bool(insights.get("discussion_questions"))


class OllamaSummaries:
    """Generate movie recommendation insights via a local Ollama server."""

    def __init__(self, model: str, base_url: str):
        self.model = model
        self.client = ollama.Client(host=base_url)

    def _ask(self, prompt: str) -> str:
        response = self.client.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            options={"num_predict": 160, "temperature": 0.3},
        )
        return _clean_response(response["message"]["content"])

    def get_insights(
        self,
        *,
        seed_movie: str,
        seed_year: str,
        seed_genres: str,
        seed_synopsis: str,
        seed_director: str,
        recommended_movie: str,
        recommended_year: str,
        recommended_language: str,
        recommended_score: str,
        recommended_genres: str,
        recommended_synopsis: str,
        recommended_cast: str,
        recommended_director: str,
    ) -> dict:
        context = _build_context_block(
            seed_movie=seed_movie,
            seed_year=seed_year,
            seed_genres=seed_genres,
            seed_synopsis=seed_synopsis,
            seed_director=seed_director,
            recommended_movie=recommended_movie,
            recommended_year=recommended_year,
            recommended_language=recommended_language,
            recommended_score=recommended_score,
            recommended_genres=recommended_genres,
            recommended_synopsis=recommended_synopsis,
            recommended_cast=recommended_cast,
            recommended_director=recommended_director,
        )

        summary = self._ask(
            f"Movie: {_sanitize_prompt_text(recommended_movie)}\n"
            f"Plot overview: {_sanitize_prompt_text(recommended_synopsis)}\n\n"
            "Write a brief 2-sentence summary based on the plot overview. "
            "Do not copy the overview verbatim."
        )
        why_recommended = self._ask(
            f"{context}\n\nWhy would someone who liked the seed movie enjoy the recommended movie? "
            "Answer in 2 short sentences. Do not summarize the plot."
        )
        who_should_watch = self._ask(
            f"{context}\n\nWho is the ideal audience for the recommended movie? "
            "Answer in 1 short sentence."
        )
        contrast_note = self._ask(
            f"{context}\n\nHow does the recommended movie differ in tone, pace, or style from the seed movie? "
            "Answer in 1 short sentence."
        )
        questions_raw = self._ask(
            f"{context}\n\nWrite exactly 3 very short discussion questions about the recommended movie. "
            "Each question must be 12 words or fewer. Number them 1, 2, and 3."
        )
        discussion_questions = _extract_questions(questions_raw, max_words=12)

        insights = {
            "summary": summary,
            "why_recommended": why_recommended,
            "who_should_watch": who_should_watch,
            "contrast_note": contrast_note,
            "discussion_questions": discussion_questions,
        }
        if not insights_have_content(insights):
            raise ValueError("Model returned empty insights. Please try again.")
        return insights
