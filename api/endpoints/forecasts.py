from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

router = APIRouter(
    prefix="/forecasts",
    tags=["forecasts"],
)

class ForecastRequest(BaseModel):
    forecast_id: str
    parameters: Optional[Dict[str, Any]] = None

class ForecastResponse(BaseModel):
    impact: Dict[str, Any]
    metadata: Dict[str, Any]

@router.get("/")
async def get_available_forecasts():
    """Get list of available OBR forecasts"""
    # This will be expanded with actual forecast data
    return {
        "forecasts": [
            {"id": "spring_2025", "name": "Spring 2025", "date": "2025-03-27"}
        ]
    }

@router.post("/impact", response_model=ForecastResponse)
async def calculate_forecast_impact(request: ForecastRequest):
    """Calculate the impact of a specific forecast with optional parameters"""
    try:
        # This will be implemented with PolicyEngine calculations
        # For now, return placeholder data
        return {
            "impact": {
                "overall": {"value": 0.0, "unit": "£bn"},
                "by_decile": [{"decile": i, "value": 0.0} for i in range(1, 11)]
            },
            "metadata": {
                "forecast_id": request.forecast_id,
                "parameters": request.parameters or {}
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
