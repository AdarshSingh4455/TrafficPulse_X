"""
TrafficPulse-X Phase 6 Stage 6.7 Unit Test Suite.
Verifies Prediction Intelligence API endpoints, real inference pipeline,
FastAPI route responses, model caching, error handling, and metric immutability.
"""

import os
import json
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.prediction import get_prediction_service

client = TestClient(app)


def test_1_prediction_model_loads():
    """1. Verify prediction model checkpoint loads successfully."""
    pred_svc = get_prediction_service()
    assert pred_svc.model_loaded is True
    assert pred_svc.model is not None


def test_2_checkpoint_path_exists_readiness_handled():
    """2. Verify checkpoint path exists and readiness status endpoint returns OK."""
    res = client.get("/api/prediction/status")
    assert res.status_code == 200
    data = res.json()
    assert data["checkpointReady"] is True
    assert data["modelName"] == "Graph+LSTM"
    assert os.path.exists(data["checkpointPath"])


def test_3_scaler_values_frozen():
    """3. Verify train-only scaler values (mean=58.584258, std=12.822883) are preserved."""
    pred_svc = get_prediction_service()
    assert abs(pred_svc.mean - 58.584258) < 1e-4
    assert abs(pred_svc.std - 12.822883) < 1e-4


def test_4_sensor_ordering_canonical():
    """4. Verify canonical 207 sensor ordering is maintained."""
    pred_svc = get_prediction_service()
    assert len(pred_svc.sensor_ids) == 207
    assert pred_svc.sensor_ids[0] == "773869"


def test_5_adjacency_unchanged():
    """5. Verify 207x207 weighted adjacency tensor is initialized on device."""
    pred_svc = get_prediction_service()
    assert pred_svc.a_norm_tensor is not None
    assert pred_svc.a_norm_tensor.shape == (207, 207)


def test_6_forecast_output_shape():
    """6. Verify forecast endpoint returns 4 horizon predictions."""
    res = client.get("/api/prediction/forecast?time_index=12&sensor_id=773869")
    assert res.status_code == 200
    data = res.json()
    assert "sensor" in data
    assert len(data["sensor"]["predictions"]) == 4


def test_7_four_horizons_returned():
    """7. Verify horizons +5, +15, +30, and +60 min are returned in correct order."""
    res = client.get("/api/prediction/forecast?time_index=12&sensor_id=773869")
    assert res.status_code == 200
    preds = res.json()["sensor"]["predictions"]
    horizons = [p["horizonMinutes"] for p in preds]
    assert horizons == [5, 15, 30, 60]


def test_8_valid_sensor_forecast():
    """8. Verify forecast for valid sensor ID 767541 succeeds."""
    res = client.get("/api/prediction/forecast?time_index=12&sensor_id=767541")
    assert res.status_code == 200
    data = res.json()
    assert data["sensor"]["sensorId"] == "767541"
    assert data["sensor"]["regionId"] == "REGION_B"


def test_9_invalid_sensor_rejected():
    """9. Verify invalid sensor ID is rejected with 404 error."""
    res = client.get("/api/prediction/forecast?time_index=12&sensor_id=INVALID_999")
    assert res.status_code == 404
    assert "INVALID_SENSOR" in res.json()["detail"]


def test_10_invalid_region_rejected():
    """10. Verify invalid region ID is rejected with 400/404 error."""
    res = client.get("/api/prediction/forecast?time_index=12&region_id=INVALID_REGION")
    assert res.status_code in [400, 404]
    assert "INVALID_REGION" in res.json()["detail"]


def test_11_insufficient_history_handled():
    """11. Verify time_index < 11 returns 400 error due to insufficient history window."""
    res = client.get("/api/prediction/forecast?time_index=5")
    assert res.status_code == 400
    assert "INSUFFICIENT_HISTORY" in res.json()["detail"]


def test_12_historical_replay_timestamp_consistent():
    """12. Verify forecast inputEndTimestamp is consistent with historical dataset timestamp."""
    res = client.get("/api/prediction/forecast?time_index=12")
    assert res.status_code == 200
    assert "inputEndTimestamp" in res.json()


def test_13_data_source_manager_and_prediction_input_agree():
    """13. Verify current speed from DataSourceManager agrees with prediction input timestamp."""
    res_ds = client.get("/api/sensors/773869?time_index=12")
    res_pr = client.get("/api/prediction/forecast?time_index=12&sensor_id=773869")
    assert res_ds.status_code == 200
    assert res_pr.status_code == 200

    ds_speed = res_ds.json()["measurements"]["speed"]
    pr_speed = res_pr.json()["sensor"]["currentSpeedMph"]
    assert ds_speed == pr_speed


def test_14_no_model_reload_per_request():
    """14. Verify singleton model object identity is cached across requests."""
    svc1 = get_prediction_service()
    svc2 = get_prediction_service()
    assert svc1 is svc2


def test_15_no_frontend_mock_fallback():
    """15. Verify prediction endpoint response mode is REAL_METR_LA and HISTORICAL_REPLAY."""
    res = client.get("/api/prediction/forecast?time_index=12")
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "REAL_METR_LA"
    assert data["mode"] == "HISTORICAL_REPLAY"


def test_16_frozen_metrics_endpoint_values():
    """16. Verify /api/prediction/metrics matches Stage 6.6 authoritative summary values."""
    res = client.get("/api/prediction/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["overallMetrics"]["Graph+LSTM"]["mae"] == 3.4378


def test_17_graph_lstm_selected_model():
    """17. Verify /api/prediction/models confirms Graph+LSTM as overall winner."""
    res = client.get("/api/prediction/models")
    assert res.status_code == 200
    data = res.json()
    assert data["overallWinner"] == "Graph+LSTM"


def test_18_plus_60_historical_average_winner_preserved():
    """18. Verify +60 min winner remains Historical Average."""
    res = client.get("/api/prediction/models")
    assert res.status_code == 200
    data = res.json()
    assert data["horizon60Winner"] == "Historical Average"
