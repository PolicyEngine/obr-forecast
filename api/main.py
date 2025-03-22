import os
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="OBR Forecast Impact Estimator",
    description="API for estimating impacts of different OBR forecasts using PolicyEngine",
    version="0.1.0",
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

@app.get("/")
async def root():
    return {"message": "OBR Forecast Impact Estimator API"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "api_version": "0.1.0",
        "timestamp": datetime.datetime.now().isoformat()
    }

# Import and include routers from endpoints
from api.endpoints import forecasts

app.include_router(forecasts.router)
