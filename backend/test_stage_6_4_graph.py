"""
TrafficPulse-X Phase 6 Stage 6.4: Graph Baseline (Spatial GCN) Test Suite.
Verifies all 16 required graph contracts, adjacency normalizations, tensor shapes, reproducibility,
ablation contracts, and immutability of Stage 6.1-6.3 frozen baseline metrics.
"""

import os
import json
import pickle
import numpy as np
import pytest
import torch

from ml.graph.model import SpatialGCN, GraphConv, calculate_normalized_adjacency, count_parameters


def test_1_canonical_adjacency_shape_207x207():
    """1. Verify canonical adjacency matrix shape is exactly 207x207."""
    adj_path = "data/raw/metr-la/adj_mx.pkl"
    with open(adj_path, "rb") as f:
        sensor_ids, id_map, adj_mx = pickle.load(f, encoding="latin1")

    assert len(sensor_ids) == 207
    assert adj_mx.shape == (207, 207)


def test_2_graph_sensor_ordering_consistency():
    """2. Verify graph sensor ordering matches sensor_index.json and regions.json."""
    adj_path = "data/raw/metr-la/adj_mx.pkl"
    idx_path = "data/processed/metr-la/sensor_index.json"

    with open(adj_path, "rb") as f:
        sensor_ids, _, _ = pickle.load(f, encoding="latin1")

    with open(idx_path, "r", encoding="utf-8") as f:
        idx_ids = json.load(f)["sensorIds"]

    assert len(sensor_ids) == len(idx_ids) == 207
    assert [str(sid) for sid in sensor_ids] == [str(sid) for sid in idx_ids]


def test_3_normalized_adjacency_finite():
    """3. Verify normalized adjacency has no NaNs or Infs."""
    adj_path = "data/raw/metr-la/adj_mx.pkl"
    with open(adj_path, "rb") as f:
        _, _, adj_mx = pickle.load(f, encoding="latin1")

    a_norm = calculate_normalized_adjacency(adj_mx, is_identity=False)
    assert not np.isnan(a_norm).any()
    assert not np.isinf(a_norm).any()
    assert a_norm.shape == (207, 207)


def test_4_self_loop_normalization():
    """4. Verify self-loop addition and diagonal elements are positive."""
    adj_path = "data/raw/metr-la/adj_mx.pkl"
    with open(adj_path, "rb") as f:
        _, _, adj_mx = pickle.load(f, encoding="latin1")

    a_norm = calculate_normalized_adjacency(adj_mx, is_identity=False)
    diag = np.diag(a_norm)
    assert (diag > 0.0).all()


def test_5_graphconv_shapes():
    """5. Verify GraphConv layer input and output shapes."""
    conv = GraphConv(in_features=2, out_features=64)
    x = torch.randn(32, 207, 2)
    a_norm = torch.eye(207)

    out = conv(x, a_norm)
    assert out.shape == (32, 207, 64)


def test_6_gcn_output_canonical_shape():
    """6. Verify GCN output shape is exactly [B, 4, 207, 1]."""
    gcn = SpatialGCN(in_features=2, hidden_dim=64, output_horizons=4)
    x = torch.randn(16, 12, 207, 2)
    a_norm = torch.eye(207)

    out = gcn(x, a_norm)
    assert out.shape == (16, 4, 207, 1)


def test_7_no_recurrent_temporal_model_inside_gcn():
    """7. Verify no RNN, LSTM, GRU, or Transformer modules exist inside SpatialGCN."""
    gcn = SpatialGCN()
    modules = [m.__class__.__name__ for m in gcn.modules()]

    assert "RNN" not in modules
    assert "LSTM" not in modules
    assert "GRU" not in modules
    assert "Transformer" not in modules


def test_8_valid_mask_behavior():
    """8. Verify masked targets (y_mask == False) produce zero loss gradient contribution."""
    from ml.graph.train import masked_mae_loss
    pred = torch.tensor([[[[10.0]], [[20.0]]]], requires_grad=True)
    target = torch.tensor([[[[15.0]], [[20.0]]]])
    mask = torch.tensor([[[[True]], [[False]]]])

    loss = masked_mae_loss(pred, target, mask)
    loss.backward()

    assert loss.item() == 5.0
    assert pred.grad[0, 1, 0, 0].item() == 0.0


