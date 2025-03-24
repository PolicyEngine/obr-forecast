from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import copy
import traceback
import json

from api.utils.forecast import get_dataframe, GROWFACTORS, FORECAST_YEARS, START_YEAR, start_computation, get_computation_status
from api.utils.cache import cached

router = APIRouter(
    tags=["forecasts"],
)

class GrowthRates(BaseModel):
    earned_income: Dict[int, float] = Field(..., description="Growth rates for earned income by year")
    mixed_income: Dict[int, float] = Field(..., description="Growth rates for mixed income by year")
    capital_income: Dict[int, float] = Field(..., description="Growth rates for capital income by year")
    inflation: Dict[int, float] = Field(..., description="Inflation rates by year")

class ForecastRequest(BaseModel):
    forecast_id: str
    growth_rates: Optional[GrowthRates] = None

class DecileImpact(BaseModel):
    decile: int
    value: float

class YearlyMetric(BaseModel):
    year: int
    value: float

class DecileYearlyChange(BaseModel):
    decile: int
    year: int
    change: float

class ForecastResponse(BaseModel):
    median_income_by_year: List[YearlyMetric]
    poverty_rate_by_year: List[YearlyMetric]
    decile_yearly_changes: List[DecileYearlyChange]
    metadata: Dict[str, Any]

@router.get("/api/forecasts")
@cached(ttl_seconds=3600)  # Cache for 1 hour
async def get_available_forecasts():
    """Get list of available OBR forecasts"""
    return {
        "forecasts": [
            {"id": "spring_2025", "name": "Autumn 2024", "date": "2024-10-30"}
        ],
        "forecast_years": FORECAST_YEARS,
        "default_growth_rates": GROWFACTORS,
    }

class ComputationStatusResponse(BaseModel):
    computation_id: str
    status: str
    result: Optional[ForecastResponse] = None
    error: Optional[str] = None

@router.post("/api/forecasts/impact", response_model=ComputationStatusResponse)
# Don't use caching for status checks, only cache completed results
async def calculate_forecast_impact(request: ForecastRequest):
    """Start or check the status of a forecast impact calculation"""
    try:
        # Check if computation_id was provided (for checking status)
        computation_id = request.forecast_id
        if "computation_id:" in computation_id:
            # Extract actual computation ID
            actual_computation_id = computation_id.split("computation_id:")[1]
            # Get the computation status
            computation = get_computation_status(actual_computation_id)
            
            if not computation:
                raise HTTPException(status_code=404, detail="Computation not found")
            
            if computation["status"] == "completed":
                # Return the completed result with metadata
                result = computation["result"]
                result["metadata"] = {
                    "forecast_id": request.forecast_id,
                    "growth_rates": request.growth_rates.model_dump() if request.growth_rates else GROWFACTORS
                }
                return {
                    "computation_id": actual_computation_id,
                    "status": "completed",
                    "result": result
                }
            elif computation["status"] == "failed":
                return {
                    "computation_id": actual_computation_id,
                    "status": "failed",
                    "error": computation.get("error", "Unknown error")
                }
            else:
                # Still computing
                return {
                    "computation_id": actual_computation_id,
                    "status": "computing"
                }
        
        # Start a new computation
        # Use default growth rates if none provided
        growth_rates = GROWFACTORS
        if request.growth_rates:
            growth_rates = {
                "earned_income": request.growth_rates.earned_income,
                "mixed_income": request.growth_rates.mixed_income,
                "capital_income": request.growth_rates.capital_income,
                "inflation": request.growth_rates.inflation,
            }
        
        # Start the computation in a background thread
        computation_id = start_computation(growth_rates)
        
        # Return the computation ID
        return {
            "computation_id": computation_id,
            "status": "computing"
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
