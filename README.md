# TrafficPulse-X

> **Dynamic Relevance-Aware Traffic Forecasting & Evidence-on-Demand Spatio-Temporal Intelligence**
> 
> *"Sense only what matters. Ask the next best question. Share only what helps."*

---

## 📌 Project Status

| Phase | Description | Status |
| :--- | :--- | :---: |
| **Phase 1** | Frontend Foundation | ✅ COMPLETE |
| **Phase 2** | Traffic Network + Decision UI | ✅ COMPLETE |
| **Phase 3** | Backend + Sensor Graph Architecture | ✅ COMPLETE |
| **Phase 4** | Decision Intelligence & Information Debt Engine | ✅ COMPLETE |
| **Phase 5** | Real Dataset Preprocessing & Geospatial Network | ✅ COMPLETE |
| **Phase 6** | Traffic Prediction Machine Learning | ✅ COMPLETE |
| ↳ *Stage 6.1* | *Last Value + Historical Average Baselines* | ✅ COMPLETE |
| ↳ *Stage 6.2* | *Linear Regression Baseline* | ✅ COMPLETE |
| ↳ *Stage 6.3* | *GRU + LSTM Temporal Models* | ✅ COMPLETE |
| ↳ *Stage 6.4* | *Spatial GCN Model* | ✅ COMPLETE |
| ↳ *Stage 6.5* | *SpatialGraphLSTM Model* | ✅ COMPLETE |
| ↳ *Stage 6.6* | *Final Prediction Evaluation & Model Freeze* | ✅ COMPLETE |
| ↳ *Stage 6.7* | *Prediction Intelligence API & Dashboard Integration* | ✅ COMPLETE |
| ↳ *Stage 6.8* | *Final Phase 6 Regression & Prediction System Freeze* | ✅ COMPLETE |
| **Phase 7** | Prediction + Decision Intelligence Fusion | ✅ COMPLETE |
| **Phase 8** | Federated Learning Simulation | ✅ COMPLETE |
| ↳ *Stage 8.1* | *FL Client Partition & Training Contract* | ✅ COMPLETE |
| ↳ *Stage 8.2* | *Full-Participation Federated Graph+LSTM Training* | ✅ COMPLETE |
| ↳ *Stage 8.3* | *Federated Learning API & Dashboard Integration* | ✅ COMPLETE |
| ↳ *Stage 8.4* | *Final Federated Learning Audit & System Freeze* | ✅ COMPLETE |

---

## 📊 Dataset Specifications

TrafficPulse-X is evaluated exclusively on the **METR-LA Real Benchmark** dataset:

- **Sensors**: 207 spatial traffic sensors across Los Angeles County highways
- **Timestamps**: 34,272 time steps at 5-minute sampling intervals
- **First Timestamp**: `2012-03-01 00:00:00`
- **Last Timestamp**: `2012-06-27 23:55:00`
- **Available Telemetry**: Traffic speed (measured in miles per hour, mph)
- **Real Metadata**: Geographic coordinates (latitude/longitude), 207×207 spatial adjacency matrix, chronological timestamps
- **Unavailable Telemetry**: Volume flow, lane occupancy, hardware health *(explicitly set to `false` availability; no dummy values fabricated)*

> [!NOTE]
> TrafficPulse-X operates strictly on **HISTORICAL REPLAY** mode using benchmark telemetry, not present-day live sensor feeds.

---

## 🏗️ Architecture

```
METR-LA Benchmark Dataset (HDF5 / NPZ)
                 ↓
      Canonical Dataset Loader
                 ↓
        DataSourceManager (Single Source of Truth)
                 ↓
  ┌──────────────┴──────────────┐
  ▼                             ▼
SensorStateManager         FastAPI Endpoints (backend/main.py)
(Derived Decision State)        ↓
  │                    src/services/api.js
  └──────────────┬──────────────┘
                 ▼
          React Frontend
```

- **Single Source of Truth**: `DataSourceManager` owns all base sensor state (speed, location, region, validity). `SensorStateManager` manages derived decision states (need scores, query history, information debt).
- **Unified Backend**: Served by exactly **ONE** production FastAPI backend (`backend/main.py`).
- **No Mock Fallbacks**: Frontend API service (`src/services/api.js`) handles failures cleanly via HTTP error notices without synthetic data fallbacks.

---

## 🌐 Graph Topology & Spatial Regions

- **Sensors**: 207 real loop detectors
- **Adjacency Matrix**: 207×207 distance-based Gaussian threshold graph
- **Spatial Segmentation**: 4 deterministic geographic regions:
  - `REGION_A`: 48 sensors (North-East)
  - `REGION_B`: 57 sensors (South-East)
  - `REGION_C`: 58 sensors (Central-West)
  - `REGION_D`: 44 sensors (North-West)
  - **Total**: 207 sensors
