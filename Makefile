.PHONY: setup index dev test test-integration test-frontend

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
PYTEST := $(VENV)/bin/pytest

setup:
	python3.13 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements-dev.txt
	npm install

index:
	$(PYTHON) backend/build_faiss_index.py

dev:
	npm run dev

test:
	$(PYTEST)
	npm run test:frontend

test-integration:
	$(PYTEST) -m integration

test-frontend:
	npm run test:frontend
