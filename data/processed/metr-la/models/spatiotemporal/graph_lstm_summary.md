# TrafficPulse-X Stage 6.5: Spatio-Temporal Graph + LSTM Model Report

## Executive Summary
Stage 6.5 evaluates the **SpatialGraphLSTM** spatio-temporal architecture combining 2-layer Graph Convolution (with self-residual connection) across all 12 input timesteps with a 1-layer LSTM sequence processor over the real METR-LA 207-sensor benchmark.

- **Overall Graph+LSTM Test MAE**: `3.6413 mph`
- **Overall Graph+LSTM Test RMSE**: `7.3511 mph`
- **Overall Graph+LSTM Test MAPE**: `10.11%`
- **Comparison to Temporal-Only LSTM**: `Graph+LSTM achieves 3.6413 mph MAE vs Temporal LSTM 3.5613 mph MAE (MAE Diff: +0.0800 mph, +2.25%). Temporal persistence dominates speed patterns over 60 minutes; graph neighbor propagation provides secondary spatial structure.`

---

## 1. 7-Model Comparative Benchmark Matrix (Raw mph Space)

| Model Category | Model | Overall MAE | Overall RMSE | Overall MAPE | +5 min MAE | +15 min MAE | +30 min MAE | +60 min MAE |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Classical Baseline | Last Value | 3.9839 | 7.6411 | 10.15% | 2.8158 | 3.5045 | 4.2166 | 5.3987 |
| Classical Baseline | Historical Average | 4.1930 | 7.8618 | 13.06% | 4.1928 | 4.1928 | 4.1929 | **4.1934** 🏆 |
| Linear Baseline | Linear Regression | 3.9763 | 7.2053 | 11.14% | 2.6763 | 3.4026 | 4.2384 | 5.5879 |
| Temporal Model | GRU | 3.5669 | 7.0734 | 10.14% | **2.4349** 🏆 | 3.0976 | 3.8068 | 4.9284 |
| Temporal Model | **LSTM** | **3.5613** 🏆 | **7.0673** 🏆 | **10.11%** 🏆 | 2.4372 | **3.0940** 🏆 | **3.7984** 🏆 | 4.9156 |
| Spatial Graph Model | Spatial GCN | 5.4604 | 8.9625 | 15.67% | 4.7139 | 5.1138 | 5.5939 | 6.4201 |
| **Spatio-Temporal Model**| **Graph+LSTM** | `3.6413` | `7.3511` | `10.11%` | `2.5097` | `3.1724` | `3.8799` | `5.0032` |

---

## 2. Regional Performance Breakdown

- **REGION_A** (48 sensors): `2.5215 mph` MAE
- **REGION_B** (57 sensors): `4.1635 mph` MAE
- **REGION_C** (58 sensors): `3.6183 mph` MAE
- **REGION_D** (44 sensors): `4.2385 mph` MAE

---

## 3. Key Scientific Finding
Graph+LSTM achieves 3.6413 mph MAE vs Temporal LSTM 3.5613 mph MAE (MAE Diff: +0.0800 mph, +2.25%). Temporal persistence dominates speed patterns over 60 minutes; graph neighbor propagation provides secondary spatial structure.
