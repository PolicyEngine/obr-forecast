import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path


def setup_static_files(app: FastAPI):
    """Configure the FastAPI app to serve static files from the frontend build"""
    
    # Define path to the static files
    static_dir = os.environ.get("STATIC_FILES_DIR", "../static")
    static_path = Path(static_dir)
    
    # Check if the static directory exists 
    if static_path.exists() and static_path.is_dir():
        # Mount static files
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    
    @app.get("/favicon.svg")
    async def favicon():
        """Serve favicon"""
        favicon_path = Path(static_dir) / "favicon.svg"
        if favicon_path.exists():
            return FileResponse(favicon_path)
        return None

    @app.get("/{rest_of_path:path}")
    async def serve_spa(rest_of_path: str):
        """Serve SPA for any unmatched routes - support client-side routing"""
        # This is a catch-all to return index.html for SPA client-side routing
        index_path = Path(static_dir) / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return {"message": "Static files not found. This endpoint is for development only."}