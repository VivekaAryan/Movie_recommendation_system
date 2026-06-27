import math
from typing import Optional

import pandas as pd
from rapidfuzz import fuzz, process


class MovieRecommender:
    """
    Provides movie recommendations using a local FAISS vector store with hybrid ranking.
    """

    def __init__(self, soups: pd.Series, vector_db, movies_df: pd.DataFrame):
        self.soups = soups
        self.vector_db = vector_db
        self.movies_df = movies_df
        self._title_choices = [
            (int(row["id"]), row["title"]) for _, row in movies_df.iterrows()
        ]

    def resolve_movie_id(
        self, movie_id: Optional[int] = None, title: Optional[str] = None
    ) -> int:
        if movie_id is not None:
            if movie_id not in self.soups:
                raise ValueError(f"Movie id '{movie_id}' not found")
            return int(movie_id)

        if not title:
            raise ValueError("Either 'id' or 'title' must be provided")

        exact = self.movies_df[self.movies_df["title"] == title]
        if len(exact) == 1:
            return int(exact.iloc[0]["id"])
        if len(exact) > 1:
            raise ValueError(
                f"Multiple movies named '{title}'. Please select one by id."
            )

        match = process.extractOne(
            title,
            [t for _, t in self._title_choices],
            scorer=fuzz.WRatio,
        )
        if match and match[1] >= 80:
            matched_title = match[0]
            matched = self.movies_df[self.movies_df["title"] == matched_title]
            if len(matched) == 1:
                return int(matched.iloc[0]["id"])

        raise ValueError(f"Title '{title}' not found")

    @staticmethod
    def _normalize(values: list[float]) -> list[float]:
        if not values:
            return []
        min_v, max_v = min(values), max(values)
        if max_v == min_v:
            return [1.0] * len(values)
        return [(v - min_v) / (max_v - min_v) for v in values]

    def get_recommendations(
        self, movie_id: Optional[int] = None, title: Optional[str] = None
    ) -> list[dict]:
        resolved_id = self.resolve_movie_id(movie_id=movie_id, title=title)
        query = self.soups.get(resolved_id)

        results = self.vector_db.similarity_search_with_score(query, k=50)

        candidates = []
        for doc, distance in results:
            doc_id = doc.metadata.get("movie_id")
            if doc_id == resolved_id:
                continue

            candidates.append(
                {
                    "movie_id": int(doc_id),
                    "movie": doc.metadata["movie"],
                    "language": doc.metadata["language"],
                    "popularity": float(doc.metadata["popularity"]),
                    "score": round(float(doc.metadata["score"]), 1),
                    "synopsis": doc.metadata["synopsis"],
                    "year": int(doc.metadata["year"]),
                    "poster_path": doc.metadata["poster_path"],
                    "sim": float(1 / (1 + distance)),
                }
            )

        if not candidates:
            return []

        sims = self._normalize([c["sim"] for c in candidates])
        ratings = self._normalize([c["score"] for c in candidates])
        pops = self._normalize([math.log1p(c["popularity"]) for c in candidates])

        for i, candidate in enumerate(candidates):
            candidate["similarity_score"] = float(round(sims[i], 4))
            candidate["final_score"] = float(
                round(0.70 * sims[i] + 0.20 * ratings[i] + 0.10 * pops[i], 4)
            )

        candidates.sort(key=lambda x: x["final_score"], reverse=True)
        top_ten = candidates[:10]

        for item in top_ten:
            item.pop("sim", None)

        return top_ten
