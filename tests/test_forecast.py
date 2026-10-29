"""Tests for the forecast simulation in api/utils/forecast.py."""

import importlib.util
import socket
import sys
import types
from pathlib import Path

import pandas as pd
import pytest

FORECAST_MODULE_PATH = (
    Path(__file__).resolve().parents[1] / "api" / "utils" / "forecast.py"
)

GROWTH_RATE_NAME_BY_OBR_PARAMETER = {
    "employment_income": "earned_income",
    "mixed_income": "mixed_income",
    "non_labour_income": "capital_income",
    "consumer_price_index": "inflation",
}


class NetworkAccessAttempted(Exception):
    pass


class StandInMicrosimulation:
    def calculate_dataframe(self, variables, period):
        return pd.DataFrame({variable: [1.0] for variable in variables})


class StandInSimulation:
    """Records how the forecast builds its simulation instead of running one."""

    created_with = []

    def __init__(self, **simulation_options):
        StandInSimulation.created_with.append(simulation_options)
        self.baseline_simulation = StandInMicrosimulation()


@pytest.fixture
def forecast_module(monkeypatch):
    # The forecast runs a full UK microsimulation through the policyengine
    # package, which also loads the US model. These tests replace that
    # simulation, so the module gets a stand-in policyengine package while
    # it loads. It is loaded under its own name, so the copy bound to the
    # stand-in never replaces api.utils.forecast for other code.
    stand_in_policyengine = types.ModuleType("policyengine")
    stand_in_policyengine.Simulation = StandInSimulation
    monkeypatch.setitem(sys.modules, "policyengine", stand_in_policyengine)
    StandInSimulation.created_with = []
    specification = importlib.util.spec_from_file_location(
        "forecast_with_stand_in_simulation", FORECAST_MODULE_PATH
    )
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


@pytest.fixture
def network_blocked(monkeypatch):
    def refuse_network_access(*arguments, **keyword_arguments):
        raise NetworkAccessAttempted(f"network access to {arguments[:2]}")

    monkeypatch.setattr(socket, "getaddrinfo", refuse_network_access)
    monkeypatch.setattr(socket.socket, "connect", refuse_network_access)


def expected_growth_reform(forecast_module, growth_rates):
    obr_parameters = forecast_module.system.parameters.gov.obr
    reform = {}
    for parameter_name, growth_rate_name in GROWTH_RATE_NAME_BY_OBR_PARAMETER.items():
        index = obr_parameters.get_child(parameter_name)(forecast_module.START_YEAR - 1)
        values_by_period = {}
        for year in forecast_module.FORECAST_YEARS:
            index *= 1 + growth_rates[growth_rate_name][year]
            values_by_period[f"{year}-01-01.{year}-12-31"] = pytest.approx(
                float(index)
            )
        reform[f"gov.obr.{parameter_name}"] = values_by_period
    return reform


def test_forecast_simulates_the_growth_reform_without_contacting_the_public_api(
    forecast_module, network_blocked
):
    growth_rates = forecast_module.GROWFACTORS

    forecast_module.get_dataframe(growth_rates)

    (simulation_options,) = StandInSimulation.created_with
    assert simulation_options["country"] == "uk"
    assert simulation_options["scope"] == "macro"
    assert simulation_options["baseline"] == expected_growth_reform(
        forecast_module, growth_rates
    )
