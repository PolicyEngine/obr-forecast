"""Tests for the forecast simulation in api/utils/forecast.py."""

import importlib
import socket
import sys
import types

import pandas as pd
import pytest


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
    # simulation, so they give the module a stand-in policyengine package.
    stand_in_policyengine = types.ModuleType("policyengine")
    stand_in_policyengine.Simulation = StandInSimulation
    monkeypatch.setitem(sys.modules, "policyengine", stand_in_policyengine)
    monkeypatch.delitem(sys.modules, "api.utils.forecast", raising=False)
    StandInSimulation.created_with = []
    return importlib.import_module("api.utils.forecast")


@pytest.fixture
def network_blocked(monkeypatch):
    def refuse_network_access(*arguments, **keyword_arguments):
        raise NetworkAccessAttempted(f"network access to {arguments[:2]}")

    monkeypatch.setattr(socket, "getaddrinfo", refuse_network_access)
    monkeypatch.setattr(socket.socket, "connect", refuse_network_access)


def test_forecast_runs_without_contacting_the_public_api(
    forecast_module, network_blocked
):
    forecast_module.get_dataframe(forecast_module.GROWFACTORS)

    (simulation_options,) = StandInSimulation.created_with
    assert simulation_options["country"] == "uk"
    assert set(simulation_options["baseline"]) == {
        "gov.obr.employment_income",
        "gov.obr.mixed_income",
        "gov.obr.non_labour_income",
        "gov.obr.consumer_price_index",
    }
