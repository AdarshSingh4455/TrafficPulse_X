# TrafficPulse-X

> **Sense only what matters. Ask the next best question. Share only what helps.**

TrafficPulse-X is an **Evidence-on-Demand Federated Traffic-Flow Prediction Platform** built on the real **METR-LA** Los Angeles highway benchmark (207 speed sensors).

---

## 1. Project Objectives

1. **Prediction Accuracy**: Multi-horizon spatio-temporal traffic speed forecasting (+5m to +60m) using Spatial Graph Convolutions and LSTM cells (`Graph+LSTM`). *(Implemented & Evaluated)*
2. **Communication Efficiency & Accounting**: Application payload monitoring and selective edge evidence acquisition. *(Baseline Accounting & Phase 9 Selective Communication Optimization COMPLETE & Evaluated)*

---

## 2. Important Scientific Scope

- **Real METR-LA Dataset**: YES (Los Angeles County highway speed sensors)
- **Historical Replay Execution**: YES (March 1, 2012 to June 27, 2012)
- **Live Present-Day Streaming**: NO
- **Predicted Telemetry Signal**: Vehicle Speed (mph)
- **Flow (Volume) Telemetry**: NOT_AVAILABLE
- **Occupancy (%) Telemetry**: NOT_AVAILABLE
- **Hardware Health**: NOT_AVAILABLE

---

## 3. Core Features

- **Real METR-LA Ingestion Pipeline**: 34,272 time steps across 207 sensors at 5-minute intervals.
- **Spatio-Temporal Model (`Graph+LSTM`)**: Combines weighted symmetrically normalized adjacency ($\tilde{D}^{-1/2} \tilde{A} \tilde{D}^{-1/2}$) with 2-layer LSTM temporal units.
- **7-Model Prediction Benchmark**: Evaluated against Last Value, Historical Average, Linear Regression, Temporal GRU, Temporal LSTM, and Spatial GCN.
- **Decision Intelligence Engine**: 9-factor dynamic Need Score (`DERIVED`), residual error uncertainty calibration (`CALIBRATED_PROXY`), Sensor Jury consensus voting, and Physics Gate spatial speed consistency checks.
- **Federated Learning Framework**: 4 Regional FL Clients executing FedAvg over regional subgraphs.
- **Dual-Level Communication Accounting**: Level 1 (Sensor-to-Edge single query & batch) and Level 2 (FL client-to-server weight updates).
- **React 19 Dashboard**: 7 active pages with interactive Leaflet geospatial maps, Recharts visual analytics, and dark/light themes.

---

## 4. System Architecture

