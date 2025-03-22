from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="OBR Forecast Impact Estimator",
    description="API for estimating impacts of different OBR forecasts using PolicyEngine",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "OBR Forecast Impact Estimator API"}

# Import and include routers from endpoints
from api.endpoints import forecasts

app.include_router(forecasts.router)
