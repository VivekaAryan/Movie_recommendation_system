import logging
import os

# Avoid FAISS/OpenMP segfaults on macOS when multiple threads are used
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

from typing import Annotated, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.dependencies import (
    get_app_state,
    get_movies_list,
    get_recommender,
    get_summarizer,
    lifespan,
)
from backend.recommender import MovieRecommender
from backend.summarizer import OllamaSummaries

logging.basicConfig(level=logging.INFO)


class RecommendationRequest(BaseModel):
    id: Optional[int] = None
    title: Optional[str] = None


class SummaryRequest(BaseModel):
    movie: str
    language: str
    score: str
    synopsis: str
    year: str


class Movie(BaseModel):
    id: int
    title: str
    year: int


def create_app(*, eager_init: bool = False) -> FastAPI:
    """
    Create the FastAPI application.

    Args:
        eager_init: If True, load FAISS/embeddings at import time (integration tests).
                    If False, defer loading to lifespan (default for uvicorn).
    """
    application = FastAPI(lifespan=lifespan)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/api/movies", response_model=List[Movie])
    async def get_movies(movies: Annotated[list, Depends(get_movies_list)]):
        return movies

    @application.get("/")
    async def read_root():
        return {"message": "Welcome to the Movie Recommender API"}

    @application.get("/health")
    async def health():
        state = get_app_state()
        movies_count = len(state.movies_list) if state.movies_list else 0
        return {
            "faiss": state.faiss_loaded,
            "llm": state.llm_loaded,
            "movies": movies_count,
        }

    @application.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        return JSONResponse(content=None)

    @application.post("/recommendations")
    async def get_recommendations(
        request: RecommendationRequest,
        recommender: Annotated[MovieRecommender, Depends(get_recommender)],
    ):
        try:
            recommendations = recommender.get_recommendations(
                movie_id=request.id, title=request.title
            )
            return recommendations
        except ValueError as e:
            logging.error("Error: %s", str(e))
            raise HTTPException(status_code=400, detail=str(e)) from e
        except Exception as e:
            logging.error("Unexpected Error: %s", str(e))
            raise HTTPException(status_code=500, detail="Internal Server Error") from e

    @application.post("/summary")
    async def get_summary(
        request: Request,
        summarizer: Annotated[OllamaSummaries | None, Depends(get_summarizer)],
    ):
        if summarizer is None:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Summary service unavailable. Ensure Ollama is running "
                    "and OLLAMA_MODEL is set in .env (see .env.example)."
                ),
            )

        try:
            data = await request.json()
            logging.info("Received summary request: %s", data)

            summary_request = SummaryRequest(**data)

            summary = summarizer.get_summary(
                movie=summary_request.movie,
                language=summary_request.language,
                score=summary_request.score,
                synopsis=summary_request.synopsis,
                year=summary_request.year,
            )
            return {"summary": summary}
        except Exception as e:
            logging.error("Unexpected Error: %s", str(e))
            raise HTTPException(status_code=500, detail="Internal Server Error") from e

    if eager_init:
        from backend.dependencies import _initialize_state

        _initialize_state(get_app_state())

    return application


app = create_app()
