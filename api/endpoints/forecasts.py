from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import copy

from api.utils.forecast import get_dataframe, GROWFACTORS, FORECAST_YEARS, START_YEAR

router = APIRouter(
    prefix="/forecasts",
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

class ForecastResponse(BaseModel):
    median_income_by_year: List[YearlyMetric]
    poverty_rate_by_year: List[YearlyMetric]
    metadata: Dict[str, Any]

@router.get("/")
async def get_available_forecasts():
    """Get list of available OBR forecasts"""
    return {
        "forecasts": [
            {"id": "spring_2025", "name": "Spring 2025", "date": "2025-03-27"}
        ],
        "forecast_years": FORECAST_YEARS,
        "default_growth_rates": GROWFACTORS,
    }

@router.post("/impact", response_model=ForecastResponse)
async def calculate_forecast_impact(request: ForecastRequest):
    """Calculate the impact of a specific forecast with growth rate parameters"""
    try:
        # Use default growth rates if none provided
        growth_rates = GROWFACTORS
        if request.growth_rates:
            growth_rates = {
                "earned_income": request.growth_rates.earned_income,
                "mixed_income": request.growth_rates.mixed_income,
                "capital_income": request.growth_rates.capital_income,
                "inflation": request.growth_rates.inflation,
            }
        
        # Get the dataframe with simulation results
        df = get_dataframe(growth_rates, subsample=10_000)  # Using smaller subsample for faster API responses
        
        # Calculate median income by year
        median_income_by_year = []
        poverty_rate_by_year = []
        
        # Include 2025 as baseline
        for year in range(2025, START_YEAR + len(FORECAST_YEARS)):
            # Calculate median income
            year_df = df[df.year == year]
            median_income = year_df.household_net_income.median()
            
            median_income_by_year.append({
                "year": int(year),
                "value": float(median_income)
            })
            
            # Calculate poverty rate
            in_poverty_count = year_df[year_df.in_poverty].household_weight.values.sum()
            total_count = year_df.household_weight.values.sum()
            poverty_rate = float(in_poverty_count / total_count)
            
            poverty_rate_by_year.append({
                "year": int(year),
                "value": poverty_rate
            })
        
        return {
            "median_income_by_year": median_income_by_year,
            "poverty_rate_by_year": poverty_rate_by_year,
            "metadata": {
                "forecast_id": request.forecast_id,
                "growth_rates": growth_rates
            }
        }
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
