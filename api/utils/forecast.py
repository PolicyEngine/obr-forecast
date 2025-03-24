from policyengine import Simulation
from policyengine_core.taxbenefitsystems.tax_benefit_system import *
from policyengine_core.reforms import Reform
from policyengine_uk.system import system
import json
import pandas as pd
import numpy as np
from microdf import MicroDataFrame

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

    simulation = Simulation(
        country="uk",
        scope="macro",
        reform=reform,
    ).reform_simulation

    
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

