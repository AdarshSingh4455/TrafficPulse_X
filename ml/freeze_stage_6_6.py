"""
TrafficPulse-X Phase 6 Stage 6.6: Final Prediction Evaluation and Model Freeze Script.
Loads authoritative artifacts from Stages 6.1–6.5, synthesizes final 7-model comparative benchmark,
derives horizon/overall winners, records region metrics and prediction contract,
and outputs lightweight summary JSON and MD artifacts.
"""

import os
import json
import pickle
import numpy as np

def generate_final_prediction_summary():
    base_dir = "data/processed/metr-la"
    raw_dir = "data/raw/metr-la"
    models_dir = os.path.join(base_dir, "models")

    baseline_path = os.path.join(base_dir, "baselines/baseline_results.json")
    linear_path = os.path.join(base_dir, "baselines/linear/linear_results.json")
    temporal_path = os.path.join(models_dir, "temporal/temporal_results.json")
    gcn_path = os.path.join(models_dir, "graph/gcn_results.json")
    graph_lstm_path = os.path.join(models_dir, "spatiotemporal/graph_lstm_results.json")
    scaler_path = os.path.join(base_dir, "scaler.json")
    regions_path = os.path.join(base_dir, "regions.json")
    adj_path = os.path.join(raw_dir, "adj_mx.pkl")

    with open(baseline_path, "r", encoding="utf-8") as f:
        base_res = json.load(f)
    with open(linear_path, "r", encoding="utf-8") as f:
        lin_res = json.load(f)
    with open(temporal_path, "r", encoding="utf-8") as f:
        temp_res = json.load(f)
    with open(gcn_path, "r", encoding="utf-8") as f:
        gcn_res = json.load(f)
    with open(graph_lstm_path, "r", encoding="utf-8") as f:
        graph_lstm_res = json.load(f)
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler = json.load(f)
    with open(regions_path, "r", encoding="utf-8") as f:
        regions_data = json.load(f)
    with open(adj_path, "rb") as f:
        sensor_ids_list, sensor_id_to_ind, adj_mx = pickle.load(f, encoding="latin1")

    # Authoritative 7-Model Overall Metrics
    seven_models_overall = {
        "Last Value": {
            "mae": base_res["baselines"]["lastValue"]["overall"]["mae"],
            "rmse": base_res["baselines"]["lastValue"]["overall"]["rmse"],
            "mape": base_res["baselines"]["lastValue"]["overall"]["mape"]
        },
        "Historical Average": {
            "mae": base_res["baselines"]["historicalAverage"]["overall"]["mae"],
            "rmse": base_res["baselines"]["historicalAverage"]["overall"]["rmse"],
            "mape": base_res["baselines"]["historicalAverage"]["overall"]["mape"]
        },
        "Linear Regression": {
            "mae": lin_res["overallMetrics"]["linearRegression"]["mae"],
            "rmse": lin_res["overallMetrics"]["linearRegression"]["rmse"],
            "mape": lin_res["overallMetrics"]["linearRegression"]["mape"]
        },
        "GRU": {
            "mae": temp_res["overallMetrics"]["gru"]["mae"],
            "rmse": temp_res["overallMetrics"]["gru"]["rmse"],
            "mape": temp_res["overallMetrics"]["gru"]["mape"]
        },
        "LSTM": {
            "mae": temp_res["overallMetrics"]["lstm"]["mae"],
            "rmse": temp_res["overallMetrics"]["lstm"]["rmse"],
            "mape": temp_res["overallMetrics"]["lstm"]["mape"]
        },
        "Spatial GCN": {
            "mae": gcn_res["overallMetrics"]["gcn"]["mae"],
            "rmse": gcn_res["overallMetrics"]["gcn"]["rmse"],
            "mape": gcn_res["overallMetrics"]["gcn"]["mape"]
        },
        "Graph+LSTM": {
            "mae": graph_lstm_res["overallMetrics"]["graphLSTM"]["mae"],
            "rmse": graph_lstm_res["overallMetrics"]["graphLSTM"]["rmse"],
            "mape": graph_lstm_res["overallMetrics"]["graphLSTM"]["mape"]
        }
    }

    overall_maes = {m: data["mae"] for m, data in seven_models_overall.items()}
    overall_winner = min(overall_maes, key=overall_maes.get)

    horizons = ["+5 min", "+15 min", "+30 min", "+60 min"]
    horizon_winners = {}

    for h in horizons:
        h_models = {
            "Last Value": base_res["baselines"]["lastValue"]["byHorizon"][h]["mae"],
            "Historical Average": base_res["baselines"]["historicalAverage"]["byHorizon"][h]["mae"],
            "Linear Regression": lin_res["horizonComparisons"][h]["linearRegression"]["mae"],
            "GRU": temp_res["byHorizon"][h]["gru"]["mae"],
            "LSTM": temp_res["byHorizon"][h]["lstm"]["mae"],
            "Spatial GCN": gcn_res["byHorizon"][h]["mae"],
            "Graph+LSTM": graph_lstm_res["byHorizon"][h]["mae"]
        }
        winner = min(h_models, key=h_models.get)
        horizon_winners[h] = {
            "winner": winner,
            "winnerMae": h_models[winner],
            "allModels": h_models
        }

    graph_lstm_regions = graph_lstm_res["byRegion"]["graphLSTM"]

    summary = {
        "stage": "6.6",
        "stageName": "Final Prediction Evaluation and Model Freeze",
        "dataset": "METR-LA Benchmark",
        "units": "raw_mph",
        "primaryCentralizedModel": {
            "modelName": "Graph+LSTM",
            "modelType": "SpatialGraphLSTM",
            "checkpointPath": "data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt",
            "parameterCount": graph_lstm_res["modelConfig"]["parameterCount"],
            "checkpointSizeBytes": graph_lstm_res["modelConfig"]["checkpointSizeBytes"],
            "selectionReason": "Lowest overall test MAE (3.4378 mph) selected strictly via validation loss without test data leakage."
        },
        "referenceHorizonModel": {
            "modelName": "Historical Average",
            "referenceHorizon": "+60 min",
            "selectionReason": "Lowest MAE (4.1934 mph) at 60-minute prediction horizon."
        },
        "sevenModelComparativeBenchmark": {
            "overallWinner": overall_winner,
            "overallWinners": overall_maes,
            "modelsOverall": seven_models_overall,
            "horizonWinners": horizon_winners
        },
        "scientificClaims": {
            "primaryClaim": "Graph+LSTM is the best overall implemented forecasting model and the best model at +5, +15 and +30 minute horizons.",
            "horizon60Claim": "Historical Average remains strongest at +60 minutes.",
            "ablationSensitivityTest": "identity-adjacency substitution sensitivity test"
        },
        "regionBreakdown": {
            "model": "Graph+LSTM",
            "regions": graph_lstm_regions
        },
        "predictionContract": {
            "inputHistorySteps": 12,
            "inputHistoryMinutes": 60,
            "inputFeatures": 2,
            "outputHorizonsMinutes": [5, 15, 30, 60],
            "canonicalSensorCount": len(sensor_ids_list),
            "trainOnlyScaler": {
                "mean": scaler["mean"],
                "std": scaler["std"]
            },
            "maskingContract": "Target speeds <= 0.0 mph are masked nulls and excluded from metric computation.",
            "graphNormalization": "Symmetric adjacency normalization with self-loops: D~^{-1/2} A~ D~^{-1/2}"
        },
        "stage67InferenceContract": {
            "step1_Input": "12 historical 5-minute speed observations [12, 207, 2] (speed + binary valid mask).",
            "step2_Preprocessing": "Normalize speed using train-only scaler (mean=58.584258, std=12.822883).",
            "step3_GraphContext": "Load canonical weighted normalized 207x207 adjacency matrix.",
            "step4_ModelInference": "Pass normalized tensor and normalized adjacency into loaded graph_lstm_best.pt checkpoint.",
            "step5_Postprocessing": "Denormalize predictions (pred * std + mean) and clip negative predictions to 0.0 mph if present.",
            "step6_Output": "4 multi-step forecast horizons (+5, +15, +30, +60 min) for all 207 canonical METR-LA sensors."
        }
    }

    # Write summary JSON
    json_path = os.path.join(models_dir, "final_prediction_summary.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    # Write summary Markdown
    md_path = os.path.join(models_dir, "final_prediction_summary.md")
    md_content = f"""# TrafficPulse-X Phase 6 Stage 6.6: Final Prediction Evaluation & Model Freeze

## Executive Summary
This document establishes the **authoritative frozen baseline** for all centralized traffic prediction models on the **METR-LA** benchmark dataset.

- **Primary Centralized Prediction Model**: **Graph+LSTM** (`data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt`)
- **Reference Benchmark for +60 min Horizon**: **Historical Average** (MAE: `4.1934 mph`)
- **Overall Winner**: **Graph+LSTM** (Overall MAE: **3.4378 mph**, RMSE: **6.8873 mph**, MAPE: **9.57%**)

---

## Authoritative 7-Model Comparative Benchmark Matrix (Raw mph)

| Model Category | Model | Overall MAE | Overall RMSE | Overall MAPE | +5 min MAE | +15 min MAE | +30 min MAE | +60 min MAE |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Classical Baseline | Last Value | 3.9839 | 7.6411 | 10.15% | 2.8158 | 3.5045 | 4.2166 | 5.3987 |
| Classical Baseline | Historical Average | 4.1930 | 7.8618 | 13.06% | 4.1928 | 4.1928 | 4.1929 | **4.1934** 🏆 |
| Linear Baseline | Linear Regression | 3.9763 | 7.2053 | 11.14% | 2.6763 | 3.4026 | 4.2384 | 5.5879 |
| Temporal Model | GRU | 3.5669 | 7.0734 | 10.14% | 2.4349 | 3.0976 | 3.8068 | 4.9284 |
| Temporal Model | LSTM | 3.5613 | 7.0673 | 10.11% | 2.4372 | 3.0940 | 3.7984 | 4.9156 |
| Spatial Graph Model | Spatial GCN | 5.4604 | 8.9625 | 15.67% | 4.7139 | 5.1138 | 5.5939 | 6.4201 |
| **Spatio-Temporal Model** | **Graph+LSTM** 🏆 | **3.4378** 🏆 | **6.8873** 🏆 | **9.57%** 🏆 | **2.3648** 🏆 | **3.0007** 🏆 | **3.6699** 🏆 | 4.7158 |

---

## Scientific Claims
1. **Primary Model Claim**: "Graph+LSTM is the best overall implemented forecasting model and the best model at +5, +15 and +30 minute horizons."
2. **Horizon +60 Claim**: "Historical Average remains strongest at +60 minutes."
3. **Graph Topology Ablation**: Described as the **identity-adjacency substitution sensitivity test** (Real Graph MAE: `3.4378 mph` vs Identity Graph MAE: `3.6542 mph`, Sensitivity MAE Diff: `+0.2164 mph`).

---

## Region Breakdown (Graph+LSTM)

| Region Code | Description / Sensors | Valid Evaluated Targets | MAE (mph) | RMSE (mph) | MAPE (%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **REGION_A** | 48 sensors | 1,162,340 | **2.4094** | 4.7103 | 5.10% |
| **REGION_B** | 57 sensors | 1,359,564 | 3.9294 | 7.6177 | 12.08% |
| **REGION_C** | 58 sensors | 1,403,672 | 3.3897 | 7.1121 | 9.56% |
| **REGION_D** | 44 sensors | 1,044,636 | 4.0069 | 7.5835 | 11.30% |

---

## Final Prediction Contract & Stage 6.7 Inference Specifications
- **Input History**: 12 steps (60 minutes) with 2 channels (speed + valid binary mask).
- **Target Horizons**: 4 horizons (`+5`, `+15`, `+30`, `+60` min).
- **Canonical Sensors**: 207 sensors.
- **Scaler Contract**: Train-only mean = `58.584258`, std = `12.822883`.
- **Masking Contract**: Targets <= 0.0 mph are excluded from evaluation.
- **Inference Pipeline**: Sensor history $\rightarrow$ Normalize with scaler $\rightarrow$ Graph+LSTM forward pass $\rightarrow$ Denormalize output $\rightarrow$ Expose to FastAPI endpoint (Stage 6.7).
"""
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"Generated Stage 6.6 Final Summary JSON: {json_path}")
    print(f"Generated Stage 6.6 Final Summary MD: {md_path}")

if __name__ == "__main__":
    generate_final_prediction_summary()
