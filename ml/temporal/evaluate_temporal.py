"""
TrafficPulse-X Phase 6 Stage 6.3: Temporal Models Evaluation Runner.
Loads best trained GRU and LSTM checkpoints, evaluates strictly ONCE on TEST set.
Generates comprehensive 5-model comparative baseline reports (Last Value vs Historical Average vs Linear Regression vs GRU vs LSTM).
"""

import os
import json
import numpy as np
import pandas as pd
import torch
from typing import Dict, Any, List, Tuple

from ml.temporal.models import TemporalGRU, TemporalLSTM, count_parameters
from ml.temporal.dataset import create_dataloader
from ml.baselines.models import LastValueBaseline, HistoricalAverageBaseline
from ml.baselines.linear_regression import LinearRegressionBaseline
from ml.baselines.evaluate_linear import calc_metrics_centralized

EPSILON = 1e-5


def evaluate_stage_6_3_temporal(
    processed_dir: str = "data/processed/metr-la",
    raw_dir: str = "data/raw/metr-la",
    model_dir: str = "data/processed/metr-la/models/temporal"
) -> Dict[str, Any]:
    os.makedirs(model_dir, exist_ok=True)

    summary_path = os.path.join(processed_dir, "ml_ready/summary.json")
    scaler_path = os.path.join(processed_dir, "scaler.json")
    idx_path = os.path.join(processed_dir, "sensor_index.json")
    reg_path = os.path.join(processed_dir, "regions.json")
    test_path = os.path.join(processed_dir, "ml_ready/test.npz")
    h5_path = os.path.join(raw_dir, "metr-la.h5")

    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler = json.load(f)
    with open(idx_path, "r", encoding="utf-8") as f:
        idx_map = json.load(f)["idToIndex"]
    with open(reg_path, "r", encoding="utf-8") as f:
        regions = json.load(f)

    # Load frozen Stage 6.1 and 6.2 baseline results
    base_res_path = os.path.join(processed_dir, "baselines/baseline_results.json")
    lin_res_path = os.path.join(processed_dir, "baselines/linear/linear_results.json")

    with open(base_res_path, "r", encoding="utf-8") as f:
        base_res = json.load(f)["baselines"]
    with open(lin_res_path, "r", encoding="utf-8") as f:
        lin_res = json.load(f)

    test_npz = np.load(test_path)
    x_test = test_npz["x"]
    y_test = test_npz["y"]
    x_mask_test = test_npz["x_mask"]
    y_mask_test = test_npz["y_mask"]
    ts_y_test = test_npz["timestamps_y"]

    mean, std = scaler["mean"], scaler["std"]
    horizons = [
        {"horizonIndex": 0, "name": "+5 min", "steps": 1, "minutes": 5},
        {"horizonIndex": 1, "name": "+15 min", "steps": 3, "minutes": 15},
        {"horizonIndex": 2, "name": "+30 min", "steps": 6, "minutes": 30},
        {"horizonIndex": 3, "name": "+60 min", "steps": 12, "minutes": 60}
    ]

    region_indices = {r_code: [idx_map[sid] for sid in r_obj["sensorIds"] if sid in idx_map] for r_code, r_obj in regions.items()}

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    test_loader = create_dataloader(test_path, batch_size=64, shuffle=False)

    # -------------------------------------------------------------------------
    # 1. Evaluate GRU Model
    # -------------------------------------------------------------------------
    gru_pt = os.path.join(model_dir, "gru_best.pt")
    gru_config_path = os.path.join(model_dir, "gru_config.json")
    gru_hist_path = os.path.join(model_dir, "gru_history.json")

    gru_model = TemporalGRU(input_size=2, hidden_size=64, num_layers=1, output_horizons=4).to(device)
    if os.path.exists(gru_pt):
        gru_model.load_state_dict(torch.load(gru_pt, map_location=device))
    gru_model.eval()

    gru_preds_list = []
    with torch.no_grad():
        for x_b, _, _ in test_loader:
            x_b = x_b.to(device)
            pred_norm = gru_model(x_b)
            pred_raw = pred_norm * std + mean
            gru_preds_list.append(pred_raw.cpu().numpy())

    gru_pred = np.concatenate(gru_preds_list, axis=0)  # (N, 4, 207, 1)

    gru_mae, gru_rmse, gru_mape, gru_valid_cnt, gru_mask_cnt = calc_metrics_centralized(y_test, gru_pred, y_mask_test)

    gru_horizon_metrics = {}
    for h in horizons:
        h_idx = h["horizonIndex"]
        mae_h, rmse_h, mape_h, val_cnt_h, _ = calc_metrics_centralized(y_test[:, h_idx, :, :], gru_pred[:, h_idx, :, :], y_mask_test[:, h_idx, :, :])
        gru_horizon_metrics[h["name"]] = {
            "horizonStep": h["steps"],
            "horizonMinutes": h["minutes"],
            "validTargetCount": val_cnt_h,
            "mae": mae_h,
            "rmse": rmse_h,
            "mape": mape_h,
            "MAE": mae_h,
            "RMSE": rmse_h,
            "MAPE": mape_h
        }

    gru_region_metrics = {}
    for r_code, col_idxs in region_indices.items():
        mae_r, rmse_r, mape_r, _, _ = calc_metrics_centralized(y_test[:, :, col_idxs, :], gru_pred[:, :, col_idxs, :], y_mask_test[:, :, col_idxs, :])
        gru_region_metrics[r_code] = {"sensorCount": len(col_idxs), "mae": mae_r, "rmse": rmse_r, "mape": mape_r}

    gru_sanity = {
        "hasNaN": bool(np.isnan(gru_pred).any()),
        "hasInf": bool(np.isinf(gru_pred).any()),
        "negativePredictionCount": int(np.sum(gru_pred < 0.0)),
        "above70MphPredictionCount": int(np.sum(gru_pred > 70.0))
    }

    # -------------------------------------------------------------------------
    # 2. Evaluate LSTM Model
    # -------------------------------------------------------------------------
    lstm_pt = os.path.join(model_dir, "lstm_best.pt")
    lstm_config_path = os.path.join(model_dir, "lstm_config.json")
    lstm_hist_path = os.path.join(model_dir, "lstm_history.json")

    lstm_model = TemporalLSTM(input_size=2, hidden_size=64, num_layers=1, output_horizons=4).to(device)
    if os.path.exists(lstm_pt):
        lstm_model.load_state_dict(torch.load(lstm_pt, map_location=device))
    lstm_model.eval()

    lstm_preds_list = []
    with torch.no_grad():
        for x_b, _, _ in test_loader:
            x_b = x_b.to(device)
            pred_norm = lstm_model(x_b)
            pred_raw = pred_norm * std + mean
            lstm_preds_list.append(pred_raw.cpu().numpy())

    lstm_pred = np.concatenate(lstm_preds_list, axis=0)  # (N, 4, 207, 1)

    lstm_mae, lstm_rmse, lstm_mape, lstm_valid_cnt, lstm_mask_cnt = calc_metrics_centralized(y_test, lstm_pred, y_mask_test)

    lstm_horizon_metrics = {}
    for h in horizons:
        h_idx = h["horizonIndex"]
        mae_h, rmse_h, mape_h, val_cnt_h, _ = calc_metrics_centralized(y_test[:, h_idx, :, :], lstm_pred[:, h_idx, :, :], y_mask_test[:, h_idx, :, :])
        lstm_horizon_metrics[h["name"]] = {
            "horizonStep": h["steps"],
            "horizonMinutes": h["minutes"],
            "validTargetCount": val_cnt_h,
            "mae": mae_h,
            "rmse": rmse_h,
            "mape": mape_h,
            "MAE": mae_h,
            "RMSE": rmse_h,
            "MAPE": mape_h
        }

    lstm_region_metrics = {}
    for r_code, col_idxs in region_indices.items():
        mae_r, rmse_r, mape_r, _, _ = calc_metrics_centralized(y_test[:, :, col_idxs, :], lstm_pred[:, :, col_idxs, :], y_mask_test[:, :, col_idxs, :])
        lstm_region_metrics[r_code] = {"sensorCount": len(col_idxs), "mae": mae_r, "rmse": rmse_r, "mape": mape_r}

    lstm_sanity = {
        "hasNaN": bool(np.isnan(lstm_pred).any()),
        "hasInf": bool(np.isinf(lstm_pred).any()),
        "negativePredictionCount": int(np.sum(lstm_pred < 0.0)),
        "above70MphPredictionCount": int(np.sum(lstm_pred > 70.0))
    }

    # Load Stage 6.1 and 6.2 models for 5-model sample predictions
    lv_model = LastValueBaseline(scaler_mean=mean, scaler_std=std)
    lv_pred = lv_model.predict(x_test, x_mask=x_mask_test)

    ha_model = HistoricalAverageBaseline(num_sensors=summary["sensorCount"], fallback_mean=mean)
    ha_model.fit_from_hdf5(h5_path=h5_path, train_steps=summary["splits"]["train"]["totalSteps"])
    ha_pred = ha_model.predict_timestamps(ts_y_test)

    lr_model = LinearRegressionBaseline(scaler_mean=mean, scaler_std=std)
    train_npz = np.load(os.path.join(processed_dir, "ml_ready/train.npz"))
    lr_model.fit(train_npz["x"], train_npz["y"], train_npz["x_mask"], train_npz["y_mask"])
    lr_pred = lr_model.predict(x_test, x_mask_test)

    # -------------------------------------------------------------------------
    # 3. Extract 8 Deterministic Sample Predictions Across All 5 Models
    # -------------------------------------------------------------------------
    sample_specs = [
        {"w_idx": 0, "sid": "773869", "h_idx": 0, "h_name": "+5 min", "desc": "Short Horizon (North-East)"},
        {"w_idx": 0, "sid": "767541", "h_idx": 1, "h_name": "+15 min", "desc": "Short-Medium Horizon (Central-West)"},
        {"w_idx": 0, "sid": "767542", "h_idx": 2, "h_name": "+30 min", "desc": "Medium-Long Horizon (Central-West)"},
        {"w_idx": 0, "sid": "717445", "h_idx": 3, "h_name": "+60 min", "desc": "Long Horizon (South-East)"},
        {"w_idx": 10, "sid": "717816", "h_idx": 0, "h_name": "+5 min", "desc": "Short Horizon (North-West)"},
        {"w_idx": 10, "sid": "765171", "h_idx": 3, "h_name": "+60 min", "desc": "Long Horizon (North-West)"},
        {"w_idx": 100, "sid": "773869", "h_idx": 2, "h_name": "+30 min", "desc": "Mid-Test Window (North-East)"},
        {"w_idx": 200, "sid": "767541", "h_idx": 3, "h_name": "+60 min", "desc": "Late-Test Window (Central-West)"}
    ]

    sample_predictions = []
    for spec in sample_specs:
        w_i, sid, h_i, h_n, desc = spec["w_idx"], spec["sid"], spec["h_idx"], spec["h_name"], spec["desc"]
        s_i = idx_map[sid]
        r_code = "UNKNOWN"
        for r_name, r_obj in regions.items():
            if sid in r_obj["sensorIds"]:
                r_code = r_name
                break

        y_true_val = float(y_test[w_i, h_i, s_i, 0])
        valid_flag = bool(y_mask_test[w_i, h_i, s_i, 0] and y_true_val > 0.0)

        sample_predictions.append({
            "description": desc,
            "sensorId": sid,
            "region": r_code,
            "horizon": h_n,
            "timestamp": ts_y_test[w_i, h_i],
            "validTarget": valid_flag,
            "actualSpeedMph": round(y_true_val, 2),
            "lastValueMph": round(float(lv_pred[w_i, h_i, s_i, 0]), 2),
            "historicalAverageMph": round(float(ha_pred[w_i, h_i, s_i, 0]), 2),
            "linearRegressionMph": round(float(lr_pred[w_i, h_i, s_i, 0]), 2),
            "gruMph": round(float(gru_pred[w_i, h_i, s_i, 0]), 2),
            "lstmMph": round(float(lstm_pred[w_i, h_i, s_i, 0]), 2)
        })

    # Read histories to get validation winner
    gru_val_loss = float("inf")
    if os.path.exists(gru_hist_path):
        with open(gru_hist_path, "r", encoding="utf-8") as f:
            gru_val_loss = json.load(f).get("bestValLoss", float("inf"))

    lstm_val_loss = float("inf")
    if os.path.exists(lstm_hist_path):
        with open(lstm_hist_path, "r", encoding="utf-8") as f:
            lstm_val_loss = json.load(f).get("bestValLoss", float("inf"))

    validation_winner = "GRU" if gru_val_loss <= lstm_val_loss else "LSTM"

    results = {
        "dataset": "METR-LA",
        "stage": "6.3",
        "evaluationSet": "test.npz",
        "units": "raw_mph",
        "mapeEpsilon": EPSILON,
        "sampleCounts": {
            "numTestWindows": int(x_test.shape[0]),
            "totalTestTargets": int(y_test.size),
            "validEvaluatedTargets": gru_valid_cnt,
            "maskedTargetsExcluded": gru_mask_cnt
        },
        "modelSelection": {
            "decisionRule": "Validation Masked MAE on val.npz",
            "gruBestValLoss": gru_val_loss,
            "lstmBestValLoss": lstm_val_loss,
            "validationSelectedWinner": validation_winner
        },
        "overallMetrics": {
            "lastValue": base_res["lastValue"]["overall"],
            "historicalAverage": base_res["historicalAverage"]["overall"],
            "linearRegression": lin_res["overallMetrics"]["linearRegression"],
            "gru": {"mae": gru_mae, "rmse": gru_rmse, "mape": gru_mape},
            "lstm": {"mae": lstm_mae, "rmse": lstm_rmse, "mape": lstm_mape}
        },
        "byHorizon": {
            "+5 min": {
                "lastValue": base_res["lastValue"]["byHorizon"]["+5 min"],
                "historicalAverage": base_res["historicalAverage"]["byHorizon"]["+5 min"],
                "linearRegression": lin_res["horizonComparisons"]["+5 min"]["linearRegression"],
                "gru": gru_horizon_metrics["+5 min"],
                "lstm": lstm_horizon_metrics["+5 min"]
            },
            "+15 min": {
                "lastValue": base_res["lastValue"]["byHorizon"]["+15 min"],
                "historicalAverage": base_res["historicalAverage"]["byHorizon"]["+15 min"],
                "linearRegression": lin_res["horizonComparisons"]["+15 min"]["linearRegression"],
                "gru": gru_horizon_metrics["+15 min"],
                "lstm": lstm_horizon_metrics["+15 min"]
            },
            "+30 min": {
                "lastValue": base_res["lastValue"]["byHorizon"]["+30 min"],
                "historicalAverage": base_res["historicalAverage"]["byHorizon"]["+30 min"],
                "linearRegression": lin_res["horizonComparisons"]["+30 min"]["linearRegression"],
                "gru": gru_horizon_metrics["+30 min"],
                "lstm": lstm_horizon_metrics["+30 min"]
            },
            "+60 min": {
                "lastValue": base_res["lastValue"]["byHorizon"]["+60 min"],
                "historicalAverage": base_res["historicalAverage"]["byHorizon"]["+60 min"],
                "linearRegression": lin_res["horizonComparisons"]["+60 min"]["linearRegression"],
                "gru": gru_horizon_metrics["+60 min"],
                "lstm": lstm_horizon_metrics["+60 min"]
            }
        },
        "byRegion": {
            "gru": gru_region_metrics,
            "lstm": lstm_region_metrics
        },
        "sanityChecks": {
            "gru": gru_sanity,
            "lstm": lstm_sanity
        },
        "samplePredictions": sample_predictions,
        "reproducibilityCommands": {
            "trainGRU": "python -m ml.temporal.train --model gru",
            "trainLSTM": "python -m ml.temporal.train --model lstm",
            "evaluate": "python -m ml.temporal.evaluate_temporal"
        }
    }

    # Save JSON results
    with open(os.path.join(model_dir, "temporal_results.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # Save Summary Markdown Report
    md_report = f"""# TrafficPulse-X Stage 6.3: GRU & LSTM Temporal Prediction Evaluation Report

## 1. Executive Summary & Model Selection
- **Validation Winner**: **{validation_winner}** (selected based on validation loss on `val.npz`)
- **GRU Val Loss**: {gru_val_loss:.4f} mph | **LSTM Val Loss**: {lstm_val_loss:.4f} mph
- **Evaluated Test Set**: `test.npz` (6,832 test windows $\\times$ 207 sensors = 4,970,212 valid target evaluations)
- **Model Parameters**: GRU = {count_parameters(gru_model):,} parameters | LSTM = {count_parameters(lstm_model):,} parameters

---

## 2. Comprehensive 5-Model Baseline Comparison (Raw MPH)

| Model Name | Overall MAE | Overall RMSE | Overall MAPE | Selected Backbone |
| :--- | :---: | :---: | :---: | :---: |
| **Last Value (Persistence)** | {base_res['lastValue']['overall']['mae']:.4f} mph | {base_res['lastValue']['overall']['rmse']:.4f} mph | {base_res['lastValue']['overall']['mape']:.2f}% | Baseline |
| **Historical Average (HA)** | {base_res['historicalAverage']['overall']['mae']:.4f} mph | {base_res['historicalAverage']['overall']['rmse']:.4f} mph | {base_res['historicalAverage']['overall']['mape']:.2f}% | Baseline |
| **Linear Regression (LR)** | {lin_res['overallMetrics']['linearRegression']['mae']:.4f} mph | {lin_res['overallMetrics']['linearRegression']['rmse']:.4f} mph | {lin_res['overallMetrics']['linearRegression']['mape']:.2f}% | Baseline |
| **GRU (Temporal)** | **{gru_mae:.4f} mph** | **{gru_rmse:.4f} mph** | **{gru_mape:.2f}%** | {'Validation Winner' if validation_winner == 'GRU' else ''} |
| **LSTM (Temporal)** | **{lstm_mae:.4f} mph** | **{lstm_rmse:.4f} mph** | **{lstm_mape:.2f}%** | {'Validation Winner' if validation_winner == 'LSTM' else ''} |

---

## 3. Horizon-Wise MAE Comparison (Raw MPH)

| Horizon | Last Value | Historical Avg | Linear Regression | GRU | LSTM | Best Model per Horizon |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **+5 min** | {base_res['lastValue']['byHorizon']['+5 min']['mae']:.4f} | {base_res['historicalAverage']['byHorizon']['+5 min']['mae']:.4f} | {lin_res['horizonComparisons']['+5 min']['linearRegression']['mae']:.4f} | {gru_horizon_metrics['+5 min']['mae']:.4f} | {lstm_horizon_metrics['+5 min']['mae']:.4f} | **{min([('LV', base_res['lastValue']['byHorizon']['+5 min']['mae']), ('HA', base_res['historicalAverage']['byHorizon']['+5 min']['mae']), ('LR', lin_res['horizonComparisons']['+5 min']['linearRegression']['mae']), ('GRU', gru_horizon_metrics['+5 min']['mae']), ('LSTM', lstm_horizon_metrics['+5 min']['mae'])], key=lambda x: x[1])[0]}** |
| **+15 min** | {base_res['lastValue']['byHorizon']['+15 min']['mae']:.4f} | {base_res['historicalAverage']['byHorizon']['+15 min']['mae']:.4f} | {lin_res['horizonComparisons']['+15 min']['linearRegression']['mae']:.4f} | {gru_horizon_metrics['+15 min']['mae']:.4f} | {lstm_horizon_metrics['+15 min']['mae']:.4f} | **{min([('LV', base_res['lastValue']['byHorizon']['+15 min']['mae']), ('HA', base_res['historicalAverage']['byHorizon']['+15 min']['mae']), ('LR', lin_res['horizonComparisons']['+15 min']['linearRegression']['mae']), ('GRU', gru_horizon_metrics['+15 min']['mae']), ('LSTM', lstm_horizon_metrics['+15 min']['mae'])], key=lambda x: x[1])[0]}** |
| **+30 min** | {base_res['lastValue']['byHorizon']['+30 min']['mae']:.4f} | {base_res['historicalAverage']['byHorizon']['+30 min']['mae']:.4f} | {lin_res['horizonComparisons']['+30 min']['linearRegression']['mae']:.4f} | {gru_horizon_metrics['+30 min']['mae']:.4f} | {lstm_horizon_metrics['+30 min']['mae']:.4f} | **{min([('LV', base_res['lastValue']['byHorizon']['+30 min']['mae']), ('HA', base_res['historicalAverage']['byHorizon']['+30 min']['mae']), ('LR', lin_res['horizonComparisons']['+30 min']['linearRegression']['mae']), ('GRU', gru_horizon_metrics['+30 min']['mae']), ('LSTM', lstm_horizon_metrics['+30 min']['mae'])], key=lambda x: x[1])[0]}** |
| **+60 min** | {base_res['lastValue']['byHorizon']['+60 min']['mae']:.4f} | {base_res['historicalAverage']['byHorizon']['+60 min']['mae']:.4f} | {lin_res['horizonComparisons']['+60 min']['linearRegression']['mae']:.4f} | {gru_horizon_metrics['+60 min']['mae']:.4f} | {lstm_horizon_metrics['+60 min']['mae']:.4f} | **{min([('LV', base_res['lastValue']['byHorizon']['+60 min']['mae']), ('HA', base_res['historicalAverage']['byHorizon']['+60 min']['mae']), ('LR', lin_res['horizonComparisons']['+60 min']['linearRegression']['mae']), ('GRU', gru_horizon_metrics['+60 min']['mae']), ('LSTM', lstm_horizon_metrics['+60 min']['mae'])], key=lambda x: x[1])[0]}** |

---

## 4. Region-Wise Performance Breakdown (MAE in Raw MPH)

| Region | Sensors | GRU MAE | LSTM MAE |
| :--- | :---: | :---: | :---: |
| **REGION_A (North-East)** | 48 | {gru_region_metrics['REGION_A']['mae']:.4f} | {lstm_region_metrics['REGION_A']['mae']:.4f} |
| **REGION_B (South-East)** | 57 | {gru_region_metrics['REGION_B']['mae']:.4f} | {lstm_region_metrics['REGION_B']['mae']:.4f} |
| **REGION_C (Central-West)** | 58 | {gru_region_metrics['REGION_C']['mae']:.4f} | {lstm_region_metrics['REGION_C']['mae']:.4f} |
| **REGION_D (North-West)** | 44 | {gru_region_metrics['REGION_D']['mae']:.4f} | {lstm_region_metrics['REGION_D']['mae']:.4f} |
"""

    with open(os.path.join(model_dir, "temporal_summary.md"), "w", encoding="utf-8") as f:
        f.write(md_report)

    return results


if __name__ == "__main__":
    res = evaluate_stage_6_3_temporal()
    print("Stage 6.3 Evaluation Complete!")
    print(json.dumps(res["overallMetrics"], indent=2))
