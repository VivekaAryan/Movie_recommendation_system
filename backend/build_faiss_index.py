"""
Build and persist a local FAISS index from final_metadata.csv.

Run from the project root:
    python backend/build_faiss_index.py
"""

import sys
from pathlib import Path

import os

os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings

from backend.config import METADATA_CSV
from backend.movie_data import EMBEDDING_MODEL, FAISS_INDEX_PATH, load_movies_df


def build_index() -> None:
    df = load_movies_df(str(PROJECT_ROOT / METADATA_CSV))

    docs = []
    for _, row in df.iterrows():
        docs.append(
            Document(
                page_content=row["soup"],
                metadata={
                    "movie_id": int(row["id"]),
                    "movie": row["title"],
                    "language": row["original_language"],
                    "popularity": float(row["popularity"]),
                    "year": int(row["year"]),
                    "synopsis": row["overview"],
                    "score": float(row["score"]),
                    "poster_path": row["poster_path"],
                },
            )
        )

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
    )

    index_path = PROJECT_ROOT / FAISS_INDEX_PATH
    index_path.parent.mkdir(parents=True, exist_ok=True)

    vector_db = FAISS.from_documents(docs, embeddings)
    vector_db.save_local(str(index_path))
    print(f"Saved FAISS index with {len(docs)} movies to {index_path}")


if __name__ == "__main__":
    build_index()
