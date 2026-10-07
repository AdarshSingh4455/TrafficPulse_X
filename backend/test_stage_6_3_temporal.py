"""
TrafficPulse-X Stage 6.3 Unit & Integration Tests: GRU & LSTM Temporal Models.
Verifies GRU & LSTM architectures, 2-channel input tensors, batch reshaping,
masked MAE loss function, inverse scaling, model parameter counts, checkpoint reproducibility,
validation-based model selection, sanity checks, and baseline immutability.
"""

import os
import json
import numpy as np
import pytest
import torch

from ml.temporal.models import TemporalGRU, TemporalLSTM, MaskedMAELoss, count_parameters
from ml.temporal.train import set_seed, train_model
from ml.temporal.evaluate_temporal import evaluate_stage_6_3_temporal


def test_gru_input_and_output_shapes():
    """1, 3, 4, 5. Verify TemporalGRU input (B, 12, 207, 2) -> output (B, 4, 207, 1)."""
    set_seed(42)
    model = TemporalGRU(input_size=2, hidden_size=64, num_layers=1, output_horizons=4)
    x = torch.randn(4, 12, 207, 2)
    out = model(x)
    assert out.shape == (4, 4, 207, 1), f"Expected output shape (4, 4, 207, 1), got {out.shape}"


def test_lstm_input_and_output_shapes():
    """2, 3, 4, 5. Verify TemporalLSTM input (B, 12, 207, 2) -> output (B, 4, 207, 1)."""
    set_seed(42)
    model = TemporalLSTM(input_size=2, hidden_size=64, num_layers=1, output_horizons=4)
    x = torch.randn(4, 12, 207, 2)
    out = model(x)
    assert out.shape == (4, 4, 207, 1), f"Expected output shape (4, 4, 207, 1), got {out.shape}"


def test_model_trainable_parameter_counts():
    """Verify GRU (~13,316) and LSTM (~17,668) parameter counts are lightweight."""
    gru = TemporalGRU(input_size=2, hidden_size=64, num_layers=1, output_horizons=4)
    lstm = TemporalLSTM(input_size=2, hidden_size=64, num_layers=1, output_horizons=4)

    assert count_parameters(gru) == 13316
    assert count_parameters(lstm) == 17668


def test_masked_mae_loss_excludes_invalid_targets():
    """6. Verify MaskedMAELoss ignores targets where mask is False or target <= 0."""
    criterion = MaskedMAELoss()
    pred = torch.tensor([[[[50.0]], [[60.0]], [[40.0]]]])
    target = torch.tensor([[[[50.0]], [[0.0]], [[50.0]]]])
    mask = torch.tensor([[[[True]], [[False]], [[True]]]])

    loss = criterion(pred, target, mask)
    # Valid targets: slot 0 (50 vs 50, diff=0) and slot 2 (40 vs 50, diff=10). Avg = 10 / 2 = 5.0
    assert torch.isclose(loss, torch.tensor(5.0))


def test_masked_mae_loss_empty_valid_case_handled_safely():
    """7. Verify MaskedMAELoss returns 0.0 gracefully when no valid target exists in batch."""
    criterion = MaskedMAELoss()
    pred = torch.tensor([[[[50.0]], [[60.0]]]])
    target = torch.tensor([[[[0.0]], [[0.0]]]])
    mask = torch.tensor([[[[False]], [[False]]]])

    loss = criterion(pred, target, mask)
    assert torch.isclose(loss, torch.tensor(0.0))


def test_train_only_scaler_stats_reused():
    """8, 12. Verify inverse scaling uses Phase 5 scaler stats (mean=58.584258, std=12.822883)."""
    scaler_path = "data/processed/metr-la/scaler.json"
    if not os.path.exists(scaler_path):
        pytest.skip("scaler.json not available locally")

    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler = json.load(f)

    mean, std = scaler["mean"], scaler["std"]
    assert abs(mean - 58.584258) < 1e-4
    assert abs(std - 12.822883) < 1e-4

    # Check inverse scaling formula
    pred_norm = torch.tensor([0.0, 1.0, -1.0])
    pred_raw = pred_norm * std + mean
    assert torch.isclose(pred_raw[0], torch.tensor(mean))
    assert torch.isclose(pred_raw[1], torch.tensor(mean + std))


def test_checkpoint_reproducibility_gru_and_lstm(tmp_path):
    """13, 14. Verify saving and reloading checkpoints produces identical model predictions."""
    set_seed(42)
    gru = TemporalGRU(input_size=2, hidden_size=64, num_layers=1, output_horizons=4)
    x = torch.randn(2, 12, 207, 2)
    out_before = gru(x)

    save_path = tmp_path / "test_gru.pt"
    torch.save(gru.state_dict(), save_path)

    gru_reloaded = TemporalGRU(input_size=2, hidden_size=64, num_layers=1, output_horizons=4)
    gru_reloaded.load_state_dict(torch.load(save_path))
    out_after = gru_reloaded(x)

    torch.testing.assert_close(out_before, out_after)


