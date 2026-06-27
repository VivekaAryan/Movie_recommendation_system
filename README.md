# Movie Recommendation System

The Movie Recommendation System provides similar movie recommendations and Ollama-powered summaries. Enter a movie title, pick from autocomplete, and get a ranked top-10 list plus optional plot summaries.

## Overview

- **Movie Recommendations**: Hybrid ranking (semantic similarity + rating + popularity) over a local FAISS index.
- **Movie Summaries**: Generated via a local **Ollama** model.

## Architecture

- **Frontend**: Next.js (Pages Router) in `src/` — browser calls Next.js API routes (`/api/*`), which proxy to FastAPI.
- **Backend**: FastAPI in `backend/` — FAISS + sentence-transformers for recommendations; Ollama for summaries.

## Setup

### 1. Install dependencies

```bash
make setup
```

This creates the Python virtualenv, installs Python packages, and runs `npm install`.

### 2. Install Ollama and pull a model

Install [Ollama](https://ollama.com/), then pull a model that matches your `.env`:

```bash
ollama list
ollama pull llama3.2
```

### 3. Configuration

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2:1b-instruct-q4_K_M` | Model name from `ollama list` |
| `SKIP_SUMMARY` | `false` | Set `true` to disable summaries |
| `FAISS_INDEX_PATH` | `data/faiss_index` | Vector index |
| `BACKEND_URL` | `http://127.0.0.1:8000` | Next.js BFF proxy target |

### 4. Build FAISS index (required for recommendations)

```bash
make index
```

## Running locally

**One command (recommended):**

```bash
npm run dev
# or: make dev
```

This will:
1. Start Ollama if it is not already running
2. Start the FastAPI backend on http://127.0.0.1:8000
3. Start the Next.js frontend on http://localhost:3000

Open http://localhost:3000

Health check: http://127.0.0.1:8000/health — expect `"llm": true` and `"faiss": true`.

## Testing

```bash
source .venv/bin/activate
pytest -v
pytest -m integration
npm run test:frontend
```

## Usage

1. Open http://localhost:3000
2. Type a movie title and select from the dropdown
3. Click **Get Recommendations**
4. Hover a card and click **Generate Summary**

## API Endpoints (FastAPI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | `{ faiss, llm, movies }` status |
| `/api/movies` | GET | Movie list for autocomplete |
| `/recommendations` | POST | `{ "id": 272 }` or `{ "title": "Batman Begins" }` |
| `/summary` | POST | Generate plot summary via Ollama |

## Eval harness

```bash
python backend/eval_recommendations.py
```

## License

MIT License
