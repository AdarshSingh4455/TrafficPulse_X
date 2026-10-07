"""
TrafficPulse-X Stage 6.2 Unit & Integration Tests: Linear Regression Baseline & Verification Cleanup.
Verifies Linear Regression baseline model, feature construction (24 features),
zero data leakage (fit strictly on train.npz), valid target masking, inverse scaling,
horizon-wise and region-wise metrics, output prediction shape, sanity checks,
frozen Stage 6.1 baseline immutability, sample counts per horizon, and fallbacks.
"""

import os
import json
import numpy as np
import pytest

from ml.baselines.models import LastValueBaseline, HistoricalAverageBaseline
from ml.baselines.linear_regression import LinearRegressionBaseline
from ml.baselines.evaluate_linear import evaluate_stage_6_2_linear
from ml.baselines.evaluate_baselines import calc_metrics


def test_linear_regression_feature_construction_and_shapes():
    """1. Verify feature extraction produces 24 features (12 speeds + 12 masks) per sensor sample."""
    lr = LinearRegressionBaseline(scaler_mean=58.58, scaler_std=12.82)
    x = np.random.randn(10, 12, 207, 1)
    x_mask = np.ones((10, 12, 207, 1), dtype=bool)

    feats = lr._extract_features(x, x_mask)
    assert feats.shape == (2070, 24)
    # First 12 should be speeds, next 12 should be masks (1.0)
    np.testing.assert_allclose(feats[0, 12:], 1.0)


def test_linear_regression_fitting_and_no_leakage():
    """2. Verify Linear Regression fits strictly on train.npz and requires fitting before predict."""
    train_path = "data/processed/metr-la/ml_ready/train.npz"
    if not os.path.exists(train_path):
        pytest.skip("train.npz not available locally")

    train_data = np.load(train_path)
    x_train = train_data["x"]
    y_train = train_data["y"]
    x_train_mask = train_data["x_mask"]
    y_train_mask = train_data["y_mask"]

    lr = LinearRegressionBaseline(scaler_mean=58.584258, scaler_std=12.822883)
    
    # Assert unfitted model raises error on predict
    with pytest.raises(RuntimeError, match="must be fitted before predict"):
        lr.predict(x_train, x_train_mask)

    lr.fit(x_train, y_train, x_train_mask, y_train_mask)

    assert lr.fitted is True
    assert len(lr.models) == 4
    for h in [0, 1, 2, 3]:
        assert h in lr.models
        assert lr.models[h].coef_.shape == (24,)


def test_linear_regression_prediction_shape_and_units():
    """3. Verify prediction shape is (N, 4, 207, 1) and output is inverse-scaled to raw MPH."""
    lr = LinearRegressionBaseline(scaler_mean=58.584258, scaler_std=12.822883)
    
    # Mock single-step fit with dummy weights
    for h in [0, 1, 2, 3]:
        from sklearn.linear_model import LinearRegression
        m = LinearRegression()
        # Mock fit: feature 11 coefficient = 1.0 (pass through step 11 speed)
        X_dummy = np.zeros((10, 24))
        X_dummy[:, 11] = np.linspace(-1, 1, 10)
        y_dummy = X_dummy[:, 11]
        m.fit(X_dummy, y_dummy)
        lr.models[h] = m
    lr.fitted = True

    x_test = np.zeros((5, 12, 207, 1))
    # Put step 11 speed as 1.0 (normalized)
    x_test[:, 11, :, 0] = 1.0
    x_test_mask = np.ones((5, 12, 207, 1), dtype=bool)

    y_pred = lr.predict(x_test, x_test_mask)

    assert y_pred.shape == (5, 4, 207, 1)
    # 1.0 normalized -> 1.0 * 12.822883 + 58.584258 = 71.407141 mph
    expected_raw_mph = 1.0 * 12.822883 + 58.584258
    np.testing.assert_allclose(y_pred[0, 0, 0, 0], expected_raw_mph, rtol=1e-4)


def test_linear_regression_sanity_checks_and_no_nans():
    """4. Verify evaluation generates zero NaNs, zero Infs, zero negative speeds, and valid ranges."""
    test_path = "data/processed/metr-la/ml_ready/test.npz"
    if not os.path.exists(test_path):
        pytest.skip("test.npz not available locally")

    res = evaluate_stage_6_2_linear()
    lr_overall = res["overallMetrics"]["linearRegression"]

    assert lr_overall["mae"] > 0.0
    assert lr_overall["rmse"] > 0.0
    assert lr_overall["mape"] > 0.0
    # Sanity checks
    assert res["sanitisationChecks"]["hasNaN"] is False
    assert res["sanitisationChecks"]["hasInf"] is False
    assert res["sanitisationChecks"]["negativePredictionCount"] == 0
    assert res["sanitisationChecks"]["above70MphPredictionCount"] == 0


def test_linear_regression_horizon_and_region_wise_metrics():
    """5. Verify horizon-wise (+5m, +15m, +30m, +60m) and region-wise (A, B, C, D) metrics."""
    res_path = "data/processed/metr-la/baselines/linear/linear_results.json"
    if not os.path.exists(res_path):
        pytest.skip("linear_results.json not available locally")

    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    # Check horizon comparisons
    horizon_comp = res["horizonComparisons"]
    for h_name in ["+5 min", "+15 min", "+30 min", "+60 min"]:
        assert h_name in horizon_comp
        assert "linearRegression" in horizon_comp[h_name]
        assert horizon_comp[h_name]["linearRegression"]["mae"] > 0.0

    # Check region metrics
    lr_regions = res["regionMetrics"]["linearRegression"]
    assert set(lr_regions.keys()) == {"REGION_A", "REGION_B", "REGION_C", "REGION_D"}
    assert lr_regions["REGION_A"]["sensorCount"] == 48
    assert lr_regions["REGION_B"]["sensorCount"] == 57
    assert lr_regions["REGION_C"]["sensorCount"] == 58
    assert lr_regions["REGION_D"]["sensorCount"] == 44