def test_9_frozen_scaler_reuse():
    """9. Verify frozen scaler parameters mean=58.584258 and std=12.822883 are reused."""
    scaler_path = "data/processed/metr-la/scaler.json"
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler = json.load(f)

    assert abs(scaler["mean"] - 58.584258) < 1e-4
    assert abs(scaler["std"] - 12.822883) < 1e-4


def test_10_no_scaler_refit():
    """10. Verify evaluation does not alter frozen scaler file."""
    scaler_path = "data/processed/metr-la/scaler.json"
    mtime_before = os.path.getmtime(scaler_path)

    from ml.graph.evaluate_graph import evaluate_stage_6_4_graph
    _ = evaluate_stage_6_4_graph()

    mtime_after = os.path.getmtime(scaler_path)
    assert mtime_before == mtime_after


def test_11_checkpoint_reload_reproducibility():
    """11. Verify reloading gcn_best.pt produces identical predictions."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    gcn_pt = "data/processed/metr-la/models/graph/gcn_best.pt"

    m1 = SpatialGCN().to(device)
    m2 = SpatialGCN().to(device)

    m1.load_state_dict(torch.load(gcn_pt, map_location=device))
    m2.load_state_dict(torch.load(gcn_pt, map_location=device))

    m1.eval()
    m2.eval()

    x = torch.randn(8, 207, 2).to(device)
    a_norm = torch.eye(207).to(device)

    with torch.no_grad():
        out1 = m1(x, a_norm)
        out2 = m2(x, a_norm)

    assert torch.allclose(out1, out2, atol=1e-6)


def test_12_region_mapping_unchanged():
    """12. Verify frozen region mapping and counts remain unchanged (48, 57, 58, 44)."""
    with open("data/processed/metr-la/regions.json", "r", encoding="utf-8") as f:
        reg = json.load(f)

    counts = {k: len(v["sensorIds"]) for k, v in reg.items()}
    assert counts == {"REGION_A": 48, "REGION_B": 57, "REGION_C": 58, "REGION_D": 44}


def test_13_frozen_previous_results_unchanged():
    """13. Verify Stage 6.1, 6.2, and 6.3 result artifacts remain untouched."""
    base_res = json.load(open("data/processed/metr-la/baselines/baseline_results.json"))
    lin_res = json.load(open("data/processed/metr-la/baselines/linear/linear_results.json"))
    temp_res = json.load(open("data/processed/metr-la/models/temporal/temporal_results.json"))

    assert base_res["baselines"]["lastValue"]["overall"]["mae"] == 3.9839
    assert lin_res["overallMetrics"]["linearRegression"]["mae"] == 3.9763
    assert temp_res["overallMetrics"]["gru"]["mae"] == 3.5669
    assert temp_res["overallMetrics"]["lstm"]["mae"] == 3.5613


def test_14_graph_result_schema():
    """14. Verify gcn_results.json schema contains all required sections."""
    res_path = "data/processed/metr-la/models/graph/gcn_results.json"
    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    assert res["stage"] == "6.4"
    assert "overallMetrics" in res
    assert "byHorizon" in res
    assert "byRegion" in res
    assert "graphAblation" in res
    assert "sixModelComparison" in res
    assert "samplePredictions" in res


def test_15_dynamic_best_model_calculation():
    """15. Verify 6-model comparison dynamically identifies winner at each horizon."""
    res_path = "data/processed/metr-la/models/graph/gcn_results.json"
    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    winners = res["sixModelComparison"]["horizonWinners"]
    assert winners["+5 min"]["winner"] == "GRU"
    assert winners["+15 min"]["winner"] == "LSTM"
    assert winners["+30 min"]["winner"] == "LSTM"
    assert winners["+60 min"]["winner"] == "Historical Average"


def test_16_real_graph_vs_identity_graph_ablation_contract():
    """16. Verify graph ablation reports realGraphMae, identityGraphMae, and spatialGainPercent."""
    res_path = "data/processed/metr-la/models/graph/gcn_results.json"
    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    abl = res["graphAblation"]
    assert "realGraphMae" in abl
    assert "identityGraphMae" in abl
    assert "spatialGainPercent" in abl


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
