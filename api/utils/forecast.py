from policyengine import Simulation
from policyengine_core.taxbenefitsystems.tax_benefit_system import *
from policyengine_uk.system import backdate_parameters, convert_to_fiscal_year_parameters
import pandas as pd
import numpy as np
from microdf import MicroDataFrame

START_YEAR = 2026
COUNT_YEARS = 3
FORECAST_YEARS = list(range(START_YEAR, START_YEAR + COUNT_YEARS))

GROWFACTORS = {
    "earned_income": {
        2026: 0.021,
        2027: 0.020,
        2028: 0.024,
        2029: 0.026,
        2030: 0.026,
    },
    "mixed_income": {
        2026: 0.037,
        2027: 0.036,
        2028: 0.041,
        2029: 0.044,
        2030: 0.044,
    },
    "capital_income": {
        2026: 0.041,
        2027: 0.036,
        2028: 0.031,
        2029: 0.028,
        2030: 0.028,
    },
    "inflation": {
        2026: 0.022,
        2027: 0.021,
        2028: 0.021,
        2029: 0.020,
        2030: 0.020,
    },
}


def get_cumulative_growth(base_year: int, target_year: int, growth_rates: dict) -> float:
    cumulative_growth = 1
    for year in range(base_year + 1, target_year + 1):
        cumulative_growth *= (1 + growth_rates[year])
    return cumulative_growth

def get_dataframe(
    growfactors: dict,
    subsample: int | None = None,
) -> MicroDataFrame:
    simulation = Simulation(
        country="uk",
        scope="macro",
        subsample=subsample,
    ).baseline_simulation

    simulation.tax_benefit_system.load_parameters(simulation.tax_benefit_system.parameters_dir)

    for year in FORECAST_YEARS:
        # Update government policy parameters
        cpi_parameter = simulation.tax_benefit_system.parameters.gov.obr.consumer_price_index
        cpi_parameter.update(
            period=f"year:{year}:1",
            value=cpi_parameter(2025) * get_cumulative_growth(2025, year, growfactors["inflation"]),
        )
    simulation.tax_benefit_system.parameters.add_child("baseline", simulation.tax_benefit_system.parameters.clone())
    simulation.tax_benefit_system.parameters = homogenize_parameter_structures(
        simulation.tax_benefit_system.parameters, simulation.tax_benefit_system.variables
    )
    simulation.tax_benefit_system.parameters = propagate_parameter_metadata(simulation.tax_benefit_system.parameters)
    simulation.tax_benefit_system.parameters = interpolate_parameters(simulation.tax_benefit_system.parameters)
    simulation.tax_benefit_system.parameters = uprate_parameters(simulation.tax_benefit_system.parameters)
    simulation.tax_benefit_system.parameters = propagate_parameter_metadata(simulation.tax_benefit_system.parameters)
    simulation.tax_benefit_system.add_abolition_parameters()
    simulation.tax_benefit_system.parameters = backdate_parameters(simulation.tax_benefit_system.parameters, "2015-01-01")
    simulation.tax_benefit_system.parameters.gov.hmrc = convert_to_fiscal_year_parameters(
        simulation.tax_benefit_system.parameters.gov.hmrc
    )
    simulation.tax_benefit_system.parameters.gov.dwp = convert_to_fiscal_year_parameters(
        simulation.tax_benefit_system.parameters.gov.dwp
    )

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

    
    df = pd.DataFrame()
    for year in range(2025, START_YEAR + COUNT_YEARS):
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
            "in_poverty",
        ], period=year).reset_index()
        year_df["year"] = year
        df = pd.concat([
            df,
            year_df,
        ])
    
    return MicroDataFrame(df, weights="household_weight")

