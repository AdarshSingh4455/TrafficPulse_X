# TrafficPulse-X Phase 6 Stage 6.6: Final Prediction Evaluation & Model Freeze

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
- **Inference Pipeline**: Sensor history $ightarrow$ Normalize with scaler $ightarrow$ Graph+LSTM forward pass $ightarrow$ Denormalize output $ightarrow$ Expose to FastAPI endpoint (Stage 6.7).
