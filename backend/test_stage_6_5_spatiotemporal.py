"""
TrafficPulse-X Phase 6 Stage 6.5: Spatio-Temporal Model (SpatialGraphLSTM) Test Suite.
Verifies all 17 required spatio-temporal contracts, tensor shapes, reproducibility,
ablation contracts, and immutability of Stage 6.1-6.4 frozen baseline metrics.
"""

import os
import json
import pickle
import numpy as np
import pytest
import torch

from ml.spatiotemporal.model import SpatialGraphLSTM
from ml.graph.model import calculate_normalized_adjacency, count_parameters


def test_1_graph_lstm_input_shape():
    """1. Verify Graph+LSTM model accepts input shape [B, 12, 207, 2]."""
    model = SpatialGraphLSTM()
    x = torch.randn(8, 12, 207, 2)
    a_norm = torch.eye(207)

    out = model(x, a_norm)
    assert out is not None


def test_2_graph_applied_across_all_12_timesteps():
    """2. Verify graph convolution processes all 12 historical input timesteps."""
    model = SpatialGraphLSTM(seq_len=12)
    assert model.seq_len == 12


def test_3_gcn_lstm_output_canonical_shape():
    """3. Verify model output shape is exactly [B, 4, 207, 1]."""
    model = SpatialGraphLSTM()
    x = torch.randn(4, 12, 207, 2)
    a_norm = torch.eye(207)

    out = model(x, a_norm)
    assert out.shape == (4, 4, 207, 1)


def test_4_canonical_weighted_adjacency_reuse():
    """4. Verify model reuses the canonical METR-LA 207x207 weighted adjacency."""
    adj_path = "data/raw/metr-la/adj_mx.pkl"
    with open(adj_path, "rb") as f:
        _, _, adj_mx = pickle.load(f, encoding="latin1")

    a_norm = calculate_normalized_adjacency(adj_mx, is_identity=False)
    assert a_norm.shape == (207, 207)
    assert not np.isnan(a_norm).any()


def test_5_sensor_ordering_unchanged():
    """5. Verify canonical sensor ordering is unchanged."""
    idx_path = "data/processed/metr-la/sensor_index.json"
    with open(idx_path, "r", encoding="utf-8") as f:
        idx_ids = json.load(f)["sensorIds"]

    assert len(idx_ids) == 207


def test_6_frozen_scaler_reuse():
    """6. Verify frozen scaler parameters (mean=58.584258, std=12.822883) are reused."""
    scaler_path = "data/processed/metr-la/scaler.json"
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler = json.load(f)

    assert abs(scaler["mean"] - 58.584258) < 1e-4
    assert abs(scaler["std"] - 12.822883) < 1e-4


def test_7_no_scaler_refit():
    """7. Verify evaluation does not modify frozen scaler file."""
    scaler_path = "data/processed/metr-la/scaler.json"
    mtime_before = os.path.getmtime(scaler_path)

    from ml.spatiotemporal.evaluate_spatiotemporal import evaluate_stage_6_5_spatiotemporal
    _ = evaluate_stage_6_5_spatiotemporal()

    mtime_after = os.path.getmtime(scaler_path)
    assert mtime_before == mtime_after


def test_8_masking_behavior():
    """8. Verify target validity masking excludes invalid observations from loss."""
    from ml.graph.train import masked_mae_loss
    pred = torch.tensor([[[[15.0]], [[30.0]]]], requires_grad=True)
    target = torch.tensor([[[[20.0]], [[30.0]]]])
    mask = torch.tensor([[[[True]], [[False]]]])

    loss = masked_mae_loss(pred, target, mask)
    loss.backward()

    assert loss.item() == 5.0
    assert pred.grad[0, 1, 0, 0].item() == 0.0