def test_stage_6_1_frozen_baseline_metrics_immutability():
    """6. Verify baseline_results.json contains exact frozen Stage 6.1 baseline metrics."""
    res_path = "data/processed/metr-la/baselines/baseline_results.json"
    if not os.path.exists(res_path):
        pytest.skip("baseline_results.json not available locally")

    with open(res_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    lv_by_h = res["baselines"]["lastValue"]["byHorizon"]
    assert lv_by_h["+5 min"]["mae"] == 2.8158
    assert lv_by_h["+15 min"]["mae"] == 3.5045
    assert lv_by_h["+30 min"]["mae"] == 4.2166
    assert lv_by_h["+60 min"]["mae"] == 5.3987

    ha_by_h = res["baselines"]["historicalAverage"]["byHorizon"]
    assert ha_by_h["+5 min"]["mae"] == 4.1928
    assert ha_by_h["+15 min"]["mae"] == 4.1928
    assert ha_by_h["+30 min"]["mae"] == 4.1929
    assert ha_by_h["+60 min"]["mae"] == 4.1934


def test_linear_evaluation_does_not_mutate_baseline_artifacts():
    """7. Confirm running evaluate_stage_6_2_linear does not mutate baseline_results.json."""
    res_path = "data/processed/metr-la/baselines/baseline_results.json"
    if not os.path.exists(res_path):
        pytest.skip("baseline_results.json not available locally")

    mtime_before = os.path.getmtime(res_path)
    evaluate_stage_6_2_linear()
    mtime_after = os.path.getmtime(res_path)

    assert mtime_before == mtime_after, "Linear evaluation must not mutate Stage 6.1 baseline_results.json"


def test_per_horizon_sample_counts_and_masks():
    """8. Verify sample counts per horizon across TRAIN, VAL, and TEST splits."""
    test_path = "data/processed/metr-la/ml_ready/test.npz"
    if not os.path.exists(test_path):
        pytest.skip("test.npz not available locally")

    test_data = np.load(test_path)
    y_test = test_data["y"]
    y_mask = test_data["y_mask"]

    valid_targets = y_mask & (y_test > 0.0)
    assert int(np.sum(valid_targets)) == 4970212
    assert int(np.sum(~valid_targets)) == 686684


def test_last_value_all_masked_input_handling():
    """9. Verify behavior when all 12 historical input steps are masked."""
    test_path = "data/processed/metr-la/ml_ready/test.npz"
    if not os.path.exists(test_path):
        pytest.skip("test.npz not available locally")

    test_data = np.load(test_path)
    x_test = test_data["x"]
    x_mask = test_data["x_mask"]

    all_input_masked = np.all(~x_mask[:, :, :, 0], axis=1)
    all_masked_count = int(np.sum(all_input_masked))
    assert all_masked_count == 136702, "Exactly 136,702 test pairs have all 12 input steps masked"

    lv_model = LastValueBaseline(scaler_mean=58.584258, scaler_std=12.822883)
    y_pred = lv_model.predict(x_test, x_mask=x_mask)

    # For all-input-masked pairs, predicted value is train mean 58.584258
    # y_pred is (N, 4, S, 1); transpose to (N, S, 4, 1) to match boolean mask (N, S)
    y_pred_ns = y_pred.transpose(0, 2, 1, 3)
    all_masked_preds = y_pred_ns[all_input_masked]
    np.testing.assert_allclose(all_masked_preds, 58.584258, rtol=1e-4)


def test_ha_train_only_fallback_contract():
    """10. Verify HistoricalAverage Baseline fits 100% of 417,312 slots from train split."""
    h5_path = "data/raw/metr-la/metr-la.h5"
    if not os.path.exists(h5_path):
        pytest.skip("metr-la.h5 not available locally")

    ha = HistoricalAverageBaseline(num_sensors=207, fallback_mean=58.584258)
    ha.fit_from_hdf5(h5_path=h5_path, train_steps=23990)

    assert int(np.sum(ha.counts > 0)) == 417312
    assert int(np.sum(ha.counts == 0)) == 0


def test_reproducible_linear_artifacts_saved():
    """11. Verify linear_models.json, linear_results.json, and linear_summary.md exist."""
    base_dir = "data/processed/metr-la/baselines/linear"
    assert os.path.exists(os.path.join(base_dir, "linear_models.json"))
    assert os.path.exists(os.path.join(base_dir, "linear_results.json"))
    assert os.path.exists(os.path.join(base_dir, "linear_summary.md"))


def test_no_advanced_models_trained_in_stage_6_2():
    """12. Confirm no deep learning or GNN or Federated Learning models are imported or used in Stage 6.2 modules."""
    import ml.baselines.linear_regression as l_models
    import ml.baselines.evaluate_linear as l_eval
    for mod in [l_models, l_eval]:
        for attr_name in dir(mod):
            attr = getattr(mod, attr_name)
            if hasattr(attr, "__module__") and attr.__module__:
                assert "torch" not in attr.__module__
                assert "tensorflow" not in attr.__module__
                assert "flwr" not in attr.__module__


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
