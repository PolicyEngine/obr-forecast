FROM python:3.10-slim

WORKDIR /app

# Copy requirements files
COPY requirements.txt ./
COPY api/requirements.txt ./api-requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt -r api-requirements.txt

# Install Node.js and npm for frontend build
RUN apt-get update && apt-get install -y \
    curl \
    nodejs \
    npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy frontend code
COPY frontend/ ./frontend/

# Build frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build
RUN mkdir -p /app/static && cp -r out/* /app/static/

# Copy API code
WORKDIR /app
COPY api/ ./api/
COPY pyproject.toml setup.py ./

# Setup environment variables
ENV PYTHONPATH=/app
ENV STATIC_FILES_DIR=/app/static

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]