- **Authoritative Region Checksum**: `ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2` *(SHA-256)*

---

## 📈 Forecasting Contract & Evaluated Baselines

- **Input History**: 12 historical steps (60 minutes) of speed telemetry ($X \in \mathbb{R}^{12 \times 207 \times 2}$)
- **Target Horizons**: 4 evaluation horizons: `+5 min` (step 1), `+15 min` (step 3), `+30 min` (step 6), `+60 min` (step 12)
- **Train-Only Standardization**: `mean = 58.584258 mph`, `std = 12.822883 mph` computed strictly on training split
- **Masking Contract**: Invalid target speeds (`0.0 mph`) are masked out (`y_mask = 0`) and excluded from evaluation metrics.

### Authoritative Model Performance (Raw mph Space)

| Model Category | Model | Overall MAE | Overall RMSE | Overall MAPE | +5 min MAE | +15 min MAE | +30 min MAE | +60 min MAE |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Classical Baseline** | Last Value | 3.9839 | 7.6411 | 10.15% | 2.8158 | 3.5045 | 4.2166 | 5.3987 |
| **Classical Baseline** | Historical Average | 4.1930 | 7.8618 | 13.06% | 4.1928 | 4.1928 | 4.1929 | **4.1934** 🏆 |
| **Linear Baseline** | Linear Regression | 3.9763 | 7.2053 | 11.14% | 2.6763 | 3.4026 | 4.2384 | 5.5879 |
| **Temporal Model** | GRU | 3.5669 | 7.0734 | 10.14% | 2.4349 | 3.0976 | 3.8068 | 4.9284 |
| **Temporal Model** | LSTM | 3.5613 | 7.0673 | 10.11% | 2.4372 | 3.0940 | 3.7984 | 4.9156 |
| **Spatial Graph Model** | Spatial GCN | 5.4604 | 8.9625 | 15.67% | 4.7139 | 5.1138 | 5.5939 | 6.4201 |
| **Spatio-Temporal Model** | **Graph+LSTM** 🏆 | **3.4378** 🏆 | **6.8873** 🏆 | **9.57%** 🏆 | **2.3648** 🏆 | **3.0007** 🏆 | **3.6699** 🏆 | 4.7158 |

> [!IMPORTANT]
> **Graph+LSTM** (`SpatialGraphLSTM`) achieves the lowest overall test MAE (**3.4378 mph**) and is frozen as the **Primary Centralized Prediction Model**. Historical Average remains the benchmark winner at `+60 min` (`4.1934 mph`).

---

## 🔮 Prediction Intelligence API Endpoints

- `GET /api/prediction/status`: Returns model readiness, checkpoint path (`graph_lstm_best.pt`), parameters, and device.
- `GET /api/prediction/forecast`: Returns multi-horizon (+5, +15, +30, +60 min) predictions over historical replay (`time_index`, `sensor_id`, `region_id`).
- `GET /api/prediction/metrics`: Returns frozen Stage 6.6 overall, horizon-wise, and region-wise metrics.
- `GET /api/prediction/models`: Returns authoritative 7-model comparative benchmark matrix.

---

## 🎯 Decision Intelligence Engine

TrafficPulse-X implements Evidence-on-Demand decision capabilities to minimize sensor communication bandwidth while preserving situational awareness:

- **Need Score Calculation**: Dynamically ranks sensor priority based on variance, spatial speed disagreement, query staleness, and geographic criticality.
- **Counterfactual Next-Query Planning**: Evaluates expected information gain vs byte payload costs before initiating telemetry pulls.
- **Spatial Speed Consistency**: Replaces volume flow conservation by checking speed agreement across adjacent graph nodes.
- **Bandwidth Reduction**: Achieves ~78.2% reduction in bandwidth consumption compared to continuous full-grid polling.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.14, FastAPI, PyTorch, NumPy, Pandas, scikit-learn, h5py
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Leaflet, Recharts, Lucide Icons
- **Dataset & ML Pipeline**: METR-LA HDF5, PyTorch DataLoader, Custom Scaler/Metrics Engine

---

## 🚀 Running the Project

### 1. Backend Server
```bash
python -m uvicorn backend.main:app --reload
```
*API docs available at `http://localhost:8000/docs`*

### 2. Frontend Dashboard
```bash
npm install
npm run dev
```
*UI accessible at `http://localhost:5173`*

### 3. Run Backend Test Suite
```bash
python -m pytest backend -v
```

### 4. Build Frontend Production Bundle
```bash
npm run build
```

### 5. Reproduce Machine Learning Benchmark Results
```bash
# Evaluate Linear Regression Baseline
python -m ml.baselines.evaluate_linear

# Train Temporal GRU Model
python -m ml.temporal.train --model gru

# Train Temporal LSTM Model
python -m ml.temporal.train --model lstm

# Evaluate Temporal Models ONCE on Test Set
python -m ml.temporal.evaluate_temporal
```

