FROM node:22.2.0
COPY . /app
WORKDIR /app

# Build frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build
RUN mkdir -p /app/static && cp -r out/* /app/static/

# Install backend
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN uv venv --python 3.11
ENV PATH="/app/.venv/bin:$PATH"
RUN uv pip install -r /app/api/requirements.txt


# Setup environment variables
ENV PYTHONPATH=/app
ENV STATIC_FILES_DIR=/app/static

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uv", "run", "uvicorn", "api.main:app", "--host", "127.0.0.1", "--port", "8000"]