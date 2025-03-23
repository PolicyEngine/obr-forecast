.PHONY: setup venv install dev server frontend build-frontend deploy-frontend build-frontend-prod deploy-frontend-prod deploy-api deploy-api-prod

# Ensure Python 3.11 is required
setup:
	@python3 -c 'import sys; assert sys.version_info[:2] == (3, 11), "Python 3.11 is required"' || (echo "Error: Python 3.11 is required" && exit 1)
	pip install uv

# Create virtual environment using uv
venv:
	uv venv -p python3.11

# Install dependencies
install: venv
	uv pip install -e .
	cd frontend && npm install

dev: server frontend

server:
	source .venv/bin/activate && uvicorn api.main:app --reload --timeout-keep-alive 0

frontend:
	cd frontend && npm run dev

build-frontend:
	cd frontend && npm run build

deploy-frontend:
	vercel

build-frontend-prod:
	cd frontend && npm run build

deploy-frontend-prod:
	vercel --prod
	
deploy-api:
	cd api && vercel

deploy-api-prod:
	cd api && vercel --prod