```
+-------------------------------------------------------------------------------+
|                       REAL METR-LA BENCHMARK DATASET                          |
|  data/raw/metr-la/metr-la.h5 | data/processed/metr-la/ml_ready/*.npz          |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                             BACKEND SERVICES                                  |
|  backend/data_source.py (DataSourceManager)                                   |
|  backend/prediction/service.py (PredictionService -> graph_lstm_best.pt)      |
|  backend/federated/service.py (FederatedService -> global_best.pt)            |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
|                       DECISION INTELLIGENCE ENGINE                            |
|  backend/decision/need_score.py | uncertainty.py | jury.py | physics.py       |
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

## 5. Technology Stack

### Backend & ML (Python)
- **FastAPI** (`backend/main.py`): Web framework hosting 38 REST endpoints.
- **Uvicorn**: ASGI web server runner.
- **PyTorch** (`torch`): Deep learning framework for `Graph+LSTM`, `GCN`, `LSTM`, `GRU`, and FL training.
- **NumPy & Pandas**: Data manipulation and tensor operations.
- **SciPy**: Graph distance matrix and Gaussian kernel computations.
- **PyTables (`tables`)**: HDF5 benchmark data reading (`metr-la.h5`).
- **Pytest & HTTPX**: Backend test suite execution (270 unit & regression tests).

### Frontend (JavaScript / React)
- **React 19 & React Router DOM 7**: UI rendering and client-side routing.
- **Vite 8**: Modern frontend build tool and dev server.
- **Tailwind CSS 4**: Utility-first styling with dark mode support.
- **Leaflet & React Leaflet**: Interactive geospatial traffic network mapping.
- **Recharts**: Data visualization and multi-horizon prediction charts.
- **Lucide React**: Modern iconography.

---

## 6. Dataset & Splits Contract

- **Authoritative Dataset Path**: [data/raw/metr-la/metr-la.h5](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/data/raw/metr-la/metr-la.h5) (57,038,056 bytes).
- **Matrix Dimensions**: **34,272 time steps × 207 traffic sensors** (5-minute interval).
- **Date Range**: `2012-03-01 00:00:00` to `2012-06-27 23:55:00`.
- **Chronological Splits**:
  - **Train**: `[0, 23990)` $\rightarrow$ **23,967** sliding-window samples (70%)
  - **Val**: `[23990, 27417)` $\rightarrow$ **3,404** sliding-window samples (10%)
  - **Test**: `[27417, 34272)` $\rightarrow$ **6,832** sliding-window samples (20%)
- **Z-Score Normalization**: Mean ($\mu$) = **58.584258 mph**, Std ($\sigma$) = **12.822883 mph**.

---

## 7. Prediction Models & Phase-6 Results

Evaluated over 6,832 test set samples:

| Model | MAE (mph) | RMSE (mph) | MAPE (%) | Notes |
|---|---|---|---|---|
| Last Value | 3.9839 | 7.6411 | 10.15% | Simple baseline |
| Historical Average | 4.1930 | 7.8618 | 13.06% | **Winner at +60m horizon (4.1934 mph)** |
| Linear Regression | 3.9763 | 7.2053 | 11.14% | Ridge regularized linear baseline |
| Temporal GRU | 3.5669 | 7.2345 | 10.03% | Temporal baseline |
| Temporal LSTM | 3.5613 | 7.2420 | 9.93% | Non-spatial sequence baseline |
| Spatial GCN | 5.4604 | 8.9625 | 15.67% | Pure GCN without temporal memory |
| **Graph+LSTM (Selected)** | **3.4378** | **6.8873** | **9.57%** | **Overall Winner** (Best overall MAE, RMSE, MAPE) |

### Graph+LSTM Forecast Horizons
- **+5 min**: **2.3648 mph**
- **+15 min**: **3.0007 mph**
- **+30 min**: **3.6699 mph**
- **+60 min**: **4.7158 mph**

---

## 8. Federated Learning (Phase 8 Simulation)

- **Regional FL Clients**: 4 Subgraphs (Client A: 48, Client B: 57, Client C: 58, Client D: 44 sensors).
- **Algorithm**: Federated Averaging (`FedAvg`) weighted by target counts ($n_i$).
- **Best Validation Round**: **Round 8** (Validation MAE = **3.1536 mph**).
- **Final FL Test Metrics**: **MAE = 3.5322 mph**, **RMSE = 7.0956 mph**, **MAPE = 9.99%**.
- **FL Gap**: Full-participation FedAvg achieved 3.5322 mph test MAE, 2.75% higher (+0.0944 mph) than the frozen centralized Graph+LSTM reference baseline of 3.4378 mph under the evaluated regional federated setup.
- *Explicitly classified as a Federated Learning Simulation without security or privacy guarantees.*

---

## 9. Baseline Communication Accounting

- **Level 1 Single Query**: 32 bytes raw float64 (`NUMERIC_FIELD_RAW_BYTES`) / 187 bytes serialized application payload (`MEASURED_SERIALIZED_APPLICATION_PAYLOAD`).
- **Level 1 Batch**: ~4.2 KB application payload proxy (`APPLICATION_PAYLOAD_PROXY`).
- **Level 2 FL Client Update**: 26,596 FP32 parameters $\rightarrow$ 106,384 bytes raw tensor $\rightarrow$ 110,271 bytes serialized PyTorch state dict per update.
- **13-Round Total**: 52 uploads (5,734,092 bytes) + 52 downloads (5,734,092 bytes) = 104 transfers = **11,468,184 bytes** (11.47 MB).
- **Phase 9 Selective Communication Optimization**: **COMPLETE & EVALUATED**
  - **Matched Protocol**: `max_batches=30`, batch size 64, Adam lr 0.001, seed 42, 13 rounds across all selective policies and matched controlled 4/4 baseline.
  - **Empirical Results**:
    - `POLICY_CONTROLLED_4_OF_4`: 11,468,184 B (0.00% red.), 3.6473 mph Test MAE (Baseline, dominated by 2/4, Best round 13, Val MAE: **3.2542 mph**)
    - `POLICY_CCV_3_OF_4`: 8,601,138 B (25.00% red.), 3.6530 mph Test MAE (Dominated by 2/4, Best round 13, Val MAE: 3.2581 mph)
    - `POLICY_CCV_2_OF_4`: 5,734,092 B (50.00% red.), 3.6448 mph Test MAE (**Pareto-Optimal, Best Balanced Trade-off**, Best round 13, Val MAE: 3.2525 mph)
    - `POLICY_CCV_1_OF_4`: 2,867,046 B (75.00% red.), 3.6699 mph Test MAE (**Pareto-Optimal, Max Efficiency**, Best round 13, Val MAE: 3.2761 mph)
    - `FROZEN_STAGE_8_FEDAVG_REFERENCE`: 11,468,184 B, 3.5322 mph Test MAE (*Historical frozen reference only*, Best round 8, Val MAE: 3.1536 mph)
  - **Pareto-Relevant Policies**: `POLICY_CCV_2_OF_4` and `POLICY_CCV_1_OF_4`.
  - **Starvation Observation**: No starvation observed during the evaluated 13-round run.

---

## 10. User Interface (7 Active Pages)

1. **Overview**: Executive summary dashboard with network-wide speed metrics and replay controls.
2. **Traffic Network**: Interactive Leaflet geospatial map with sensor markers and spatial historical replay.
3. **Decision Intelligence**: Dynamic 9-factor Need Score breakdown, Sensor Jury voting, and Next-Best Query ranker.
4. **Predictions**: 7-model benchmark comparison and multi-horizon (+5m to +60m) visual analytics.
5. **Communication**: Baseline communication accounting dashboard auditing Level 1 and Level 2 application payloads.
6. **Federated Learning**: Regional FL Client partition map, round history, and Round 8 validation-selected model statistics.
7. **Alerts**: Network congestion warning alerts and anomaly detection feed.

---

## 11. Installation & Quickstart

### Backend Installation & Startup
```bash
# 1. Create and activate virtual environment
python -m venv .venv
# On Windows: .\.venv\Scripts\Activate.ps1
# On Linux/macOS: source .venv/bin/activate

