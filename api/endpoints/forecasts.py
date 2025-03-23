from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import copy
import traceback

from api.utils.forecast import get_dataframe, GROWFACTORS, FORECAST_YEARS, START_YEAR

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
async def get_available_forecasts():
    """Get list of available OBR forecasts"""
    return {
        "forecasts": [
            {"id": "spring_2025", "name": "Autumn 2024", "date": "2024-10-30"}
        ],
        "forecast_years": FORECAST_YEARS,
        "default_growth_rates": GROWFACTORS,
    }

@router.post("/api/forecasts/impact", response_model=ForecastResponse)
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
        # Use a smaller subsample to improve API response time
        df = get_dataframe(growth_rates)
        
        # Calculate median income by year
        median_income_by_year = []
        poverty_rate_by_year = []
        decile_yearly_changes = []
        
        # Include 2025 as baseline
        for year in range(2025, START_YEAR + len(FORECAST_YEARS)):
            # Calculate median income
            year_df = df[df.year == year]
            median_income = year_df.real_household_net_income.median()
            
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
            
            
            # Calculate YoY percent changes if we have previous year data
            if year > 2025:
                year_df = df[df.year == year]
                last_year_df = df[df.year == year - 1]
                year_df["last_year_income_decile"] = last_year_df.household_income_decile.values
                for decile in range(1, 11):
                    previous_income = last_year_df[last_year_df.household_income_decile == decile].real_household_net_income.sum()
                    current_income = year_df[year_df.last_year_income_decile == decile].real_household_net_income.sum()
                    percent_change = (current_income - previous_income) / previous_income
                    
                    decile_yearly_changes.append({
                        "decile": decile,
                        "year": int(year),
                        "change": float(percent_change)
                    })
        
        return {
            "median_income_by_year": median_income_by_year,
            "poverty_rate_by_year": poverty_rate_by_year,
            "decile_yearly_changes": decile_yearly_changes,
            "metadata": {
                "forecast_id": request.forecast_id,
                "growth_rates": growth_rates
            }
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
