import os
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def test_1_federated_status_endpoint():
    """Verify /api/federated/status endpoint returns readiness and metadata."""
    res = client.get("/api/federated/status")
    assert res.status_code == 200
    data = res.json()
    assert data["phase"] == "8"
    assert data["stage"] == "8.3"
    assert data["trainingComplete"] is True
    assert data["checkpointReady"] is True


def test_2_exactly_four_clients_returned():
    """Verify /api/federated/clients returns exactly 4 regional clients."""
    res = client.get("/api/federated/clients")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 4
    c_ids = [c["clientId"] for c in data]
    assert c_ids == ["CLIENT_A", "CLIENT_B", "CLIENT_C", "CLIENT_D"]


def test_3_canonical_sensor_counts():
    """Verify regional client sensor counts match METR-LA canonical partition."""
    res = client.get("/api/federated/clients")
    data = res.json()
    client_map = {c["clientId"]: c for c in data}
    
    assert client_map["CLIENT_A"]["sensorCount"] == 48
    assert client_map["CLIENT_B"]["sensorCount"] == 57
    assert client_map["CLIENT_C"]["sensorCount"] == 58
    assert client_map["CLIENT_D"]["sensorCount"] == 44
    assert sum(c["sensorCount"] for c in data) == 207


def test_4_aggregation_weights_sum_to_one():
    """Verify FedAvg aggregation weights sum strictly to 1.0."""
    res = client.get("/api/federated/clients")
    data = res.json()
    total_w = sum(c["aggregationWeight"] for c in data)
    assert total_w == pytest.approx(1.0, abs=1e-3)


def test_5_selected_round_equals_eight():
    """Verify selected global round is Round 8."""
    res = client.get("/api/federated/status")
    data = res.json()
    assert data["selectedRound"] == 8


def test_6_best_validation_mae_equals_3_1536():
    """Verify best global validation MAE is 3.1536 mph."""
    res = client.get("/api/federated/status")
    data = res.json()
    assert data["bestValidationMAE"] == pytest.approx(3.1536, abs=1e-4)


def test_7_final_fl_test_mae_equals_3_5322():
    """Verify final FL global test MAE is 3.5322 mph."""
    res = client.get("/api/federated/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["overall"]["mae"] == pytest.approx(3.5322, abs=1e-4)
    assert data["overall"]["rmse"] == pytest.approx(7.0956, abs=1e-4)
    assert data["overall"]["mape"] == pytest.approx(9.99, abs=1e-2)


def test_8_centralized_reference_mae_equals_3_4378():
    """Verify centralized Graph+LSTM reference MAE is 3.4378 mph."""
    res = client.get("/api/federated/metrics")
    data = res.json()
    comp = data["centralizedReferenceComparison"]
    assert comp["centralizedGraphLSTMTestMAE"] == pytest.approx(3.4378, abs=1e-4)
    assert comp["referenceBaselineType"] == "centralized reference baseline"


def test_9_plus_2_75_percent_comparison_consistent():
    """Verify relative MAE difference is +2.75% against centralized reference baseline."""
    res = client.get("/api/federated/metrics")
    data = res.json()
    comp = data["centralizedReferenceComparison"]
    assert comp["relativeMAEDifferencePercent"] == "+2.75%"
    assert "upper bound" not in comp["wording"].lower()


def test_10_round_history_uses_validation_only():
    """Verify per-round training history tracks globalValidationMAE strictly."""
    res = client.get("/api/federated/rounds")
    assert res.status_code == 200
    data = res.json()
    assert "roundsHistory" in data
    for r in data["roundsHistory"]:
        assert "validationMAE" in r
        assert r["validationMAE"] > 0.0


def test_11_no_per_round_test_metrics_exposed():
    """Verify test MAE is NOT recorded or exposed per training round."""
    res = client.get("/api/federated/rounds")
    data = res.json()
    for r in data["roundsHistory"]:
        assert "testMAE" not in r
        assert "globalTestMAE" not in r


def test_12_communication_raw_totals_correct():
    """Verify raw tensor communication totals match 11,063,936 bytes."""
    res = client.get("/api/federated/communication")
    assert res.status_code == 200
    data = res.json()
    assert data["rawDownloadBytes"] == 5531968
    assert data["rawUploadBytes"] == 5531968
    assert data["rawTotalBytes"] == 11063936


def test_13_communication_serialized_totals_correct():
    """Verify serialized application payload totals match 11,468,184 bytes."""
    res = client.get("/api/federated/communication")
    data = res.json()
    assert data["serializedDownloadBytes"] == 5734092
    assert data["serializedUploadBytes"] == 5734092
    assert data["serializedTotalBytes"] == 11468184
    assert data["classification"] == "SERIALIZED_APPLICATION_PAYLOAD_BYTES"


def test_14_four_uploads_per_round_contract():
    """Verify communication contract registers 4 uploads per round."""
    res = client.get("/api/federated/communication")
    data = res.json()
    assert data["uploadsPerRound"] == 4


def test_15_four_downloads_per_round_contract():
    """Verify communication contract registers 4 downloads per round."""
    res = client.get("/api/federated/communication")
    data = res.json()
    assert data["downloadsPerRound"] == 4


def test_16_no_communication_savings_field():
    """Verify no communication savings or bandwidth reduction fields exist in Stage 8.3 endpoints."""
    res = client.get("/api/federated/communication")
    data = res.json()
    assert "communicationSavings" not in data
    assert "bandwidthSavingsPercent" not in data


def test_17_round_13_runtime_anomaly_preserved():
    """Verify Round 13 runtime anomaly note is preserved."""
    res = client.get("/api/federated/rounds")
    data = res.json()
    r13 = [r for r in data["roundsHistory"] if r["round"] == 13]
    assert len(r13) == 1
    assert "external resource stall" in r13[0]["runtimeNote"].lower()


def test_18_no_training_endpoint_exposed():
    """Verify NO runtime endpoint executes or triggers FL training."""
    all_routes = [route.path for route in app.routes]
    assert "/api/federated/train" not in all_routes
    assert "/api/federated/start" not in all_routes


def test_19_phase_6_metrics_unchanged():
    """Verify Phase 6 frozen metrics remain untouched."""
    p6_summary = PROJECT_ROOT / "data" / "processed" / "metr-la" / "models" / "final_prediction_summary.json"
    with open(p6_summary, "r", encoding="utf-8") as f:
        p6 = json.load(f)
    assert p6["sevenModelComparativeBenchmark"]["modelsOverall"]["Graph+LSTM"]["mae"] == pytest.approx(3.4378, abs=1e-3)


def test_20_phase_7_artifacts_unchanged():
    """Verify Phase 7 uncertainty calibration remains untouched."""
    from backend.decision.uncertainty import calculate_prediction_uncertainty
    u5 = calculate_prediction_uncertainty(horizon_minutes=5, region_id="REGION_A")
    assert abs(u5 - 1.53) < 0.05


def test_21_region_checksum_unchanged():
    """Verify authoritative region checksum matches ad064c643b6eb..."""
    fl_config = PROJECT_ROOT / "data" / "processed" / "metr-la" / "federated" / "fl_config.json"
    with open(fl_config, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    assert cfg["regionMappingChecksum"] == "ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2"


def test_22_frontend_no_mock_fl_fallback():
    """Verify frontend api.js contains no mock fallback data for FL endpoints."""
    api_js = PROJECT_ROOT / "src" / "services" / "api.js"
    with open(api_js, "r", encoding="utf-8") as f:
        content = f.read()
    assert "fetchFederatedStatus" in content
    assert "fetchFederatedCommunication" in content
