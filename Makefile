.PHONY: dev api frontend install build

# Development commands
dev: api frontend

api:
	cd api && uvicorn main:app --reload --port 8000

frontend:
	cd frontend && NEXT_PUBLIC_NEXT_DEV=true npm run dev

# Installation commands
install: install-api install-frontend

install-api:
	pip install -r requirements.txt -r api/requirements.txt

install-frontend:
	cd frontend && npm install

# Build commands
build:
	cd frontend && npm run build
	mkdir -p static
	cp -r frontend/out/* static/

# Docker commands
docker-build:
	docker build -t obr-forecast .

docker-run:
	docker run -p 8000:8000 obr-forecast