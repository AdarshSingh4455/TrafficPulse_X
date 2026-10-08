# TrafficPulse-X Scientific Contract

This document provides the authoritative single source of scientific parameters, frozen benchmark results, checkpoint hashes, and mathematical contracts for TrafficPulse-X.

---

## 1. Dataset Parameters & Split Contract

- **Dataset**: METR-LA (Los Angeles County highway speed sensors).
- **Authoritative Raw Path**: [data/raw/metr-la/metr-la.h5](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/data/raw/metr-la/metr-la.h5) (57,038,056 bytes).
- **Raw Matrix Dimensions**: **34,272 time steps × 207 traffic sensors**.
- **Sampling Frequency**: 5 minutes.
- **Date Range**: `2012-03-01 00:00:00` to `2012-06-27 23:55:00`.
- **Chronological Split Ranges**:
  - **Train**: Index range `[0, 23990)` (70%)
  - **Validation**: Index range `[23990, 27417)` (10%)
  - **Test**: Index range `[27417, 34272)` (20%)
- **Sliding-Window Sample Counts**:
  - **Train**: **23,967** samples
  - **Validation**: **3,404** samples
  - **Test**: **6,832** samples
- **Tensor Shapes**:
  - Stored `x`: `[N, 12, 207, 1]` (Normalized speed)
  - Stored `x_mask`: `[N, 12, 207, 1]` (Binary validity mask)
  - Stored `y`: `[N, 4, 207, 1]` (**Raw target speed in mph**)
  - Stored `y_mask`: `[N, 4, 207, 1]` (Binary validity mask)
  - Model Input (`Graph+LSTM`): `[B, 12, 207, 2]` (Channel 1 = normalized speed, Channel 2 = validity mask).
- **Z-Score Normalization Scaler**:
  - Mean ($\mu$): **58.584258 mph**
  - Std ($\sigma$): **12.822883 mph**

---

## 2. Geospatial Graph Normalization & Partitioning

### Spatial Adjacency Normalization
Formulation: Weighted symmetrically normalized adjacency with self-loops:
$$\tilde{A} = A + I_{207}$$
$$\tilde{D}_{ii} = \sum_j \tilde{A}_{ij}$$
$$A_{norm} = \tilde{D}^{-1/2} \tilde{A} \tilde{D}^{-1/2}$$

### Regional Subgraph Distribution
| Client ID | Sector | Sensor Count | Valid Target Cells ($n_i$) | Authoritative FedAvg Weight |
|---|---|---|---|---|
| **CLIENT_A** | North-East | **48** | 4,221,681 | `0.229069` |
| **CLIENT_B** | South-East | **57** | 5,107,193 | `0.277117` |
| **CLIENT_C** | Central-West | **58** | 5,150,335 | `0.279458` |
| **CLIENT_D** | North-West | **44** | 3,950,552 | `0.214357` |
| **TOTAL** | — | **207** | **18,429,761** | `1.000000` |

- `regions.json` Raw File SHA-256: `3af9827ff16eea2c8469dcfd3f712e7a9074d1ab10ef61c9ee78f99e9b5463b3`
- Canonical Content Checksum (`json.dumps(sort_keys=True)`): `ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2`

---

## 3. Phase-6 Centralized Benchmark Metrics

Evaluated across the 6,832 test set samples:

| Model | MAE (mph) | RMSE (mph) | MAPE (%) | Notes |
|---|---|---|---|---|
| Last Value | 3.9839 | 7.6411 | 10.15% | Baseline |
| Historical Average | 4.1930 | 7.8618 | 13.06% | **Winner at +60m horizon (4.1934 mph)** |
| Linear Regression | 3.9763 | 7.2053 | 11.14% | Baseline |
| Temporal GRU | 3.5669 | 7.2345 | 10.03% | Temporal baseline |
| Temporal LSTM | 3.5613 | 7.2420 | 9.93% | Temporal baseline |
| Spatial GCN | 5.4604 | 8.9625 | 15.67% | Pure GCN |
| **Graph+LSTM (Selected)** | **3.4378** | **6.8873** | **9.57%** | **Overall Winner** |

### Graph+LSTM Forecast Horizons
- **+5 min**: **2.3648 mph**
- **+15 min**: **3.0007 mph**
- **+30 min**: **3.6699 mph**
- **+60 min**: **4.7158 mph**

### Centralized Model Checkpoint
- Path: [data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt)
- Size: **111,119 bytes**
- SHA-256: `702cb2bb9406aa36ec25639121377bf939acdb1906370997ccd792f70cf1f384`

---

## 4. Phase-8 Federated Learning Results

- Best Validation Round: **Round 8** (Validation MAE: **3.1536 mph**).
- Final FL Test Metrics: **MAE = 3.5322 mph**, **RMSE = 7.0956 mph**, **MAPE = 9.99%**.
- FL vs Centralized Gap: Full-participation FedAvg achieved 3.5322 mph test MAE, 2.75% higher (+0.0944 mph) than the frozen centralized Graph+LSTM reference baseline of 3.4378 mph under the evaluated regional federated setup.
- Federated Checkpoint Path: [data/processed/metr-la/federated/checkpoints/global_best.pt](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/data/processed/metr-la/federated/checkpoints/global_best.pt)
  - Size: **111,047 bytes**
  - SHA-256: `24710dae0fe0554ca8111ad21e05de03b69a282f0b8d8868a1433ba6fd9c2930`

---

## 5. Baseline Communication Accounting

- **Level 1 Single Query (Event A)**: 32 bytes raw float64 (`NUMERIC_FIELD_RAW_BYTES`) / 187 bytes serialized application payload (`MEASURED_SERIALIZED_APPLICATION_PAYLOAD`).
- **Level 1 Batch (Event B)**: ~4.2 KB application payload proxy.
- **Level 2 Client Update**: 26,596 FP32 parameters $\rightarrow$ 106,384 bytes raw tensor $\rightarrow$ 110,271 bytes serialized PyTorch state dict per update.
- **13-Round Total**: 52 uploads (5,734,092 bytes) + 52 downloads (5,734,092 bytes) = 104 transfers = **11,468,184 bytes** (11.47 MB).

---

## 6. Scientific Classification of Signals

- `speed`: REAL METR-LA BENCHMARK TELEMETRY
- `flow` / `occupancy`: NOT_AVAILABLE (Not present in METR-LA benchmark)
- `predictions`: MODEL_OUTPUT (Inferred via Graph+LSTM)
- `uncertaintyProxy`: CALIBRATED_PROXY (Calibrated against `val.npz` residual errors)
- `Need Score`: DERIVED (Deterministic 9-factor combination)
- `Phase 9 Communication Optimization`: NOT_STARTED / NOT_EVALUATED
