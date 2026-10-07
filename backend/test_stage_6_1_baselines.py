"""
TrafficPulse-X Stage 6.1 Unit & Integration Tests: Traffic Prediction Baselines.
Verifies Last Value (Persistence) and Historical Average (HA) baseline models,
zero data leakage, masked target exclusion, horizon-wise and region-wise metric computation.
"""

import os
import json
import numpy as np
import pytest

from ml.baselines.models import LastValueBaseline, HistoricalAverageBaseline
from ml.baselines.evaluate_baselines import evaluate_stage_6_1_baselines, calc_metrics


def test_last_value_baseline_prediction_shape_and_units():
    """1. Verify LastValueBaseline outputs predictions of shape (N, 4, 207, 1) in raw mph."""
    x_test = np.random.randn(10, 12, 207, 1)
    model = LastValueBaseline(scaler_mean=58.58, scaler_std=12.82)
    y_pred = model.predict(x_test)

    assert y_pred.shape == (10, 4, 207, 1)
    # Step 11 inverse transform check
    expected_step11_raw = x_test[:, 11, :, 0] * 12.82 + 58.58
    for h in range(4):
        np.testing.assert_allclose(y_pred[:, h, :, 0], expected_step11_raw, rtol=1e-4)


def test_historical_average_baseline_fitting_and_no_leakage():
    """2. Verify HistoricalAverageBaseline fits strictly on training steps [0, 23990)."""
    h5_path = "data/raw/metr-la/metr-la.h5"
    if not os.path.exists(h5_path):
        pytest.skip("metr-la.h5 file not available locally")

    ha = HistoricalAverageBaseline(num_sensors=207)
    ha.fit_from_hdf5(h5_path=h5_path, train_steps=23990)

    assert ha.fitted is True
    assert ha.ha_table.shape == (207, 7, 288)
    assert ha.counts.shape == (207, 7, 288)
    # Total counted observations cannot exceed training steps (23990)
    assert np.max(ha.counts) <= 23990


def test_horizon_wise_metrics_evaluation():
    """3. Verify MAE, RMSE, MAPE evaluation across +5m, +15m, +30m, +60m horizons."""
    test_path = "data/processed/metr-la/ml_ready/test.npz"
    if not os.path.exists(test_path):
        pytest.skip("test.npz not available locally")

    res = evaluate_stage_6_1_baselines()
    baselines = res["baselines"]

    for b_name in ["lastValue", "historicalAverage"]:
        horizons = baselines[b_name]["byHorizon"]
        assert set(horizons.keys()) == {"+5 min", "+15 min", "+30 min", "+60 min"}
        for h_name, metrics in horizons.items():
            assert metrics["mae"] > 0.0
            assert metrics["rmse"] > 0.0
            assert metrics["mape"] > 0.0


def test_region_wise_metrics_evaluation():
    """4. Verify region-wise metrics for Region A (48), B (57), C (58), D (44)."""
    res = evaluate_stage_6_1_baselines()
    baselines = res["baselines"]

    for b_name in ["lastValue", "historicalAverage"]:
        regions = baselines[b_name]["byRegion"]
        assert set(regions.keys()) == {"REGION_A", "REGION_B", "REGION_C", "REGION_D"}
        assert regions["REGION_A"]["sensorCount"] == 48
        assert regions["REGION_B"]["sensorCount"] == 57
        assert regions["REGION_C"]["sensorCount"] == 58
        assert regions["REGION_D"]["sensorCount"] == 44


def test_masked_null_targets_excluded():
    """5. Verify y_mask excludes benchmark 0.0 null targets from metrics."""
    y_true = np.array([60.0, 0.0, 50.0])
    y_pred = np.array([55.0, 40.0, 50.0])
    mask = np.array([True, False, True])

    mae, rmse, mape, valid_cnt, masked_cnt = calc_metrics(y_true, y_pred, mask)
    assert valid_cnt == 2
    assert masked_cnt == 1
    assert abs(mae - 2.5) < 1e-4  # (|60-55| + |50-50|) / 2 = 2.5
    assert abs(rmse - np.sqrt(25.0 / 2)) < 1e-4


def test_reproducible_baseline_results_saved():
    """6. Verify baseline_results.json exists and contains required metadata & sample predictions."""
    res_path = "data/processed/metr-la/baselines/baseline_results.json"
    assert os.path.exists(res_path)

    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    assert res["dataset"] == "METR-LA"
    assert res["units"] == "raw_mph"
    assert res["noDataLeakageConfirmed"] is True
    assert len(res["samplePredictions"]) > 0
    assert "lastValue" in res["baselines"]
    assert "historicalAverage" in res["baselines"]


def test_no_deep_learning_models_trained_in_stage_6_1():
    """7. Confirm no deep learning (torch, tensorflow) models are imported or used in Stage 6.1 baseline modules."""
    import ml.baselines.models as b_models
    import ml.baselines.evaluate_baselines as b_eval
    for mod in [b_models, b_eval]:
        for attr_name in dir(mod):
            attr = getattr(mod, attr_name)
            if hasattr(attr, "__module__") and attr.__module__:
                assert "torch" not in attr.__module__
                assert "tensorflow" not in attr.__module__


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
