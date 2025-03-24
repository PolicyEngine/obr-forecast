from policyengine import Simulation
from policyengine_core.taxbenefitsystems.tax_benefit_system import *
from policyengine_core.reforms import Reform
from policyengine_uk.system import system
import json
import pandas as pd
import numpy as np
from microdf import MicroDataFrame
import threading
import uuid
import hashlib
import time
from typing import Dict, Any, Optional
from api.utils.cache import cache_store

START_YEAR = 2026
COUNT_YEARS = 5
FORECAST_YEARS = list(range(START_YEAR, START_YEAR + COUNT_YEARS))

obr = system.parameters.gov.obr

GROWFACTORS = {
    "earned_income": {
    },
    "mixed_income": {
    },
    "capital_income": {
    },
    "inflation": {
    },
}

for year in FORECAST_YEARS:
    GROWFACTORS["earned_income"][year] = round(obr.employment_income(year) / obr.employment_income(year - 1), 3) - 1
    GROWFACTORS["mixed_income"][year] = round(obr.mixed_income(year) / obr.mixed_income(year - 1), 3) - 1
    GROWFACTORS["capital_income"][year] = round(obr.non_labour_income(year) / obr.non_labour_income(year - 1), 3) - 1
    GROWFACTORS["inflation"][year] = round(obr.consumer_price_index(year) / obr.consumer_price_index(year - 1), 3) - 1


def get_cumulative_growth(base_year: int, target_year: int, growth_rates: dict) -> float:
    cumulative_growth = 1
    for year in range(base_year + 1, target_year + 1):
        cumulative_growth *= (1 + growth_rates[year])
    return cumulative_growth

# Store for running computations
computation_store: Dict[str, Dict[str, Any]] = {} 

def get_computation_status(computation_id: str) -> Optional[Dict[str, Any]]:
    """Get the status of a running computation"""
    return computation_store.get(computation_id)

def get_dataframe(
    growfactors: dict,
) -> MicroDataFrame:
    
    reform = {}
    obr = system.parameters.gov.obr
    employment_income_index = obr.employment_income(START_YEAR - 1)
    reform["gov.obr.employment_income"] = {}
    mixed_income_index = obr.mixed_income(START_YEAR - 1)
    reform["gov.obr.mixed_income"] = {}

    non_labour_income = obr.non_labour_income(START_YEAR - 1)
    reform["gov.obr.non_labour_income"] = {}
    inflation_index = obr.consumer_price_index(START_YEAR - 1)
    reform["gov.obr.consumer_price_index"] = {}
    legacy_reform = json.loads(json.dumps(reform))
    for year in FORECAST_YEARS:
        time_period = f"{year}-01-01.{year}-12-31"
        legacy_time_period = f"year:{year}:1"
        employment_income_index *= 1 + growfactors["earned_income"][year]
        reform["gov.obr.employment_income"][time_period] = float(employment_income_index)
        legacy_reform["gov.obr.employment_income"][legacy_time_period] = float(employment_income_index)

        mixed_income_index *= 1 + growfactors["mixed_income"][year]
        reform["gov.obr.mixed_income"][time_period] = float(mixed_income_index)
        legacy_reform["gov.obr.mixed_income"][legacy_time_period] = float(mixed_income_index)

        non_labour_income *= 1 + growfactors["capital_income"][year]
        reform["gov.obr.non_labour_income"][time_period] = float(non_labour_income)
        legacy_reform["gov.obr.non_labour_income"][legacy_time_period] = float(non_labour_income)

        inflation_index *= 1 + growfactors["inflation"][year]
        reform["gov.obr.consumer_price_index"][time_period] = float(inflation_index)
        legacy_reform["gov.obr.consumer_price_index"][legacy_time_period] = float(inflation_index)

    api_id = Reform.from_dict(legacy_reform, country_id="uk").api_id

    link = f"https://policyengine.org/uk/policy?reform={api_id}"

    print(link)

    print("Creating simulation")

    simulation = Simulation(
        country="uk",
        scope="macro",
        baseline=reform,
    ).baseline_simulation

    print("Created simulation")

    
    df = pd.DataFrame()
    for year in range(2025, START_YEAR + COUNT_YEARS):
        print("Calculating year", year)
        year_df = simulation.calculate_dataframe([
            "household_id",
            "household_weight",
            "household_count_people",
            "household_income_decile",
            "household_net_income",
            "real_household_net_income",
            "employment_income",
            "self_employment_income",
            "dividend_income",
            "consumption",
            "in_poverty_ahc",
            "in_poverty_bhc",
            "equiv_hbai_household_net_income_ahc",
            "equiv_hbai_household_net_income",
        ], period=year).reset_index()
        year_df["year"] = year
        df = pd.concat([
            df,
            year_df,
        ])
    
    return MicroDataFrame(df, weights="household_weight")