# 2. Install dependencies
python -m pip install -r backend/requirements.txt

# 3. Start backend API server (port 8000)
python -m uvicorn backend.main:app --reload --port 8000
```

### Frontend Installation & Startup
```bash
# 1. Install dependencies
npm install

# 2. Start dev server (port 5173)
npm run dev
```

---

## 12. Testing & Verification

```bash
# Run backend pytest suite (300 passed expected across all phases)
python -m pytest backend -v

# Run frontend lint check (0 errors required)
npm run lint

# Run frontend build check
npm run build
```

---

## 13. Project Documentation Links

- [docs/ARCHITECTURE.md](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/docs/ARCHITECTURE.md): System layout, ML pipeline, decision engine flow, and communication accounting.
- [docs/SCIENTIFIC_CONTRACT.md](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/docs/SCIENTIFIC_CONTRACT.md): Frozen scientific contracts, dataset split numbers, model metrics, checkpoint SHA hashes, and communication payload rules.
- [docs/DEVELOPMENT.md](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/docs/DEVELOPMENT.md): Setup, execution commands, testing, and repository development conventions.
- [docs/DEMO_VIVA.md](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/docs/DEMO_VIVA.md): 5-minute demo sequence, elevator pitch, and safe viva Q&A guide.
- [audit_report.md](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/audit_report.md): Final Authoritative A–Z Implementation Audit & Provenance Report.

---

## 14. Frozen Checkpoints & Verification Hashes

- **Centralized Checkpoint**: [data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt)
  - Raw Size: **111,119 bytes** | SHA-256: `702cb2bb9406aa36ec25639121377bf939acdb1906370997ccd792f70cf1f384`
- **Federated Checkpoint**: [data/processed/metr-la/federated/checkpoints/global_best.pt](file:///c:/Users/shaur/OneDrive/Desktop/PS-003/data/processed/metr-la/federated/checkpoints/global_best.pt)
  - Raw Size: **111,047 bytes** | SHA-256: `24710dae0fe0554ca8111ad21e05de03b69a282f0b8d8868a1433ba6fd9c2930`
- **Canonical Regions Checksum**: `ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2`

---

## 15. Project Status & Roadmap

- **Phase 1 – Phase 8**: **COMPLETE & FROZEN**
- **Phase 9 (Communication Intelligence)**: **COMPLETE & EVALUATED**
- **Phase 10 (Final System Evaluation, Demo/Viva & Release Lock)**: **COMPLETE & FROZEN**


