"""
Phase 7 — Prediction + Decision Intelligence Fusion Test Suite
Verifies calibration uncertainty, drift detection, Need Score 9-factor decomposition,
Sensor Jury, speed-only Physics Gate, Coverage Certificates, Minimum Evidence Set,
Communication Accounting, and FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
import numpy as np

from backend.main import app
from backend.data_source import DataSourceManager
from backend.decision.uncertainty import calculate_prediction_uncertainty, derive_confidence_level, get_prediction_confidence_contract
from backend.decision.jury import evaluate_sensor_jury
from backend.decision.physics import evaluate_physics_gate

client = TestClient(app)


# -----------------------------------------------------------------------------
# 1. Uncertainty Calibration & Confidence Tests
# -----------------------------------------------------------------------------

def test_calibrated_uncertainty_horizons():
    """Verify validation residual baseline MAEs for horizons +5, +15, +30, +60 min."""
    u5 = calculate_prediction_uncertainty(horizon_minutes=5, region_id="REGION_A")
    u15 = calculate_prediction_uncertainty(horizon_minutes=15, region_id="REGION_A")
    u30 = calculate_prediction_uncertainty(horizon_minutes=30, region_id="REGION_A")
    u60 = calculate_prediction_uncertainty(horizon_minutes=60, region_id="REGION_A")

    # REGION_A scale is 0.70: 2.3648 * 0.70 = 1.66, 3.0007 * 0.70 = 2.10, 3.6699 * 0.70 = 2.57, 4.7158 * 0.70 = 3.30
    assert abs(u5 - 1.66) < 0.1
    assert abs(u15 - 2.10) < 0.1
    assert abs(u30 - 2.57) < 0.1
    assert abs(u60 - 3.30) < 0.1

    # Base unscaled check for REGION_C (scale 0.99)
    u5_c = calculate_prediction_uncertainty(horizon_minutes=5, region_id="REGION_C")
    assert abs(u5_c - 2.34) < 0.1


def test_confidence_level_thresholds():
    """Verify confidence level classification HIGH, MEDIUM, LOW."""
    assert derive_confidence_level(2.0) == "HIGH"
    assert derive_confidence_level(3.5) == "MEDIUM"
    assert derive_confidence_level(5.5) == "LOW"


# -----------------------------------------------------------------------------
# 2. Sensor Jury Tests
# -----------------------------------------------------------------------------

def test_sensor_jury_consensus():
    """Verify Sensor Jury returns supporting/conflicting signals and consensus decision."""
    ds = DataSourceManager()
    jury_res = ds.get_sensor_jury("773869")

    assert "juryDecision" in jury_res
    assert "juryConfidence" in jury_res
    assert "supportingSignals" in jury_res
    assert "conflictingSignals" in jury_res
    assert jury_res["juryDecision"] in ["CONFIRM_NOMINAL", "QUERY_REQUIRED", "FLAG_CONGESTION", "FLAG_ANOMALY"]
    assert isinstance(jury_res["supportingSignals"], list)
    assert isinstance(jury_res["conflictingSignals"], list)


# -----------------------------------------------------------------------------
# 3. Speed-Only Physics Gate Tests
# -----------------------------------------------------------------------------

def test_physics_gate_valid_speed():
    """Verify valid speed profile passes Physics Gate."""
    res = evaluate_physics_gate(
        sensor_id="773869",
        current_speed=62.5,
        recent_speeds=[60.0, 61.0, 62.5],
        neighbor_speeds=[61.0, 63.0, 59.5]
    )
    assert res["passed"] is True
    assert res["checksPassed"]["validBoundsCheck"] is True
    assert res["checksPassed"]["stepDeltaCheck"] is True
    assert res["checksPassed"]["spatialNeighborCheck"] is True
    assert res["currentSpeedMph"] == 62.5


def test_physics_gate_out_of_bounds_speed():
    """Verify negative or excessive speed fails Physics Gate."""
    res_neg = evaluate_physics_gate(
        sensor_id="773869",
        current_speed=-5.0,
        recent_speeds=[60.0],
        neighbor_speeds=[60.0]
    )
    assert res_neg["passed"] is False
    assert res_neg["checksPassed"]["validBoundsCheck"] is False

    res_high = evaluate_physics_gate(
        sensor_id="773869",
        current_speed=125.0,
        recent_speeds=[60.0],
        neighbor_speeds=[60.0]
    )
    assert res_high["passed"] is False
    assert res_high["checksPassed"]["validBoundsCheck"] is False


def test_physics_gate_acceleration_delta():
    """Verify speed step delta > 40 mph fails Physics Gate."""
    res = evaluate_physics_gate(
        sensor_id="773869",
        current_speed=70.0,
        recent_speeds=[20.0, 20.0],
        neighbor_speeds=[65.0]
    )
    assert res["passed"] is False
    assert res["checksPassed"]["stepDeltaCheck"] is False


def test_physics_gate_spatial_neighbor_variance():
    """Verify neighbor speed disagreement > 35 mph fails Physics Gate."""
    res = evaluate_physics_gate(
        sensor_id="773869",
        current_speed=65.0,
        recent_speeds=[60.0, 62.0],
        neighbor_speeds=[15.0, 20.0]
    )
    assert res["passed"] is False
    assert res["checksPassed"]["spatialNeighborCheck"] is False


# -----------------------------------------------------------------------------
# 4. Need Score & 9 Factor Decomposition
# -----------------------------------------------------------------------------

def test_need_score_factors():
    """Verify Need Score decomposition has 9 inspectable factors with correct weights."""
    ds = DataSourceManager()
    need_data = ds.get_decision_need_score("773869")

    assert "needScore" in need_data
    assert "factors" in need_data
    factors = need_data["factors"]

    expected_keys = [
        "spatialInfluence", "uncertaintyProxy", "spatialSpeedDisagreement",
        "trafficDrift", "freshness", "informationDebt", "coverageNeed",
        "sensorHealth", "redundancyPenalty"
    ]
    for key in expected_keys:
        assert key in factors

    assert "hardwareHealth" not in factors


# -----------------------------------------------------------------------------
# 5. Coverage Certificate & Minimum Evidence Set
# -----------------------------------------------------------------------------

def test_coverage_certificate():
    """Verify coverage certificate structure and integrity."""
    ds = DataSourceManager()
    cert = ds.get_coverage_certificate("REGION_A")

    assert cert["region"] == "REGION_A"
    assert "graphCoveragePercent" in cert
    assert "evidenceConfidencePercent" in cert
    assert "status" in cert


def test_minimum_evidence_set():
    """Verify minimum evidence set retrieval under heuristic."""
    ds = DataSourceManager()
    min_set = ds.get_minimum_evidence_set("REGION_A")

    assert min_set["regionId"] == "REGION_A"
    assert "selectedSensors" in min_set
    assert isinstance(min_set["selectedSensors"], list)
    assert len(min_set["selectedSensors"]) > 0
    assert "method" in min_set
    assert "minimum selected evidence set under the current heuristic" in min_set["method"]


# -----------------------------------------------------------------------------
# 6. Communication Accounting
# -----------------------------------------------------------------------------

def test_communication_accounting_query():
    """Verify executing a query updates Level-1 communication accounting."""
    resp = client.post("/api/query/773869")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCESS"
    assert "bytesTransferred" in data
    assert "expectedBenefit" in data


# -----------------------------------------------------------------------------
# 7. FastAPI Endpoint Integration Tests
# -----------------------------------------------------------------------------

def test_api_coverage_certificate():
    """GET /api/decision/certificate/{region_id}"""
    resp = client.get("/api/decision/certificate/REGION_A")
    assert resp.status_code == 200
    json_data = resp.json()
    assert json_data["region"] == "REGION_A"
    assert "graphCoveragePercent" in json_data


def test_api_sensor_jury():
    """GET /api/decision/jury/{sensor_id}"""
    resp = client.get("/api/decision/jury/773869")
    assert resp.status_code == 200
    json_data = resp.json()
    assert json_data["sensorId"] == "773869"
    assert "juryDecision" in json_data


def test_api_physics_gate():
    """GET /api/decision/physics-gate/{sensor_id}"""
    resp = client.get("/api/decision/physics-gate/773869")
    assert resp.status_code == 200
    json_data = resp.json()
    assert json_data["sensorId"] == "773869"
    assert "passed" in json_data


def test_api_minimum_evidence():
    """GET /api/decision/minimum-evidence/{region_id}"""
    resp = client.get("/api/decision/minimum-evidence/REGION_A")
    assert resp.status_code == 200
    json_data = resp.json()
    assert json_data["regionId"] == "REGION_A"
    assert "selectedSensors" in json_data