---

## 🧩 Phase 7 — Prediction + Decision Intelligence Fusion

Phase 7 fuses the frozen Phase 6 `Graph+LSTM` prediction model (`PredictionService`) directly into the Decision Intelligence engine (`backend/decision/`):

- **Validation-Calibrated Residual Uncertainty**: Empirical residual uncertainty derived strictly from `val.npz` validation residuals without test set leakage (+5 min: 2.19 mph, +15 min: 2.72 mph, +30 min: 3.28 mph, +60 min: 4.14 mph MAE). Categorized into validation-quantile `HIGH`, `MEDIUM`, and `LOW` confidence levels.
- **Prediction-Aware Need Score**: 9 inspectable decision factors (`spatialInfluence`, `uncertaintyProxy`, `spatialSpeedDisagreement`, `trafficDrift`, `freshness`, `informationDebt`, `coverageNeed`, `sensorHealth`, `redundancyPenalty`) with zero fake hardware health.
- **Next-Best Sensor Query Planner**: Dynamic counterfactual query selection maximizing informational utility and evidence gain.
- **Coverage Certificates & Minimum Evidence Set**: Algorithmic region coverage certificates and "minimum selected evidence set under the current heuristic".
- **Level-1 Application-Payload Accounting**: Application payload byte proxy accounting (4.2 KB per detailed query; excluding network protocol overhead).

---

## 🌐 Phase 8 — Federated Learning Simulation over METR-LA Subgraphs

Phase 8 implements decentralized spatio-temporal learning across 4 regional edge client partitions (`CLIENT_A`, `CLIENT_B`, `CLIENT_C`, `CLIENT_D`):

- **Disjoint Regional Partitions**: 207 sensors partitioned into 4 disjoint geographic induced subgraphs (`REGION_A`: 48, `REGION_B`: 57, `REGION_C`: 58, `REGION_D`: 44 sensors).
- **Full-Participation FedAvg Baseline**: 4 clients train 1 local epoch per round using Adam optimizer (`lr=1e-3`) and masked MAE loss in raw mph space.
- **Validation-Selected Global Model**: Global model selection conducted strictly on `val.npz` (Best: **Round 8**, Best Validation MAE: **`3.1536 mph`**).
- **Final FL Benchmark Performance**: Evaluated **once** on `test.npz` (`global_best.pt`): Overall Test MAE = **`3.5322 mph`**, RMSE = **`7.0956 mph`**, MAPE = **`9.99%`**.
- **Centralized Baseline Comparison**: Full-participation FedAvg achieved 3.5322 mph test MAE, **`2.75%`** higher than the frozen centralized Graph+LSTM reference baseline (`3.4378 mph`).
- **Read-Only API & Dashboard Integration**: Served by compact read-only endpoints (`/api/federated/status`, `clients`, `rounds`, `metrics`, `communication`) integrated into the compact React dashboard.


## 📁 Repository Structure

```
TrafficPulse_X/
├── backend/                  # FastAPI single-source-of-truth backend
│   ├── datasets/             # METR-LA dataset loader & preparation
│   ├── decision/             # Need score, coverage, evidence & state engine
│   ├── data_source.py        # Central DataSourceManager
│   ├── graph.py              # Spatial 207x207 graph & spatial speed consistency
│   ├── main.py               # Production FastAPI entrypoint
│   └── test_*.py             # Comprehensive Pytest regression suite
├── data/
│   ├── processed/metr-la/    # Sensor indices, regions, scalers & frozen results
│   └── raw/metr-la/          # METR-LA raw metadata (HDF5 binaries ignored by Git)
├── ml/                       # Machine Learning codebase
│   ├── baselines/            # Last Value, HA & Linear Regression implementations
│   └── temporal/             # PyTorch GRU & LSTM models, train & eval scripts
├── src/                      # React frontend dashboard application
│   ├── app/                  # App routes & main layout
│   ├── components/           # UI components (Traffic Network, Decision Intelligence)
│   ├── pages/                # Overview, Network, Decision & Prediction views
│   └── services/api.js       # HTTP API client gateway
├── index.html                # Entry HTML document
├── package.json              # Frontend dependencies & scripts
├── vite.config.js            # Vite build configuration
└── README.md                 # Authoritative project documentation
```

---

## 🔬 Scientific Disclaimers

- **Aggregate Telemetry**: TrafficPulse-X performs macroscopic traffic speed forecasting and dynamic query optimization. It does **not** track individual vehicles or personal identities.
- **Data Integrity**: Missing or unavailable METR-LA telemetry fields (such as lane volume or occupancy) are declared unavailable and **never** artificially fabricated.
- **Scope**: Designed as an empirical research and decision intelligence prototype for spatio-temporal traffic network benchmarking.
