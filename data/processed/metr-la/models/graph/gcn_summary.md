# TrafficPulse-X Stage 6.4: Graph Baseline (Spatial GCN) Report

## Executive Summary
Stage 6.4 evaluates a **spatial-only Graph Convolutional Network (GCN)** on the real METR-LA 207-sensor benchmark network.
The model operates strictly via **weighted normalized spatial graph convolution** ($A_{\text{norm}}$) over the most recent historical input step ($X_{-1}$) without temporal recurrence.

- **Authoritative GCN Checkpoint**: `gcn_best.pt` (21,473 bytes)
- **Training Epochs Completed**: 30 max epochs completed (lowest validation MAE `4.8757 mph` achieved at epoch 29)
- **Overall GCN Test MAE**: `5.4604 mph`
- **Overall GCN Test RMSE**: `8.9625 mph`
- **Overall GCN Test MAPE**: `15.67%`

---

## 1. 6-Model Comparative Benchmark Matrix (Raw mph Space)

| Model Category | Model | Overall MAE | Overall RMSE | Overall MAPE | +5 min MAE | +15 min MAE | +30 min MAE | +60 min MAE |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Classical Baseline | Last Value | 3.9839 | 7.6411 | 10.15% | 2.8158 | 3.5045 | 4.2166 | 5.3987 |
| Classical Baseline | Historical Average | 4.1930 | 7.8618 | 13.06% | 4.1928 | 4.1928 | 4.1929 | **4.1934** 🏆 |
| Linear Baseline | Linear Regression | 3.9763 | 7.2053 | 11.14% | 2.6763 | 3.4026 | 4.2384 | 5.5879 |
| Temporal Model | GRU | 3.5669 | 7.0734 | 10.14% | **2.4349** 🏆 | 3.0976 | 3.8068 | 4.9284 |
| Temporal Model | **LSTM** | **3.5613** 🏆 | **7.0673** 🏆 | **10.11%** 🏆 | 2.4372 | **3.0940** 🏆 | **3.7984** 🏆 | 4.9156 |
| **Spatial Graph Model** | **Spatial GCN** | `5.4604` | `8.9625` | `15.67%` | `4.7139` | `5.1138` | `5.5939` | `6.4201` |

---

## 2. Real Graph vs Identity Graph Ablation Study

> **Ablation Methodology (Method B)**: The real-graph trained `SpatialGCN` checkpoint (`gcn_best.pt`) was evaluated with **Identity Adjacency** ($A_{\text{norm}} = I_{207}$) to test neighbor propagation.

| Graph Configuration | Adjacency Matrix | Test MAE | Test RMSE | Test MAPE | Finding |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Real Spatial Graph** | Weighted $A_{\text{norm}} = D^{-1/2} (A + I) D^{-1/2}$ | **`5.4604 mph`** | `8.9625 mph` | `15.67%` | Weighted spatial neighbor aggregation over $X_{-1}$ alone |
| **Identity Graph** | $A_{\text{norm}} = I_{207}$ (No neighbor pass) | `4.1602 mph` | `7.8049 mph` | `10.92%` | Self-node processing without spatial neighbor averaging |

---

## 3. Regional Performance Breakdown

- **REGION_A** (48 sensors): `3.5751 mph` MAE
- **REGION_B** (57 sensors): `6.8854 mph` MAE
- **REGION_C** (58 sensors): `5.3005 mph` MAE
- **REGION_D** (44 sensors): `5.9184 mph` MAE

---

## 4. Key Scientific Conclusion
Without temporal memory (RNN/LSTM/GRU), spatial graph convolution over the single most recent time step ($X_{-1}$) over-smooths local node speed features toward neighborhood averages. This establishes the baseline motivation for **Spatio-Temporal Graph Neural Networks (Stage 6.5)**.
