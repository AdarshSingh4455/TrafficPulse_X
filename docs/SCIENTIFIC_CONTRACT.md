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
- `Phase 9 Communication Optimization`: COMPLETE & EVALUATED

---

## 7. Phase 9: Selective Federated Communication Optimization Contract

### 7.1 Protocol & Baselines Contract
- **Optimization Strategy**: Client Communication Value (CCV) combining regional sensor-share factor ($s_k$), regional speed drift proxy ($d_k$), and an information debt accumulator ($\tau_k$): $\text{CCV}_k = 1.0 \cdot s_k + 0.5 \cdot d_k + 0.15 \cdot \tau_k$.
- **Matched Protocol**: `max_batches=30`, batch size 64, Adam optimizer (lr=0.001), seed 42, 13 rounds across all selective policies and matched controlled 4/4 baseline.
- **Two Distinct Baselines Contract**:
  - `FROZEN_STAGE_8_FEDAVG_REFERENCE`: Historical full-epoch Stage 8.2 FedAvg benchmark (Test MAE: **3.5322 mph**, Best round: 8). Immutable historical reference; NOT the matched Phase-9 comparison denominator.
  - `POLICY_CONTROLLED_4_OF_4`: Matched control baseline (Test MAE: **3.6473 mph**, Test RMSE: 7.2847, MAPE: 10.25%, Best validation round: 13, Best validation MAE: **3.2542 mph**, Application Payload: 11,468,184 Bytes). Authoritative matched baseline for $\Delta\text{MAE}$ and Pareto dominance.

### 7.2 Authoritative Empirical Comparison Table

| Policy | Serialized Application Payload | Application-Payload Reduction | Test MAE (mph) | $\Delta\text{MAE}$ vs Controlled 4/4 | Pareto Classification |
|---|---|---|---|---|---|
| `POLICY_CONTROLLED_4_OF_4` | 11,468,184 B | 0.00% | 3.6473 | Baseline (0.0000) | Dominated by 2/4 (Val MAE: 3.2542) |
| `POLICY_CCV_3_OF_4` | 8,601,138 B | 25.00% | 3.6530 | +0.0057 | Dominated by 2/4 (Val MAE: 3.2581) |
| `POLICY_CCV_2_OF_4` | 5,734,092 B | 50.00% | 3.6448 | -0.0025 | **PARETO_OPTIMAL (Best Balanced)** |
| `POLICY_CCV_1_OF_4` | 2,867,046 B | 75.00% | 3.6699 | +0.0226 | **PARETO_OPTIMAL (Max Efficiency)** |
| *`FROZEN_STAGE_8_FEDAVG_REFERENCE`* | 11,468,184 B | — | 3.5322 | — | *Historical Frozen Benchmark* |

### 7.3 Mathematical Pareto Dominance
Under the objective space $(\min(\text{payload}), \min(\text{MAE}))$:
- `POLICY_CCV_2_OF_4` strictly dominates `POLICY_CCV_3_OF_4` ($5,734,092\text{ B} < 8,601,138\text{ B}$ and $3.6448 < 3.6530\text{ mph}$).
- Therefore, `POLICY_CCV_3_OF_4` is **PARETO_DOMINATED** and must NEVER be labeled Pareto-optimal.
- `POLICY_CCV_2_OF_4` also strictly dominates `POLICY_CONTROLLED_4_OF_4` ($5,734,092\text{ B} < 11,468,184\text{ B}$ and $3.6448 < 3.6473\text{ mph}$).
- **Pareto-Relevant Policies**: `POLICY_CCV_2_OF_4` and `POLICY_CCV_1_OF_4`.
- **Best Observed Balanced Policy**: `POLICY_CCV_2_OF_4` achieves 50.00% serialized application payload reduction with 3.6448 mph test MAE.

### 7.4 Starvation Observation
- Rigorous observation: **"No starvation observed during the evaluated 13-round run."**
- Information debt is a `DERIVED_STATE` counter that increases a skipped client's future selection priority; maximum consecutive skipped rounds remained bounded across all clients.

### 7.5 Sensor-Share Factor vs Canonical FedAvg Weight
- Regional sensor-share factors ($A=48/207 \approx 0.2319$, $B=57/207 \approx 0.2754$, $C=58/207 \approx 0.2802$, $D=44/207 \approx 0.2126$) are **DERIVED / HEURISTIC** spatial parameters used only in CCV weighting.
- Canonical FedAvg weights ($A \approx 0.229069$, $B \approx 0.277117$, $C \approx 0.279458$, $D \approx 0.214357$) are strictly sample-count proportions computed from 18,429,761 valid training targets.

---

## 8. Phase 10: Scientific Freeze & Research Governance Contract

### 8.1 Research Synthesis & Frozen Benchmarks
1. **Centralized Spatio-Temporal Baseline**: Graph+LSTM achieves **3.4378 mph** test MAE.
2. **Phase 8 Historical Full-Participation FedAvg**: **3.5322 mph** test MAE (+2.75% gap vs centralized).
3. **Phase 9 Matched Controlled 4/4**: **3.6473 mph** test MAE (Best round 13, Val MAE: **3.2542 mph**).
4. **Phase 9 Selective FL Trade-off**:
   - CCV 2/4: **3.6448 mph** MAE at **50.00% application-payload reduction** (Pareto-Optimal, Best Observed Balanced Trade-off).
   - CCV 1/4: **3.6699 mph** MAE at **75.00% application-payload reduction** (Pareto-Optimal, Maximum Efficiency).

### 8.2 Safe Novelty Statement
> **"Jointly deciding what traffic information is worth sensing and what learned information is worth federating."**

### 8.3 Strict Negative Disclaimers
The platform strictly maintains the following negative disclaimers:
- No claim of "world-first", "first-of-its-kind", or "state-of-the-art".
- No claim of global optimality across unconstrained communication hyperplanes.
- No claim of physical bandwidth savings (Layer 7 serialized application payloads measured).
- No claim of cryptographic privacy or security guarantees.

### 8.4 Protected Artifacts & Hashes Contract
The following scientific artifact hashes are immutable and verified:
- `graph_lstm_best.pt`: `702cb2bb9406aa36ec25639121377bf939acdb1906370997ccd792f70cf1f384`
- `global_best.pt`: `24710dae0fe0554ca8111ad21e05de03b69a282f0b8d8868a1433ba6fd9c2930`
- `regions.json` canonical checksum: `ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2`
- Runtime Scaler: mean `58.584258`, standard deviation `12.822883`.


