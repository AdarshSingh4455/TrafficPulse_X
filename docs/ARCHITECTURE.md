# TrafficPulse-X Architecture Document

## System Overview

TrafficPulse-X is an **Evidence-on-Demand Federated Traffic-Flow Prediction Platform** built on the real METR-LA benchmark dataset (207 Los Angeles highway speed sensors).

The platform combines spatio-temporal graph neural networks (`Graph+LSTM`), a multi-factor Decision Intelligence Engine (Need Score, Physics Gate, Sensor Jury), and a 4-client Federated Learning framework (FedAvg).

```
+-------------------------------------------------------------------------------+
|                       REAL METR-LA BENCHMARK DATASET                          |
|  data/raw/metr-la/metr-la.h5 | data/processed/metr-la/ml_ready/*.npz          |
|  data/processed/metr-la/regions.json | sensor_index.json                     |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                             BACKEND SERVICES                                  |
|  backend/data_source.py (DataSourceManager - Replay telemetry & data quality) |
|  backend/prediction/service.py (PredictionService -> graph_lstm_best.pt)      |
|  backend/federated/service.py (FederatedService -> global_best.pt & baseline) |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                       DECISION INTELLIGENCE ENGINE                            |
|  backend/decision/need_score.py   | backend/decision/uncertainty.py           |
|  backend/decision/jury.py         | backend/decision/physics.py               |
|  backend/decision/query_ranker.py | backend/decision/coverage.py              |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                        SINGLE FASTAPI APPLICATION                             |
|  backend/main.py (38 REST HTTP Endpoints under /api/*)                        |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                         FRONTEND API SERVICE LAYER                            |
|  src/services/api.js (Axios HTTP Client -> Single Endpoint Gateway Mapping)    |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                            REACT USER INTERFACE                               |
|  Overview | TrafficNetwork | DecisionIntelligence | Prediction | FL | Comm | Alerts|
+-------------------------------------------------------------------------------+
```

---

## 1. Backend Service & ML Layer Architecture

### Data Management Layer (`backend/data_source.py`)
- Reads raw sensor telemetry from METR-LA sliding windows.
- Manages non-null data quality checks (`dataQuality = 1.0` for valid values, `0.0` for missing).
- Emits single sensor heartbeats and 12-step telemetry history sequences.

### Spatio-Temporal Prediction Layer (`backend/prediction/service.py` & `ml/spatiotemporal/model.py`)
- **Model**: `SpatialGraphLSTM` combining Spatial Graph Convolution (`SpatialGCN`) with a 2-layer LSTM.
- **Normalization**: Weighted symmetrically normalized graph adjacency matrix with self-loops:
  $$\tilde{A} = A + I_{207}$$
  $$A_{norm} = \tilde{D}^{-1/2} \tilde{A} \tilde{D}^{-1/2}$$
- **Input Tensor**: `[B, 12, 207, 2]` (Channel 1 = normalized speed, Channel 2 = validity mask).
- **Target Horizons**: Four selected forecast horizons (+5m, +15m, +30m, +60m corresponding to target step offsets `[1, 3, 6, 12]`).

### Federated Learning Layer (`backend/federated/service.py` & `ml/federated/`)
- **Partitions**: 4 Regional FL Clients mapped to geographic sectors (`REGION_A` North-East, `REGION_B` South-East, `REGION_C` Central-West, `REGION_D` North-West).
- **Aggregation**: Federated Averaging (`FedAvg`) weighted by regional sample target counts ($n_i$).
- **Best Model Selection**: Round 8 validation-selected model (`global_best.pt`, 111,047 bytes).

---

## 2. Decision Intelligence Engine Flow

```
+------------------+     +------------------------+     +-----------------------+
|  Telemetry Stream | --> |  Uncertainty Engine   | --> | Spatial Speed         |
|  & Quality Mask   |     |  (val.npz Calibration) |     | Consistency (Physics) |
+------------------+     +------------------------+     +-----------------------+
                                                                   |
                                                                   v
+------------------+     +------------------------+     +-----------------------+
| Sensor Jury      | <-- |  9-Factor Need Score   | <-- | Spatial Neighbor      |
| Voting Consensus |     |  Calculation (DERIVED) |     | Influence Matrix      |
+------------------+     +------------------------+     +-----------------------+
        |
        v
+-------------------------------------------------------------------------------+
| Query Ranker & Next-Best Evidence Acquisition Engine                          |
+-------------------------------------------------------------------------------+
```

### Need Score Calculation Factors
Need Score is a deterministic derived score combining nine factors:
1. Spatial Influence
2. Calibrated Prediction Uncertainty (`CALIBRATED_PROXY`)
3. Spatial Speed Disagreement
4. Traffic Drift
5. Freshness
6. Information Debt
7. Coverage Need
8. Data Quality
9. Redundancy Penalty

---

## 3. Communication Accounting Architecture

Communication is measured across two distinct network protocol boundaries:

### Level 1: Sensor-to-Edge Query & Telemetry
- **Single Sensor Query (Event A)**:
  - Raw numeric payload: 32 bytes (`speedMph`, `timestampEpoch`, `dataQuality`, `needScore`).
  - Serialized application payload: 187 bytes (`MEASURED_SERIALIZED_APPLICATION_PAYLOAD`).
- **12-Step Telemetry Batch (Event B)**: Application payload proxy = ~4.2 KB.

### Level 2: Regional FL Client-to-Server Weight Updates
- Model State: 26,596 FP32 parameters $\rightarrow$ 106,384 bytes raw tensor $\rightarrow$ 110,271 bytes serialized PyTorch state dict.
- 13-Round Total: 52 uploads (5,734,092 bytes) + 52 downloads (5,734,092 bytes) = 104 transfers = **11,468,184 bytes** (11.47 MB).

---

## 4. Single FastAPI Rule & Gateway Mapping

All API endpoints are hosted by a single FastAPI application instance (`backend/main.py`) running on port 8000.
The React frontend routes all HTTP calls exclusively through `src/services/api.js`.

---

## 5. Phase 9 Selective Communication Engine Architecture

Phase 9 introduces selective client participation under constrained communication budgets:

```
+-------------------------------------------------------------------------------+
|                      REGIONAL FL CLIENTS (A, B, C, D)                        |
+-------------------------------------------------------------------------------+
        |                               |                               |
        v                               v                               v
+-----------------------+     +-------------------+     +-----------------------+
| Spatial Variance      |     | Model Divergence  |     | Information Debt      |
| Regional Dynamics     |     | Weight Delta L2   |     | Counter (No Starve)   |
+-----------------------+     +-------------------+     +-----------------------+
        \                               |                               /
         -----------------------+-------+-------------------------------
                                |
                                v
+-------------------------------------------------------------------------------+
| Client Communication Value (CCV) = w_var*Var + w_div*Div + w_debt*Debt        |
+-------------------------------------------------------------------------------+
                                |
                                v
+-------------------------------------------------------------------------------+
| Budget Selector (4/4, 3/4, 2/4, 1/4) -> Top-K Participant Regional Updates    |
+-------------------------------------------------------------------------------+
```

- **Policy Selector**: `backend/communication_intelligence/policies.py`
- **Service Layer**: `backend/communication_intelligence/service.py`
- **Budget Tiers**: 4/4 (Baseline), 3/4 (25% reduction), 2/4 (50% reduction, Pareto-Optimal), 1/4 (75% reduction, Pareto-Optimal).
- **Accounting**: 110,271 B serialized application payload per client per round; zero mock values.

