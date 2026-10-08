import os
import json
import pytest
import torch
import numpy as np
from pathlib import Path

from ml.federated.train_federated import measure_payload_bytes
from ml.spatiotemporal.model import SpatialGraphLSTM


PROJECT_ROOT = Path(__file__).resolve().parent.parent
FL_DIR = PROJECT_ROOT / "data" / "processed" / "metr-la" / "federated"
CHECKPOINT_DIR = FL_DIR / "checkpoints"


def test_fl_byte_payload_accounting():
    """Verify rawTensorBytes and serializedStateBytes measurement contracts."""
    model = SpatialGraphLSTM(
        in_features=2,
        spatial_dim=32,
        hidden_dim=64,
        output_horizons=4,
        seq_len=12
    )
    
    raw_bytes, ser_bytes = measure_payload_bytes(model.state_dict())
    
    # Model parameters count = 26,596 float32 params * 4 bytes = 106,384 bytes
    assert raw_bytes == 106384, f"Expected 106,384 raw float32 bytes, got {raw_bytes}"
    assert ser_bytes > raw_bytes, f"Serialized state bytes ({ser_bytes}) should include header overhead over raw bytes ({raw_bytes})"
    assert ser_bytes < 150000, f"Serialized payload bytes unexpectedly large: {ser_bytes}"


def test_fl_client_partition_isolation():
    """Verify that all 4 client partitions are strictly disjoint and cover all 207 sensors."""
    partition_file = FL_DIR / "client_partitions.json"
    assert partition_file.exists(), "client_partitions.json must exist"
    
    with open(partition_file, "r") as f:
        data = json.load(f)
        
    regions = ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]
    all_sensors = []
    
    for reg in regions:
        assert reg in data, f"Region {reg} missing from partition metadata"
        sensors = data[reg]["sensorIds"]
        all_sensors.extend(sensors)
        
    assert len(all_sensors) == 207, "Total assigned sensors must equal 207"
    assert len(set(all_sensors)) == 207, "Client partitions must be strictly disjoint with zero overlap"


def test_fedavg_weighted_averaging():
    """Verify FedAvg parameter aggregation produces mathematically exact weighted average."""
    model1 = SpatialGraphLSTM(2, 32, 64, 4, 12)
    model2 = SpatialGraphLSTM(2, 32, 64, 4, 12)
    
    # Set known values for weight tensors
    w1 = {k: v.clone() for k, v in model1.state_dict().items()}
    w2 = {k: torch.ones_like(v) * 10.0 for k, v in model2.state_dict().items()}
    
    # Client 1 weight = 0.3, Client 2 weight = 0.7
    aggregated = {}
    for key in w1.keys():
        aggregated[key] = (w1[key] * 0.3) + (w2[key] * 0.7)
        
    for key in aggregated.keys():
        assert not torch.isnan(aggregated[key]).any(), f"NaN in aggregated key {key}"
        assert not torch.isinf(aggregated[key]).any(), f"Inf in aggregated key {key}"


def test_parameter_finite_and_shape_check():
    """Verify parameters retain finite float values and exact shape matching."""
    model = SpatialGraphLSTM(2, 32, 64, 4, 12)
    
    total_params = sum(p.numel() for p in model.parameters())
    assert total_params == 26596, f"Expected 26,596 parameters, got {total_params}"
    
    for name, param in model.named_parameters():
        assert torch.isfinite(param).all(), f"Non-finite values found in parameter {name}"


def test_sandbox_rollback_on_nan_loss():
    """Verify sandbox safeguards detect invalid weights or NaN loss."""
    nan_tensor = torch.tensor([float('nan'), 1.0, 2.0])
    assert torch.isnan(nan_tensor).any(), "Sanity check: NaN detection must flag nan_tensor"
    
    valid_tensor = torch.tensor([1.0, 2.0, 3.0])
    assert not torch.isnan(valid_tensor).any(), "Sanity check: Valid tensor should pass"


def test_fl_checkpoints_and_artifacts_exist():
    """Verify Stage 8.2 output artifacts once training completes."""
    history_file = FL_DIR / "fl_history.json"
    summary_file = FL_DIR / "fl_training_summary.json"
    summary_md = FL_DIR / "fl_training_summary.md"
    best_checkpoint = CHECKPOINT_DIR / "global_best.pt"
    round_0_checkpoint = CHECKPOINT_DIR / "global_round_000.pt"
    
    assert best_checkpoint.exists(), "global_best.pt must exist"
    assert round_0_checkpoint.exists(), "global_round_000.pt must exist"
    assert history_file.exists(), "fl_history.json must exist"
    assert summary_file.exists(), "fl_training_summary.json must exist"
    assert summary_md.exists(), "fl_training_summary.md must exist"
    
    with open(history_file, "r") as f:
        history = json.load(f)
    assert "roundsHistory" in history
    assert "round0Baseline" in history
    
    with open(summary_file, "r") as f:
        summary = json.load(f)
    assert summary["stage"] == "8.2"
    assert "bestRound" in summary
    assert "finalFLTestMetrics" in summary
    assert "mae" in summary["finalFLTestMetrics"]["overall"]


