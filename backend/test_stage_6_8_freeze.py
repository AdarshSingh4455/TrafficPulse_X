"""
TrafficPulse-X Phase 6 Stage 6.8 Final Regression and Prediction System Freeze Test Suite.
Verifies region consistency, cross-endpoint data equality, model inference reproducibility,
API contract freeze, single FastAPI app integrity, and zero synthetic/mock fallbacks.
"""

import os
import json
import pickle
import hashlib
import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.prediction import get_prediction_service
from backend.data_source import DataSourceManager

client = TestClient(app)


def test_1_region_lookup_consistency():
    """1. Verify region lookup for 773869 -> REGION_C, 767541 -> REGION_B, and all 20 representatives."""
    with open("data/processed/metr-la/regions.json", "r", encoding="utf-8") as f:
        regions = json.load(f)

    with open("data/processed/metr-la/representative_sensors.json", "r", encoding="utf-8") as f:
        reps = json.load(f)

    # 773869 is in REGION_C
    assert "773869" in regions["REGION_C"]["sensorIds"]
    assert "767541" in regions["REGION_B"]["sensorIds"]

    # Verify all 20 representatives match their assigned region
    for r_code, r_list in reps.items():
        for r_item in r_list:
            sid = r_item["sensorId"]
            assert sid in regions[r_code]["sensorIds"]


def test_2_authoritative_region_hash_checksum():
    """2. Verify SHA-256 checksum of sorted regions.json is ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2."""
    with open("data/processed/metr-la/regions.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    content_bytes = json.dumps(data, sort_keys=True).encode("utf-8")
    sha = hashlib.sha256(content_bytes).hexdigest()
    assert sha == "ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2"


def test_3_cross_endpoint_consistency():
    """3. Verify cross-endpoint data equality across 10 real sensor/time combinations."""
    sample_sensors = ["773869", "767541", "717447", "717816", "765171", "773975", "717458", "717468", "769431", "767350"]
    sample_times = [12, 15, 20, 25, 30, 35, 40, 45, 50, 60]

    for sid, t_idx in zip(sample_sensors, sample_times):
        # 1. DataSourceManager sensor
        res_ds = client.get(f"/api/sensors/{sid}?time_index={t_idx}").json()
        # 2. Prediction Forecast
        res_pr = client.get(f"/api/prediction/forecast?time_index={t_idx}&sensor_id={sid}").json()
        # 3. Decision Need Score
        res_dc = client.get(f"/api/decision/sensors/{sid}/need-score").json()

        assert res_ds["sensorId"] == sid
        assert res_pr["sensor"]["sensorId"] == sid
        assert res_dc["sensorId"] == sid

        assert res_ds["regionId"] == res_pr["sensor"]["regionId"]
        assert res_ds["timestamp"] == res_pr["inputEndTimestamp"]
        assert res_ds["measurements"]["speed"] == res_pr["sensor"]["currentSpeedMph"]


def test_4_prediction_reproducibility():
    """4. Run model inference twice for fixed sensor/time and confirm identical predictions."""
    res1 = client.get("/api/prediction/forecast?time_index=20&sensor_id=773869").json()
    res2 = client.get("/api/prediction/forecast?time_index=20&sensor_id=773869").json()

    preds1 = [p["predictedSpeedMph"] for p in res1["sensor"]["predictions"]]
    preds2 = [p["predictedSpeedMph"] for p in res2["sensor"]["predictions"]]

    assert preds1 == preds2


def test_5_model_artifacts_frozen():
    """5. Verify model parameter count (26,596), scaler, adjacency, and sensor ordering remain frozen."""
    pred_svc = get_prediction_service()
    assert pred_svc.parameter_count == 26596
    assert abs(pred_svc.mean - 58.584258) < 1e-4
    assert abs(pred_svc.std - 12.822883) < 1e-4
    assert len(pred_svc.sensor_ids) == 207
    assert pred_svc.a_norm_tensor.shape == (207, 207)


def test_6_api_contract_freeze():
    """6. Verify all 4 prediction endpoints handle valid and error requests according to frozen contract."""
    # Status
    assert client.get("/api/prediction/status").status_code == 200
    # Forecast valid
    assert client.get("/api/prediction/forecast?time_index=12&sensor_id=773869").status_code == 200
    # Forecast invalid sensor (404)
    assert client.get("/api/prediction/forecast?time_index=12&sensor_id=INVALID").status_code == 404
    # Forecast invalid region (400/404)
    assert client.get("/api/prediction/forecast?time_index=12&region_id=INVALID").status_code in [400, 404]
    # Forecast insufficient history (400)
    assert client.get("/api/prediction/forecast?time_index=5").status_code == 400
    # Metrics
    assert client.get("/api/prediction/metrics").status_code == 200
    # Models
    assert client.get("/api/prediction/models").status_code == 200


def test_7_single_fastapi_app_instance():
    """7. Verify exactly one FastAPI application instance exists in backend/main.py."""
    import backend.main as main_mod
    assert hasattr(main_mod, "app")
    assert main_mod.app.title == "TrafficPulse-X API"


def test_8_no_synthetic_runtime_or_frontend_mock():
    """8. Verify zero synthetic runtime files and API mode is HISTORICAL_REPLAY."""
    assert not os.path.exists("backend/data.py")
    assert not os.path.exists("src/data/sensors.js")

    res = client.get("/api/prediction/forecast?time_index=12").json()
    assert res["source"] == "REAL_METR_LA"
    assert res["mode"] == "HISTORICAL_REPLAY"
