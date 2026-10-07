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
| **Phase 6** | Traffic Prediction Machine Learning | 🟡 IN PROGRESS |
| ↳ *Stage 6.1* | *Last Value + Historical Average Baselines* | ✅ COMPLETE |
| ↳ *Stage 6.2* | *Linear Regression Baseline* | ✅ COMPLETE |
| ↳ *Stage 6.3* | *GRU + LSTM Temporal Models* | ✅ COMPLETE |
| ↳ *Stage 6.4* | *Spatio-Temporal Graph Neural Network* | ⏳ NEXT |

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
  - `REGION_A`: 48 sensors (South-East)
  - `REGION_B`: 57 sensors (Central-West / Downtown)
  - `REGION_C`: 58 sensors (North-East / Valleys)
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
| **Stage 6.1 Baseline** | Last Value | 3.9839 | 7.6411 | 10.15% | 2.8158 | 3.5045 | 4.2166 | 5.3987 |
| **Stage 6.1 Baseline** | Historical Average | 4.1930 | 7.8618 | 13.06% | 4.1928 | 4.1928 | 4.1929 | **4.1934** 🏆 |
| **Stage 6.2 Baseline** | Linear Regression | 3.9763 | 7.2053 | 11.14% | 2.6763 | 3.4026 | 4.2384 | 5.5879 |
| **Stage 6.3 Temporal** | GRU | 3.5669 | 7.0734 | 10.14% | **2.4349** 🏆 | 3.0976 | 3.8068 | 4.9284 |
| **Stage 6.3 Temporal** | **LSTM** | **3.5613** 🏆 | **7.0673** 🏆 | **10.11%** 🏆 | 2.4372 | **3.0940** 🏆 | **3.7984** 🏆 | 4.9156 |

> [!IMPORTANT]
> **LSTM** achieved the lowest overall validation loss and is selected as the temporal backbone for future spatio-temporal graph models.

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