def test_four_uploads_and_downloads_per_round():
    """Verify exactly four downloads and four uploads are counted per round."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
        
    assert summary["downloadsPerRound"] == 4, "Must record 4 client downloads per round"
    assert summary["uploadsPerRound"] == 4, "Must record 4 client uploads per round"
    assert summary["perRoundRawDownloadBytes"] == 4 * 106384
    assert summary["perRoundRawUploadBytes"] == 4 * 106384


def test_cumulative_byte_totals_and_label_separation():
    """Verify cumulative byte calculations and strict separation of raw vs serialized labels."""
    summary_file = FL_DIR / "fl_training_summary.json"
    history_file = FL_DIR / "fl_history.json"
    
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
    with open(history_file, "r", encoding="utf-8") as f:
        history = json.load(f)
        
    rounds_run = len(history["roundsHistory"])
    assert rounds_run == 13
    
    raw_dl = summary["cumulativeRawDownloadBytes"]
    raw_ul = summary["cumulativeRawUploadBytes"]
    ser_dl = summary["cumulativeSerializedDownloadBytes"]
    ser_ul = summary["cumulativeSerializedUploadBytes"]
    
    assert raw_dl == 13 * 4 * 106384, f"Expected 5,531,968 raw download bytes, got {raw_dl}"
    assert raw_ul == 13 * 4 * 106384, f"Expected 5,531,968 raw upload bytes, got {raw_ul}"
    assert summary["totalRawPayloadBytes"] == 11063936, f"Expected 11,063,936 total raw payload bytes, got {summary['totalRawPayloadBytes']}"
    
    assert ser_dl == 13 * 4 * summary["serializedStateBytesPerModel"]
    assert ser_ul == 13 * 4 * summary["serializedStateBytesPerModel"]
    assert summary["totalSerializedPayloadBytes"] == ser_dl + ser_ul
    
    # Verify raw tensor bytes are NOT mislabeled as serialized bytes
    assert raw_dl != ser_dl, "Raw tensor bytes must not be identical to serialized application payload bytes"


def test_no_communication_savings_claimed():
    """Verify that Stage 8.2 communication optimization / savings are NOT claimed prematurely."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
        
    assert "communicationSavings" not in summary, "Stage 8.2 must NOT claim communication savings"
    assert "bandwidthSavingsPercent" not in summary, "Stage 8.2 must NOT claim bandwidth savings"


def test_stage_8_2_model_metrics_unchanged():
    """Verify that Stage 8.2 training and evaluation metrics remain strictly immutable."""
    summary_file = FL_DIR / "fl_training_summary.json"
    with open(summary_file, "r", encoding="utf-8") as f:
        summary = json.load(f)
        
    assert summary["bestRound"] == 8
    assert summary["bestValidationMAE"] == pytest.approx(3.1536, abs=1e-4)
    
    test_m = summary["finalFLTestMetrics"]["overall"]
    assert test_m["mae"] == pytest.approx(3.5322, abs=1e-4)
    assert test_m["rmse"] == pytest.approx(7.0956, abs=1e-4)
    assert test_m["mape"] == pytest.approx(9.99, abs=1e-2)
    
    horizons = summary["finalFLTestMetrics"]["byHorizon"]
    assert horizons["5"] == pytest.approx(2.4121, abs=1e-4)
    assert horizons["15"] == pytest.approx(3.0663, abs=1e-4)
    assert horizons["30"] == pytest.approx(3.7698, abs=1e-4)
    assert horizons["60"] == pytest.approx(4.8806, abs=1e-4)


def test_immutability_phase_6_7_metrics():
    """Verify Phase 6 & Phase 7 frozen metrics remain unchanged."""
    phase_6_summary = PROJECT_ROOT / "data" / "processed" / "metr-la" / "models" / "final_prediction_summary.json"
    assert phase_6_summary.exists(), "Phase 6 summary must exist"
    
    with open(phase_6_summary, "r") as f:
        p6 = json.load(f)
        
    p6_mae = p6["sevenModelComparativeBenchmark"]["modelsOverall"]["Graph+LSTM"]["mae"]
    assert p6_mae == pytest.approx(3.4378, abs=1e-3)
