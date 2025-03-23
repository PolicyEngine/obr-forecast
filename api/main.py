import os
import datetime
import logging
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OBR Forecast Impact Estimator",
    description="API for estimating impacts of different OBR forecasts using PolicyEngine",
    version="0.1.0",
    # Remove default docs to avoid conflicts with static file serving
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Get allowed origins from environment variable or use default for development
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,http://localhost:8000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.get("/api")
async def root():
    return {"message": "OBR Forecast Impact Estimator API"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "api_version": "0.1.0",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Middleware to log request processing time and cache status"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log the request
    logger.info(
        f"Request: {request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s - "
        f"Cache: {response.headers.get('X-Cache-Hit', 'miss')}"
    )
    
    return response

@app.get("/api/cache/clear")
async def clear_cache():
    """Admin endpoint to clear the API cache"""
    from api.utils.cache import clear_cache
    clear_cache()
    return {"status": "success", "message": "Cache cleared"}

@app.get("/api/cache/stats")
async def cache_stats():
    """Get cache statistics"""
    from api.utils.cache import get_cache_stats, remove_expired_cache_entries
    # Clean up expired entries before returning stats
    remove_expired_cache_entries()
    return get_cache_stats()

# Import and include routers from endpoints
from api.endpoints import forecasts

app.include_router(forecasts.router)

# Import and handle static file routes
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Setup API routes first
# Then setup static file serving (must be done after API routes)
static_dir = os.environ.get("STATIC_FILES_DIR", "../static")
static_path = Path(static_dir)

# Only serve static files if the directory exists
if static_path.exists() and static_path.is_dir():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    # For development, still implement the catch-all for SPA
    from fastapi.responses import FileResponse
    
    @app.get("/{path:path}")
    async def catch_all(path: str):
        # Skip API routes
        if path.startswith("api/"):
            return {"message": f"Route {path} not found"}
        
        # For non-API routes, try to serve from static dir if it exists
        index_path = Path(static_dir) / "index.html"
        if static_path.exists() and static_path.is_dir() and index_path.exists():
            return FileResponse(index_path)
        
        # If static dir doesn't exist, return a message
        return {"message": "Frontend not built yet. This endpoint is for development only."}