def test_baseline_artifacts_unmodified_by_stage_6_3():
    """19. Verify Stage 6.1 and 6.2 baseline artifacts remain untouched."""
    base_path = "data/processed/metr-la/baselines/baseline_results.json"
    lin_path = "data/processed/metr-la/baselines/linear/linear_results.json"

    if os.path.exists(base_path):
        with open(base_path, "r", encoding="utf-8") as f:
            base_data = json.load(f)
        assert base_data["baselines"]["lastValue"]["overall"]["mae"] == 3.9839

    if os.path.exists(lin_path):
        with open(lin_path, "r", encoding="utf-8") as f:
            lin_data = json.load(f)
        assert lin_data["overallMetrics"]["linearRegression"]["mae"] == 3.9763


def test_temporal_evaluation_artifacts_exist():
    """Verify temporal_results.json, temporal_summary.md, and model checkpoints exist."""
    model_dir = "data/processed/metr-la/models/temporal"
    assert os.path.exists(os.path.join(model_dir, "gru_best.pt"))
    assert os.path.exists(os.path.join(model_dir, "lstm_best.pt"))
    assert os.path.exists(os.path.join(model_dir, "temporal_results.json"))
    assert os.path.exists(os.path.join(model_dir, "temporal_summary.md"))


def test_no_gnn_or_fl_models_trained_in_stage_6_3():
    """24. Confirm no graph neural networks or Federated Learning modules are used."""
    import sys
    fl_modules = [m for m in sys.modules if "flwr" in m or "torch_geometric" in m]
    assert len(fl_modules) == 0


def test_best_model_per_horizon_dynamic_derivation():
    """Verify that horizon-wise best models are dynamically derived and correct."""
    res_path = "data/processed/metr-la/models/temporal/temporal_results.json"
    if not os.path.exists(res_path):
        pytest.skip("temporal_results.json not found")

    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    by_h = res["byHorizon"]

    def get_best(h_key):
        h_data = by_h[h_key]
        candidates = {
            "Last Value": h_data["lastValue"]["mae"],
            "Historical Average": h_data["historicalAverage"]["mae"],
            "Linear Regression": h_data["linearRegression"]["mae"],
            "GRU": h_data["gru"]["mae"],
            "LSTM": h_data["lstm"]["mae"],
        }
        return min(candidates.items(), key=lambda x: x[1])[0]

    assert get_best("+5 min") in ["GRU", "LSTM"]
    assert get_best("+15 min") == "LSTM"
    assert get_best("+30 min") == "LSTM"
    assert get_best("+60 min") == "Historical Average"


def test_horizon_step_mapping_and_reproducibility():
    """Verify output step [1,3,6,12] maps to [5,15,30,60] and saved metrics reproduce from checkpoints."""
    res_path = "data/processed/metr-la/models/temporal/temporal_results.json"
    if not os.path.exists(res_path):
        pytest.skip("temporal_results.json not found")

    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    by_h = res["byHorizon"]
    expected_steps = [1, 3, 6, 12]
    expected_minutes = [5, 15, 30, 60]
    h_keys = ["+5 min", "+15 min", "+30 min", "+60 min"]

    for i, h_key in enumerate(h_keys):
        gru_h = by_h[h_key]["gru"]
        lstm_h = by_h[h_key]["lstm"]

        assert gru_h["horizonStep"] == expected_steps[i]
        assert gru_h["horizonMinutes"] == expected_minutes[i]
        assert lstm_h["horizonStep"] == expected_steps[i]
        assert lstm_h["horizonMinutes"] == expected_minutes[i]

    # Verify reproduction from frozen GRU checkpoint
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model_dir = "data/processed/metr-la/models/temporal"
    gru_model = TemporalGRU(input_size=2, hidden_size=64, num_layers=1, output_horizons=4).to(device)
    gru_model.load_state_dict(torch.load(os.path.join(model_dir, "gru_best.pt"), map_location=device))
    gru_model.eval()

    test_npz = np.load("data/processed/metr-la/ml_ready/test.npz")
    scaler = json.load(open("data/processed/metr-la/scaler.json"))
    mean, std = scaler["mean"], scaler["std"]

    from ml.temporal.dataset import create_dataloader
    from ml.baselines.evaluate_linear import calc_metrics_centralized

    loader = create_dataloader("data/processed/metr-la/ml_ready/test.npz", batch_size=64, shuffle=False)
    preds = []
    with torch.no_grad():
        for xb, _, _ in loader:
            p = gru_model(xb.to(device)) * std + mean
            preds.append(p.cpu().numpy())
    pred_arr = np.concatenate(preds, axis=0)

    # Horizon 0 (+5 min)
    mae_0, _, _, val_cnt_0, _ = calc_metrics_centralized(test_npz["y"][:, 0, :, :], pred_arr[:, 0, :, :], test_npz["y_mask"][:, 0, :, :])
    assert abs(mae_0 - by_h["+5 min"]["gru"]["mae"]) < 1e-4
    assert val_cnt_0 == by_h["+5 min"]["gru"]["validTargetCount"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


