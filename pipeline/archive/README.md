# Archived pipeline notebooks

These notebooks are **historical research artifacts** from an earlier version of this project. They are not part of the current runtime stack.

## Current stack

The live app uses:

- **FAISS** + sentence-transformers for recommendations (`backend/recommender.py`)
- **Ollama** for plot summaries (`backend/summarizer.py`)
- **FastAPI** backend + **Next.js** frontend

## Why these notebooks are archived

- They target **Weaviate**, **LangChain + Weaviate**, and **LLM quantization** workflows that were replaced by the FAISS + Ollama setup.
- Several notebooks import deleted modules under `utils/` (e.g. `utils.constants`, `utils.llm_quantization_utils`) and **will not run** without restoration.
- Notebook filenames use spaces and mixed casing; they are kept as-is for reference only.

## Data paths

If you adapt a notebook, point CSV reads at the project metadata file:

```
../../data/final_metadata.csv
```

(relative to this `pipeline/archive/` directory)
