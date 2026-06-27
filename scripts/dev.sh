#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OLLAMA_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"
OLLAMA_TAGS_URL="${OLLAMA_URL}/api/tags"

if [[ ! -d ".venv" ]]; then
  echo "Python virtualenv not found. Run: make setup"
  exit 1
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama CLI not found. Install from https://ollama.com/"
  exit 1
fi

ollama_ready() {
  curl -sf "$OLLAMA_TAGS_URL" >/dev/null 2>&1
}

if ! ollama_ready; then
  echo "Ollama not reachable at $OLLAMA_URL — starting ollama serve..."
  ollama serve >/dev/null 2>&1 &
  for _ in $(seq 1 30); do
    if ollama_ready; then
      echo "Ollama is ready."
      break
    fi
    sleep 1
  done
  if ! ollama_ready; then
    echo "Ollama did not become ready within 30s. Check Ollama installation."
    exit 1
  fi
else
  echo "Ollama is already running."
fi

echo "Starting backend (FastAPI) and frontend (Next.js)..."
exec npx concurrently -k \
  -n backend,frontend \
  -c blue,green \
  ".venv/bin/uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000" \
  "next dev"
