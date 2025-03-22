from policyengine import Simulation
import pandas as pd
import numpy as np
from microdf import MicroDataFrame

START_YEAR = 2026
COUNT_YEARS = 5
FORECAST_YEARS = list(range(START_YEAR, START_YEAR + COUNT_YEARS))

GROWFACTORS = {
    "earned_income": {
        2026: 0.02,
        2027: 0.02,
        2028: 0.02,
        2029: 0.02,
        2030: 0.02,
    },
    "mixed_income": {
        2026: 0.02,
        2027: 0.02,
        2028: 0.02,
        2029: 0.02,
        2030: 0.02,
    },
    "capital_income": {
        2026: 0.02,
        2027: 0.02,
        2028: 0.02,
        2029: 0.02,
        2030: 0.02,
    },
    "inflation": {
        2026: 0.02,
        2027: 0.02,
        2028: 0.02,
        2029: 0.02,
        2030: 0.02,
    },
}


def get_cumulative_growth(base_year: int, target_year: int, growth_rates: dict) -> float:
    cumulative_growth = 1
    for year in range(base_year + 1, target_year):
        cumulative_growth *= (1 + growth_rates[year])
    return cumulative_growth

def get_dataframe(
    growfactors: dict,
    subsample: int | None = 10_000,
) -> MicroDataFrame:
    simulation = Simulation(
        country="uk",
        scope="macro",
        subsample=subsample,
    ).baseline_simulation

    for year in FORECAST_YEARS:
        # Update household data

        simulation.set_input(
            "employment_income",
            year,
            simulation.calculate("employment_income", START_YEAR) * get_cumulative_growth(START_YEAR, year, growfactors["earned_income"]),
        )
        simulation.set_input(
            "self_employment_income",
            year,
            simulation.calculate("self_employment_income", START_YEAR) * get_cumulative_growth(START_YEAR, year, growfactors["mixed_income"]),
        )
        simulation.set_input(
            "dividend_income",
            year,
            simulation.calculate("dividend_income", START_YEAR) * get_cumulative_growth(START_YEAR, year, growfactors["capital_income"]),
        )
        simulation.set_input(
            "consumption",
            year,
            simulation.calculate("consumption", START_YEAR) * get_cumulative_growth(START_YEAR, year, growfactors["inflation"]),
        )

        # Update government policy parameters
        cpi_parameter = simulation.tax_benefit_system.parameters.gov.obr.consumer_price_index
        cpi_parameter.update(
            period=f"year:{year}:1",
            value=cpi_parameter(2025) * get_cumulative_growth(2025, year, growfactors["inflation"]),
        )

    
    df = pd.DataFrame()
    for year in range(2025, START_YEAR + COUNT_YEARS):
        year_df = simulation.calculate_dataframe([
            "household_id",
            "household_weight",
            "household_count_people",
            "household_income_decile",
            "household_net_income",
            "in_poverty",
        ], period=year).reset_index()
        year_df["year"] = year
        df = pd.concat([
            df,
            year_df,
        ])
    
    return MicroDataFrame(df, weights="household_weight")