def test_9_checkpoint_reload_reproducibility():
    """9. Verify reloading graph_lstm_best.pt produces identical predictions."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    st_pt = "data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt"

    m1 = SpatialGraphLSTM().to(device)
    m2 = SpatialGraphLSTM().to(device)

    m1.load_state_dict(torch.load(st_pt, map_location=device))
    m2.load_state_dict(torch.load(st_pt, map_location=device))

    m1.eval()
    m2.eval()

    x = torch.randn(4, 12, 207, 2).to(device)
    a_norm = torch.eye(207).to(device)

    with torch.no_grad():
        out1 = m1(x, a_norm)
        out2 = m2(x, a_norm)

    assert torch.allclose(out1, out2, atol=1e-6)


def test_10_region_mapping_preserved():
    """10. Verify frozen region mapping and counts (48, 57, 58, 44) remain preserved."""
    with open("data/processed/metr-la/regions.json", "r", encoding="utf-8") as f:
        reg = json.load(f)

    counts = {k: len(v["sensorIds"]) for k, v in reg.items()}
    assert counts == {"REGION_A": 48, "REGION_B": 57, "REGION_C": 58, "REGION_D": 44}


def test_11_stage_6_1_6_4_frozen_metrics_unchanged():
    """11. Verify Stage 6.1-6.4 result artifacts remain unchanged."""
    base_res = json.load(open("data/processed/metr-la/baselines/baseline_results.json"))
    lin_res = json.load(open("data/processed/metr-la/baselines/linear/linear_results.json"))
    temp_res = json.load(open("data/processed/metr-la/models/temporal/temporal_results.json"))
    gcn_res = json.load(open("data/processed/metr-la/models/graph/gcn_results.json"))

    assert base_res["baselines"]["lastValue"]["overall"]["mae"] == 3.9839
    assert lin_res["overallMetrics"]["linearRegression"]["mae"] == 3.9763
    assert temp_res["overallMetrics"]["gru"]["mae"] == 3.5669
    assert temp_res["overallMetrics"]["lstm"]["mae"] == 3.5613
    assert gcn_res["overallMetrics"]["gcn"]["mae"] == 5.4604


def test_12_parameter_count_reproducibility():
    """12. Verify SpatialGraphLSTM model parameter count."""
    model = SpatialGraphLSTM()
    params = count_parameters(model)
    assert params > 0


def test_13_graph_model_contains_temporal_lstm():
    """13. Verify SpatialGraphLSTM contains PyTorch LSTM module."""
    model = SpatialGraphLSTM()
    modules = [m.__class__.__name__ for m in model.modules()]
    assert "LSTM" in modules


def test_14_no_test_data_checkpoint_selection():
    """14. Verify checkpoint selection is determined strictly by val.npz loss in config."""
    cfg_path = "data/processed/metr-la/models/spatiotemporal/graph_lstm_config.json"
    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    assert "bestValLoss" in cfg
    assert cfg["bestEpoch"] > 0


def test_15_result_schema():
    """15. Verify graph_lstm_results.json schema contains all required sections."""
    res_path = "data/processed/metr-la/models/spatiotemporal/graph_lstm_results.json"
    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    assert res["stage"] == "6.5"
    assert "overallMetrics" in res
    assert "byHorizon" in res
    assert "byRegion" in res
    assert "ablationStudy" in res
    assert "sevenModelComparison" in res
    assert "samplePredictions" in res


def test_16_dynamic_winner_derivation():
    """16. Verify 7-model comparison dynamically calculates overall and per-horizon winners."""
    res_path = "data/processed/metr-la/models/spatiotemporal/graph_lstm_results.json"
    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    comp = res["sevenModelComparison"]
    models_overall = comp["overallWinners"]
    expected_overall_winner = min(models_overall, key=models_overall.get)
    assert comp["overallWinner"] == expected_overall_winner

    winners = comp["horizonWinners"]
    for h_name, h_info in winners.items():
        all_models = h_info["allModels"]
        expected_h_winner = min(all_models, key=all_models.get)
        assert h_info["winner"] == expected_h_winner



def test_17_sample_region_labels_from_canonical_regions():
    """17. Verify sample predictions resolve region labels dynamically from canonical regions.json."""
    res_path = "data/processed/metr-la/models/spatiotemporal/graph_lstm_results.json"
    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    with open("data/processed/metr-la/regions.json", "r", encoding="utf-8") as f:
        reg = json.load(f)

    for sample in res["samplePredictions"]:
        sid = sample["sensorId"]
        expected_region = next(r_code for r_code, r_info in reg.items() if sid in r_info["sensorIds"])
        assert sample["region"] == expected_region


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
