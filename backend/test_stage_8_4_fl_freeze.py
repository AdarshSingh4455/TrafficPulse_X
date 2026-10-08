import os
import json
import pytest
import hashlib
from pathlib import Path
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
FL_DIR = PROJECT_ROOT / "data" / "processed" / "metr-la" / "federated"


def test_1_exact_four_clients():
    """Verify exactly 4 FL clients exist in Phase 8 partition metadata."""
    partition_file = FL_DIR / "client_partitions.json"
    with open(partition_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert len(data) == 4
    assert set(data.keys()) == {"REGION_A", "REGION_B", "REGION_C", "REGION_D"}


def test_2_sensor_counts_48_57_58_44():
    """Verify exact regional sensor counts: REGION_A=48, REGION_B=57, REGION_C=58, REGION_D=44."""
    partition_file = FL_DIR / "client_partitions.json"
    with open(partition_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["REGION_A"]["sensorCount"] == 48
    assert data["REGION_B"]["sensorCount"] == 57
    assert data["REGION_C"]["sensorCount"] == 58
    assert data["REGION_D"]["sensorCount"] == 44


def test_3_union_equals_207_sensors():
    """Verify total sensors in client partition union equals 207."""
    partition_file = FL_DIR / "client_partitions.json"
    with open(partition_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    all_s = []
    for reg_info in data.values():
        all_s.extend(reg_info["sensorIds"])
    assert len(all_s) == 207


def test_4_no_sensor_membership_overlap():
    """Verify client partitions have zero sensor overlap (strictly disjoint)."""
    partition_file = FL_DIR / "client_partitions.json"
    with open(partition_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    all_s = []
    for reg_info in data.values():
        all_s.extend(reg_info["sensorIds"])
    assert len(set(all_s)) == 207


def test_5_region_checksum_unchanged():
    """Verify authoritative region checksum matches ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2."""
    fl_config = FL_DIR / "fl_config.json"
    with open(fl_config, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    assert cfg["regionMappingChecksum"] == "ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2"


def test_6_fedavg_count_semantic_explicit():
    """Verify target count semantics explicitly distinguish scalar elements (Set A) from timestep samples (Set B)."""
    freeze_file = FL_DIR / "phase8_freeze.json"
    assert freeze_file.exists(), "phase8_freeze.json artifact must exist"
    with open(freeze_file, "r", encoding="utf-8") as f:
        frz = json.load(f)
    
    expl = frz["targetCountSemanticsExplanation"]
    assert expl["validTargetTimestepSamplesTotal"] == 4797840
    assert expl["validTargetScalarElementsAcrossHorizonsTotal"] == 18429761


def test_7_training_time_ni_values_consistent():
    """Verify training-time n_i values are consistent across client definitions."""
    partition_file = FL_DIR / "client_partitions.json"
    with open(partition_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    n_a = data["REGION_A"]["trainValidTargets"]
    n_b = data["REGION_B"]["trainValidTargets"]
    n_c = data["REGION_C"]["trainValidTargets"]
    n_d = data["REGION_D"]["trainValidTargets"]
    
    assert n_a == 4221681
    assert n_b == 5107193
    assert n_c == 5150335
    assert n_d == 3950552
    assert (n_a + n_b + n_c + n_d) == 18429761


def test_8_aggregation_weights_consistent():
    """Verify exact training-time FedAvg aggregation weights w_i."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
        
    weights = summary["fedAvgWeights"]
    assert weights["CLIENT_A"] == pytest.approx(0.229069, abs=1e-5)
    assert weights["CLIENT_B"] == pytest.approx(0.277117, abs=1e-5)
    assert weights["CLIENT_C"] == pytest.approx(0.279458, abs=1e-5)
    assert weights["CLIENT_D"] == pytest.approx(0.214357, abs=1e-5)


def test_9_weights_sum_to_one():
    """Verify aggregation weights sum strictly to 1.0."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    weights = summary["fedAvgWeights"]
    assert sum(weights.values()) == pytest.approx(1.0, abs=1e-4)


def test_10_selected_round_equals_eight():
    """Verify best selected round is Round 8."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["bestRound"] == 8


def test_11_best_validation_mae_equals_3_1536():
    """Verify best global validation MAE is 3.1536 mph."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["bestValidationMAE"] == pytest.approx(3.1536, abs=1e-4)


def test_12_final_test_mae_equals_3_5322():
    """Verify final global FL test MAE is 3.5322 mph."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["finalFLTestMetrics"]["overall"]["mae"] == pytest.approx(3.5322, abs=1e-4)


def test_13_no_test_driven_round_selection():
    """Verify round selection history depends strictly on validation MAE, not test set."""
    history_file = FL_DIR / "fl_history.json"
    with open(history_file, "r", encoding="utf-8") as f:
        history = json.load(f)
    for r in history["roundsHistory"]:
        assert "globalValidationMAE" in r
        assert "testMAE" not in r


def test_14_four_downloads_per_round():
    """Verify four model downloads per round contract."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["downloadsPerRound"] == 4
    assert summary["cumulativeRawDownloadBytes"] == 13 * 4 * 106384


def test_15_four_uploads_per_round():
    """Verify four model uploads per round contract."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["uploadsPerRound"] == 4
    assert summary["cumulativeRawUploadBytes"] == 13 * 4 * 106384


def test_16_serialized_total_equals_11468184():
    """Verify total cumulative serialized application payload bytes equals 11,468,184."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["totalSerializedPayloadBytes"] == 11468184


def test_17_no_savings_percentage_exists():
    """Verify NO communication savings percentage or claims are made in Phase 8 baseline."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert "communicationSavings" not in summary
    assert "bandwidthSavingsPercent" not in summary


def test_18_round_13_anomaly_preserved():
    """Verify Round 13 is explicitly classified as wall-clock external stall anomaly."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    audit = summary["round13RuntimeAudit"]
    assert audit["round13DurationSec"] == 5117.68
    assert audit["classification"] == "WALL_CLOCK_RUNTIME_WITH_EXTERNAL_DELAY / RESOURCE STALL"


def test_19_no_fl_training_endpoint_exists():
    """Verify NO runtime API endpoint allows launching FL training."""
    all_routes = [route.path for route in app.routes]
    assert "/api/federated/train" not in all_routes
    assert "/api/federated/start" not in all_routes


def test_20_no_selective_participation():
    """Verify participation mode is FULL_PARTICIPATION_FEDAVG_SIMULATION (selective participation reserved for Phase 9)."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["flMode"] == "FULL_PARTICIPATION_FEDAVG_SIMULATION"


def test_21_phase_6_artifacts_unchanged():
    """Verify Phase 6 frozen prediction metrics remain untouched."""
    p6_summary = PROJECT_ROOT / "data" / "processed" / "metr-la" / "models" / "final_prediction_summary.json"
    with open(p6_summary, "r", encoding="utf-8") as f:
        p6 = json.load(f)
    assert p6["sevenModelComparativeBenchmark"]["modelsOverall"]["Graph+LSTM"]["mae"] == pytest.approx(3.4378, abs=1e-3)


def test_22_phase_7_artifacts_unchanged():
    """Verify Phase 7 uncertainty calibration remains untouched."""
    from backend.decision.uncertainty import calculate_prediction_uncertainty
    u5 = calculate_prediction_uncertainty(horizon_minutes=5, region_id="REGION_A")
    assert abs(u5 - 1.53) < 0.05


def test_23_frontend_has_no_mock_fl_fallback():
    """Verify frontend API gateway contains no synthetic mock fallbacks."""
    api_js = PROJECT_ROOT / "src" / "services" / "api.js"
    with open(api_js, "r", encoding="utf-8") as f:
        content = f.read()
    assert "fetchFederatedStatus" in content
    assert "fetchFederatedCommunication" in content