def get_cache_key_for_computation(growth_rates):
    """Generate a cache key for the computation based on growth rates"""
    # Convert growth rates to a stable string format for hashing
    growth_rates_str = json.dumps(growth_rates, sort_keys=True)
    key = f"forecast_impact:{growth_rates_str}"
    return hashlib.md5(key.encode()).hexdigest()

def start_computation(growth_rates):
    """Start a computation in a background thread and return a computation ID"""
    # Check if we already have a cached result
    cache_key = get_cache_key_for_computation(growth_rates)
    if cache_key in cache_store:
        entry = cache_store[cache_key]
        # Check if it's not expired
        if entry["expires"] > time.time():
            # Create a computation ID for this cached result
            computation_id = str(uuid.uuid4())
            computation_store[computation_id] = {
                "status": "completed",
                "result": entry["data"],
                "cached": True
            }
            return computation_id
    
    # Create a new computation ID
    computation_id = str(uuid.uuid4())
    
    def run_computation():
        try:
            # Get the dataframe with simulation results
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
                
                # Calculate absolute poverty rates (BHC and AHC)
                total_count = year_df.household_count_people.sum()
                
                # Absolute poverty AHC
                in_poverty_ahc_count = year_df[year_df.in_poverty_ahc].household_count_people.sum()
                poverty_rate_ahc = float(in_poverty_ahc_count / total_count)
                
                # Absolute poverty BHC 
                in_poverty_bhc_count = year_df[year_df.in_poverty_bhc].household_count_people.sum()
                poverty_rate_bhc = float(in_poverty_bhc_count / total_count)
                
                # Calculate relative poverty rates
                # Relative poverty AHC (60% of median)
                median_ahc = year_df.equiv_hbai_household_net_income_ahc.median()
                poverty_threshold_ahc = median_ahc * 0.6
                rel_poverty_ahc_count = year_df[year_df.equiv_hbai_household_net_income_ahc < poverty_threshold_ahc].household_count_people.sum()
                rel_poverty_rate_ahc = float(rel_poverty_ahc_count / total_count)
                
                # Relative poverty BHC (60% of median)
                median_bhc = year_df.equiv_hbai_household_net_income.median()
                poverty_threshold_bhc = median_bhc * 0.6
                rel_poverty_bhc_count = year_df[year_df.equiv_hbai_household_net_income < poverty_threshold_bhc].household_count_people.sum()
                rel_poverty_rate_bhc = float(rel_poverty_bhc_count / total_count)
                
                poverty_rate_by_year.append({
                    "year": int(year),
                    "absolute_ahc": poverty_rate_ahc,
                    "absolute_bhc": poverty_rate_bhc,
                    "relative_ahc": rel_poverty_rate_ahc,
                    "relative_bhc": rel_poverty_rate_bhc
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
            
            # Transform poverty_rate_by_year into separate metrics for API compatibility
            absolute_poverty_ahc_by_year = []
            absolute_poverty_bhc_by_year = []
            relative_poverty_ahc_by_year = []
            relative_poverty_bhc_by_year = []
            
            for entry in poverty_rate_by_year:
                year = entry["year"]
                
                absolute_poverty_ahc_by_year.append({
                    "year": year,
                    "value": entry["absolute_ahc"]
                })
                
                absolute_poverty_bhc_by_year.append({
                    "year": year,
                    "value": entry["absolute_bhc"]
                })
                
                relative_poverty_ahc_by_year.append({
                    "year": year,
                    "value": entry["relative_ahc"]
                })
                
                relative_poverty_bhc_by_year.append({
                    "year": year,
                    "value": entry["relative_bhc"]
                })
            
            result = {
                "median_income_by_year": median_income_by_year,
                "absolute_poverty_ahc_by_year": absolute_poverty_ahc_by_year,
                "absolute_poverty_bhc_by_year": absolute_poverty_bhc_by_year,
                "relative_poverty_ahc_by_year": relative_poverty_ahc_by_year,
                "relative_poverty_bhc_by_year": relative_poverty_bhc_by_year,
                "decile_yearly_changes": decile_yearly_changes,
            }
            
            # Store the completed result in the computation store
            computation_store[computation_id] = {
                "status": "completed",
                "result": result,
                "cached": False
            }
            
            # Also store in the cache for future requests (30 minute TTL)
            cache_store[cache_key] = {
                "data": result,
                "expires": time.time() + 1800  # 30 minutes cache
            }
            
        except Exception as e:
            # Store the error
            computation_store[computation_id] = {
                "status": "failed",
                "error": str(e),
                "cached": False
            }
    
    # Store the initial status
    computation_store[computation_id] = {
        "status": "computing",
        "result": None,
        "cached": False
    }
    
    # Start the computation in a background thread
    thread = threading.Thread(target=run_computation)
    thread.daemon = True  # Daemonize thread to avoid blocking the exit
    thread.start()
    
    return computation_id

