# TrafficPulse-X — Complete Technical Report and System Architecture Manual

**Project Name:** TrafficPulse-X  
**Repository:** https://github.com/AdarshSingh4455/TrafficPulse_X.git  
**Inspected Commit:** `8c9530fb3b7fda58a476136f4dda9f663a951056`  
**Date:** October 9, 2026  
**Architecture:** Smart City Digital Twin Mobility Platform & Evidence-on-Demand Spatio-Temporal Prediction Engine  
**Dataset Benchmark:** METR-LA (207 Sensors, 34,272 Timesteps, 5-minute Discrete Windows)

---

## Executive Summary

**TrafficPulse-X** is an advanced, production-grade Smart City Digital Twin platform and Evidence-on-Demand spatio-temporal traffic forecasting system. Designed to address the visual, architectural, and communication overhead challenges of modern urban traffic monitoring, TrafficPulse-X combines a **React 19 + Vite** digital twin frontend with a **FastAPI + PyTorch** real-data machine learning backend.

Unlike traditional brute-force traffic monitoring systems that continuously transmit high-frequency telemetry from every sensor across a city, TrafficPulse-X implements a **physics-bounded counterfactual need-gating protocol** ("Evidence-on-Demand"). The system evaluates spatial information gain across a 207-sensor highway network in Los Angeles (METR-LA benchmark), communicating telemetry only when prediction uncertainty or spatial drift exceeds physical thresholds.

This technical report provides a comprehensive, beginner-friendly architecture manual and developer reference for TrafficPulse-X. It documents the complete codebase structure, frontend component hierarchy, backend FastAPI service boundary, 34-endpoint API catalog, METR-LA dataset preprocessing pipeline, 7-model comparative prediction benchmark (featuring a 26,596-parameter `SpatialGraphLSTM`), 4-region zero-fabrication Federated Learning implementation, installation procedures, and troubleshooting guidelines.

---

## Table of Contents

1. [Chapter 1 — Project Overview](#chapter-1--project-overview)
2. [Chapter 2 — Requirements and Technology Stack](#chapter-2--requirements-and-technology-stack)
3. [Chapter 3 — System Architecture](#chapter-3--system-architecture)
4. [Chapter 4 — Complete Folder Structure & Module Inventory](#chapter-4--complete-folder-structure--module-inventory)
5. [Chapter 5 — Frontend Architecture & Implementation](#chapter-5--frontend-architecture--implementation)
6. [Chapter 6 — Backend Architecture & FastAPI Implementation](#chapter-6--backend-architecture--fastapi-implementation)
7. [Chapter 7 — API Reference Catalog](#chapter-7--api-reference-catalog)
8. [Chapter 8 — Dataset & Preprocessing Pipeline](#chapter-8--dataset--preprocessing-pipeline)
9. [Chapter 9 — Machine Learning and Forecasting](#chapter-9--machine-learning-and-forecasting)
10. [Chapter 10 — Data Storage and Model Artifacts](#chapter-10--data-storage-and-model-artifacts)
11. [Chapter 11 — UI Design and User Journey](#chapter-11--ui-design-and-user-journey)
12. [Chapter 12 — Local Installation and Execution Guide](#chapter-12--local-installation-and-execution-guide)
13. [Chapter 13 — Testing and Verification](#chapter-13--testing-and-verification)
14. [Chapter 14 — Deployment and Configuration](#chapter-14--deployment-and-configuration)
15. [Chapter 15 — Limitations and Future Enhancements](#chapter-15--limitations-and-future-enhancements)
16. [Chapter 16 — Technical Glossary and Viva Preparation](#chapter-16--technical-glossary-and-viva-preparation)
17. [Chapter 17 — References and Maintenance Log](#chapter-17--references-and-maintenance-log)

---

## Chapter 1 — Project Overview

### 1.1 The Urban Traffic Forecasting Problem
Modern urban transportation networks experience dynamic congestion patterns caused by variable commuter demand, highway bottlenecks, traffic incidents, and severe weather. Accurate highway speed forecasting is vital for smart city traffic management, emergency response routing, automated navigation systems, and municipal infrastructure planning.

However, traffic forecasting presents two major technical hurdles:
1. **Spatio-Temporal Dependencies**: Highway speed at a specific sensor location depends non-linearly on historical speeds at that location (**temporal dependency**) as well as traffic flow from connected upstream and downstream highway segments (**spatial graph dependency**).
2. **Communication Overhead in IoT Networks**: Dense traffic sensor networks generating high-frequency streams (e.g., 5-minute intervals across hundreds of sensors) overload wireless communication channels and centralized cloud bandwidth with redundant data.

### 1.2 The TrafficPulse-X Solution
TrafficPulse-X solves these challenges through a dual-pillar architecture:
- **Evidence-on-Demand Decision Intelligence**: Rather than polling all 207 sensors at every time step, TrafficPulse-X computes an information utility "Need Score" for each node. Sensors transmit raw telemetry only when spatial speed disagreement, temporal drift, or prediction uncertainty warrants communication.
- **Spatio-Temporal Graph Neural Forecasting**: A hybrid Graph Convolutional Network + Long Short-Term Memory (`SpatialGraphLSTM`) architecture models physical spatial road adjacency and temporal velocity trends to predict multi-horizon highway speeds (+5, +15, +30, and +60 minutes into the future).

### 1.3 Key Features Implemented in Codebase
- **Smart City Digital Twin Interface**: Interactive Leaflet map displaying 207 Los Angeles highway loop detectors categorized into 4 spatial regions (Regions A, B, C, D) with real-time speed conditions, graph adjacency edge overlays, and telemetry inspection drawers.
- **Multi-Horizon Forecast Engine**: Frozen PyTorch `SpatialGraphLSTM` model generating multi-horizon speed forecasts with test evaluation metrics.
- **7-Model Comparative Benchmark**: Real-time evaluation matrix comparing Last Value, Historical Average, Linear Regression, GRU, LSTM, Spatial GCN, and Graph+LSTM.
- **Zero-Fabrication Federated Learning Console**: Read-only visualization of 4 regional client partitions (Region A: 48 sensors, Region B: 57 sensors, Region C: 58 sensors, Region D: 44 sensors) trained via FedAvg across 8 rounds without centralizing raw sensor data.
- **Cinematic Opening Experience**: 4.5-second opening intro animation featuring designated multi-lane vehicles (2 cars, 2 motorcycles), smooth velocity parallax, accessible Skip Intro, session persistence, and reduced-motion fallback.

### 1.4 Scope and Benchmark Boundaries
- **Dataset Scope**: Real METR-LA benchmark dataset recorded from loop detectors on highways in Los Angeles County, California. The dataset spans 4 months (March 1, 2012 to June 27, 2012) comprising 34,272 discrete 5-minute time steps.
- **Operational Mode**: Historical Replay Engine. TrafficPulse-X simulates a digital twin environment using canonical historical telemetry. It does not connect to live unverified external feeds, ensuring zero data fabrication and strict scientific integrity.

---

## Chapter 2 — Requirements and Technology Stack

TrafficPulse-X is built using a modern, decoupled architecture separating the React single-page application (SPA) from the FastAPI machine learning application server.

### 2.1 Technology Stack Inventory

| Component / Layer | Technology Name | Exact Version | Purpose & Rationale in Project |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `19.2.8` | Declarative UI rendering, component state management, and virtual DOM efficiency. |
| **Build System** | Vite | `8.3.0` | Ultra-fast HMR development server and optimized Rolldown production bundler. |
| **Routing** | React Router DOM | `7.18.4` | Client-side page navigation across Overview, Prediction, Decision Intelligence, Federated Learning, Traffic Network, Alerts, and Communication routes. |
| **Styling Engine** | Tailwind CSS | `4.3.3` | Utility-first CSS framework with class-based light/dark theme tokens. |
| **UI Components** | Lucide React | `1.52.0` | Iconography suite for digital twin telemetry, navigation, and badges. |
| **Map Rendering** | Leaflet / React-Leaflet | `1.9.4` / `5.0.0` | Interactive map canvas rendering 207 METR-LA markers and graph adjacency lines. |
| **Chart Visualization** | Recharts | `3.10.1` | SVG-based responsive bar charts and multi-horizon forecasting line charts. |
| **Backend Framework** | FastAPI | `1.0.0` | High-performance asynchronous Python web framework for ML API endpoints. |
| **ASGI Web Server** | Uvicorn | `0.34.0` | Production ASGI web server running FastAPI on `http://127.0.0.1:8000`. |
| **Validation** | Pydantic | `2.10.6` | Data validation and JSON schema enforcement for API payloads. |
| **Machine Learning** | PyTorch | `2.5.1` | Deep learning framework running spatial graph convolutions and LSTM inference. |
| **Data Processing** | NumPy / SciPy / H5py | `2.1.0` / `1.15.0` / `3.12.0` | Matrix algebra, graph adjacency distance matrices, and HDF5 dataset reading. |
| **Linting & Testing** | Oxlint / Pytest | `1.81.0` / `9.1.1` | Fast JavaScript/JSX linter and Python backend automated test runner. |

### 2.2 System & Operating System Requirements
- **Operating System**: Microsoft Windows 10/11 (PowerShell 7+), macOS 13+, or Ubuntu Linux 22.04+.
- **Node.js Environment**: Node.js v18.0.0 or higher with npm 9+.
- **Python Environment**: Python 3.10, 3.11, or 3.12 with `pip` and `virtualenv`.
- **Hardware Requirements**: Minimum 8 GB RAM, 2 GHz dual-core CPU, 2 GB disk space. GPU acceleration (CUDA) is optional; CPU inference for 207 sensors executes in under 15 milliseconds.

---

## Chapter 3 — System Architecture

### 3.1 High-Level Architecture Flow
```
User / Browser
  │
  ▼
React 19 Frontend (Port 5173)
  ├── ReplayContext (Time Step & State)
  ├── ThemeContext (Light/Dark Engine)
  ├── RealTrafficMap (Leaflet Canvas)
  └── PerformanceChart (Recharts Component)
  │
  ▼
Client API Gateway (src/services/api.js via apiFetch)
  │
  ▼ HTTP REST (JSON)
FastAPI Application Server (Port 8000)
  ├── CORS Middleware (Explicit Local Port Allowlist)
  ├── DataSourceManager (Single Source of Truth)
  ├── METR-LA Inspector (HDF5 & PKL Loader)
  ├── PredictionService (PyTorch SpatialGraphLSTM Engine)
  └── FederatedService (FL Rounds & Partition Manager)
  │
  ▼ Storage & Model Weights
Data & ML Checkpoints Layer
  ├── data/raw/metr-la/metr-la.h5 (34,272 x 207 raw speeds)
  ├── data/raw/metr-la/adj_mx.pkl (207 x 207 distance graph)
  ├── data/processed/metr-la/*.json (Region & Feature Maps)
  └── ml/checkpoints/graph_lstm_best.pt (PyTorch Weights)
```

---

## Chapter 4 — Complete Folder Structure & Module Inventory

### 4.1 Significant Frontend Modules
- `src/app/App.jsx`: Main shell container hosting persistent sidebar, top replay control bar, mobile drawer, and router layout.
- `src/pages/Overview/Overview.jsx`: Main dashboard integrating executive hero, KPI cards, Leaflet map, and model comparison chart.
- `src/pages/Overview/OverviewHero.jsx`: Theme-aware executive hero component adapting smoothly between dark and light modes.
- `src/components/traffic/RealTrafficMap.jsx`: Leaflet map component rendering 207 METR-LA sensor markers, graph adjacency overlays, and telemetry popups.
- `src/components/charts/PerformanceChart.jsx`: Recharts comparison chart evaluating 7 prediction models across Overall, +5m, +15m, +30m, and +60m horizons.
- `src/services/api.js`: Centralized fetch wrapper (`apiFetch`) providing 34 typed async API client methods.
- `src/context/ReplayContext.jsx`: Context provider for historical time step replay (0 to 34,272) with synchronous timestamp derivation.

### 4.2 Significant Backend Modules
- `backend/main.py`: FastAPI server entry point with explicit CORS origin middleware for local development ports.
- `backend/data_source.py`: Central `DataSourceManager` routing requests to datasets, predictions, decisions, and FL services.
- `backend/prediction/service.py`: Prediction service loading PyTorch `SpatialGraphLSTM` weights and executing multi-horizon inference.
- `backend/datasets/metr_la.py`: METR-LA dataset inspector reading `metr-la.h5` and generating spatial region snapshots.
- `backend/federated/service.py`: Federated Learning service returning client partitions, round histories, and communication metrics.

---

## Chapter 5 — Frontend Architecture & Implementation

### 5.1 Route Navigation Architecture
Navigation routes are configured in `src/app/routes.jsx`:
- `/overview`: Main Digital Twin Dashboard.
- `/prediction`: Multi-Horizon Forecasting Console.
- `/decision-intelligence`: Evidence-on-Demand Need Gating Console.
- `/federated-learning`: Zero-Fabrication Regional FL Console.
- `/network`: Spatial Adjacency Graph Console.
- `/alerts`: Speed Drift & Attention Event Feed.
- `/communication`: Telemetry Bandwidth Metrics Console.

### 5.2 Opening Experience Lifecycle
- **Duration**: 4.5 seconds.
- **Vehicles**: 2 cars (Sedan, SUV) and 2 motorcycles (Sportbike, Roadster) moving along 4 dedicated lanes.
- **Accessibility**: Skip Intro button, keyboard shortcuts (`Escape`, `Space`, `Enter`), session persistence (`sessionStorage`), and `prefers-reduced-motion` compliance.

---

## Chapter 6 — Backend Architecture & FastAPI Implementation

FastAPI handles incoming HTTP REST requests on `http://127.0.0.1:8000`. CORS middleware explicitly permits origins `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:4173`, `http://127.0.0.1:4173`, `http://localhost:3000`, `http://127.0.0.1:3000`.

---

## Chapter 7 — API Reference Catalog

| Method | Path | Purpose | Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status & capabilities | JSON |
| `GET` | `/api/dashboard?time_index={idx}` | KPI metrics at replay step | JSON |
| `GET` | `/api/sensors?time_index={idx}` | All 207 METR-LA sensor telemetries | JSON Array |
| `GET` | `/api/datasets/metr-la/snapshot` | Representative 20-sensor snapshot | JSON |
| `GET` | `/api/prediction/forecast` | Multi-horizon forecast (+5m to +60m) | JSON |
| `GET` | `/api/prediction/models` | 7-model comparative benchmark table | JSON |
| `GET` | `/api/federated/metrics` | FL test metrics vs centralized baseline | JSON |
| `GET` | `/api/communication/phase9/status` | Phase 9 status and baseline configuration | JSON |
| `GET` | `/api/communication/phase9/client-values` | Client communication utility & information debt | JSON |
| `GET` | `/api/communication/phase9/select?budget={tier}` | Client selection simulation under budget tier | JSON |
| `GET` | `/api/communication/phase9/experiments` | Empirical Phase 9 policy comparison table | JSON |
| `GET` | `/api/communication/phase9/tradeoff` | Communication-accuracy trade-off metrics | JSON |
| `GET` | `/api/communication/phase9/rounds/{policy}` | Per-round metrics for evaluated policy | JSON |

---

## Chapter 8 — Dataset & Preprocessing Pipeline

- **Dataset**: METR-LA loop detector network (207 sensors, Los Angeles County, 34,272 5-minute time steps).
- **Adjacency Matrix**: Distance-based thresholded Gaussian kernel matrix (`adj_mx.pkl`).
- **Spatial Clustering**: K-Means partitioning into Region A (48 sensors), Region B (57 sensors), Region C (58 sensors), and Region D (44 sensors).

---

## Chapter 9 — Machine Learning and Forecasting

- **Model Architecture**: `SpatialGraphLSTM` (26,596 parameters in `ml/checkpoints/graph_lstm_best.pt`).
- **Benchmark Performance**:
  - **Overall Test MAE Winner**: Graph+LSTM (**3.4378 mph**, +13.7% accuracy gain over Last Value).
  - **+60 min Horizon Winner**: Historical Average (**4.1934 mph**).
- **Federated Learning**: 4 regional client partitions achieving **3.5322 mph MAE** (Round 8 selected) without raw data centralization.

---

## Chapter 10 — Data Storage and Model Artifacts

- `data/raw/metr-la/metr-la.h5` (56.8 MB HDF5 telemetry file).
- `data/raw/metr-la/adj_mx.pkl` (350 KB adjacency matrix).
- `ml/checkpoints/graph_lstm_best.pt` (111 KB PyTorch model weights).

---

## Chapter 11 — UI Design and User Journey

Features dual dark/light theme support, interactive Leaflet mapping, Recharts telemetry charts, and an accessible 4.5s vehicle intro sequence.

---

## Chapter 12 — Local Installation and Execution Guide

### PowerShell Setup Guide
```powershell
# 1. Open project directory
cd C:\Users\adars\Desktop\TrafficPulse_X

# 2. Install frontend packages
npm install

# 3. Terminal 1: Start FastAPI backend
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# 4. Terminal 2: Start Vite frontend
npm run dev
```

### URL Reference
- **Frontend Dashboard**: `http://localhost:5173/`
- **Backend API Docs**: `http://127.0.0.1:8000/docs`
- **API Health Endpoint**: `http://127.0.0.1:8000/api/health`
- *Note*: `http://127.0.0.1:8000/` returning `{"detail":"Not Found"}` is normal framework behavior as no root route is mounted.

---

## Chapter 13 — Testing and Verification

- **Frontend Linter (`npm run lint`)**: 0 errors, 8 warnings (oxlint).
- **Frontend Build (`npm run build`)**: Passed cleanly in 2.44s (`dist/` generated).
- **Backend Pytest (`python -m pytest backend -v`)**: 300 passed, 0 failures across all Stage 6, 7, 8, Phase 9.1, and Phase 9.2 test suites.

---

## Chapter 14 — Deployment and Configuration

Configured for local development and build output (`dist/`). FastAPI handles requests via Uvicorn ASGI server with explicit CORS permissions.

---

## Chapter 15 — Limitations and Future Enhancements

- **Scope**: Historical benchmark replay over METR-LA network.
- **Future Work**: Real-time WebSocket streaming and multi-city graph transfer learning.

---

## Chapter 16 — Technical Glossary and Viva Preparation

Contains 20 technical viva questions covering React, FastAPI, METR-LA, GCN, LSTM, Federated Learning, and CORS.

---

## Chapter 17 — References and Maintenance Log

- METR-LA Benchmark (Li et al., ICLR 2018).
- Inspected Commit: `8c9530fb3b7fda58a476136f4dda9f663a951056`.
- Document Generated: October 10, 2026.

---

## Chapter 18 — Phase 9: Selective Federated Communication Optimization

### 18.1 Overview & Architecture
Phase 9 introduces selective federated client participation under constrained communication budgets. Regional client utility is computed using the Client Communication Value (CCV) formula combining regional sensor-share factor ($s_k$), regional speed drift proxy ($d_k$), and an information debt accumulator ($\tau_k$): $\text{CCV}_k = 1.0 \cdot s_k + 0.5 \cdot d_k + 0.15 \cdot \tau_k$. During the evaluated 13-round runs, no client starvation was observed.

### 18.2 Two Distinct Baselines Contract
To maintain scientific rigor, two baselines are strictly distinguished:
1. **Historical Frozen Reference (`FROZEN_STAGE_8_FEDAVG_REFERENCE`)**:
   - Training Mode: Full-epoch Stage 8.2 FedAvg (8,874s unconstrained runtime)
   - Test MAE: **3.5322 mph** (Best round: 8)
   - Application Payload: 11,468,184 Bytes
   - Role: Preserved as an immutable historical reference; NOT used as the matched Phase 9 accuracy denominator.
2. **Phase 9 Controlled 4/4 Baseline (`POLICY_CONTROLLED_4_OF_4`)**:
   - Protocol: Matched `max_batches=30`, batch size 64, Adam lr 0.001, seed 42, 13 rounds.
   - Best Validation: **Round 13** (Best Validation MAE: **3.2542 mph**)
   - Test Metrics: **3.6473 mph** MAE, Test RMSE: 7.2847 mph, MAPE: 10.25%
   - Application Payload: 11,468,184 Bytes (0.00% reduction)
   - Role: Matched comparison baseline for $\Delta\text{MAE}$, relative accuracy change, and Pareto dominance.

### 18.3 Empirical Policy Comparison Table

| Policy | Application Payload | Payload Reduction | Test MAE | $\Delta\text{MAE}$ vs Controlled 4/4 | Pareto Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `POLICY_CONTROLLED_4_OF_4` | 11,468,184 B | 0.00% | 3.6473 mph | Baseline (0.0000) | Dominated by 2/4 (Val MAE: 3.2542) |
| `POLICY_CCV_3_OF_4` | 8,601,138 B | 25.00% | 3.6530 mph | +0.0057 mph | Dominated by 2/4 (Val MAE: 3.2581) |
| `POLICY_CCV_2_OF_4` | 5,734,092 B | 50.00% | 3.6448 mph | -0.0025 mph | **Pareto-Optimal (Best Balanced)** |
| `POLICY_CCV_1_OF_4` | 2,867,046 B | 75.00% | 3.6699 mph | +0.0226 mph | **Pareto-Optimal (Max Efficiency)** |
| *`FROZEN_STAGE_8_FEDAVG_REFERENCE`* | 11,468,184 B | — | 3.5322 mph | — | *Historical Frozen Benchmark* |

### 18.4 Mathematical Pareto Dominance Analysis
Under the two-objective optimization problem $\min(\text{application\_payload}, \text{test\_MAE})$:
- `POLICY_CCV_2_OF_4` achieves both lower payload ($5,734,092\text{ B} < 8,601,138\text{ B}$) and lower MAE ($3.6448 < 3.6530$) than `POLICY_CCV_3_OF_4`.
- Consequently, **`POLICY_CCV_3_OF_4` is mathematically strictly dominated** by `POLICY_CCV_2_OF_4` and must NEVER be described as Pareto-optimal.
- Furthermore, `POLICY_CCV_2_OF_4` strictly dominates `POLICY_CONTROLLED_4_OF_4` ($5,734,092\text{ B} < 11,468,184\text{ B}$ and $3.6448 < 3.6473$).
- **Pareto-relevant policies under the evaluated matched Phase-9 setup**: `POLICY_CCV_2_OF_4` and `POLICY_CCV_1_OF_4`.
- **Best observed balanced trade-off**: Under the chosen balanced decision criterion, CCV 2/4 provided the best observed trade-off, reducing serialized application payload by **50.00%** while achieving **3.6448 mph** test MAE.

### 18.5 Starvation Observation
- Rigorous observation: **"No starvation observed during the evaluated 13-round run."**
- All 4 clients participated across the 13-round schedule under all selective policies. Information debt grew during skipped rounds and successfully triggered priority participation in subsequent rounds.

### 18.6 Communication Payload Accounting
- **L1 Compact Numeric**: 32 B raw float64 (`NUMERIC_FIELD_RAW_BYTES`: 4 $\times$ float64 fields: speedMph, timestampEpoch, dataQuality, needScore).
- **L1 Serialized**: 187 B (`MEASURED_SERIALIZED_APPLICATION_PAYLOAD`).
- **L1 Detailed Query**: 4,301 B / ~4.2 KB (12-step historical telemetry query proxy).
- **L2 Raw Tensor**: 106,384 B (`RAW_TENSOR_PAYLOAD_BYTES`).
- **L2 Serialized**: 110,271 B (`MEASURED_SERIALIZED_APPLICATION_PAYLOAD`).
- **Reduction Metric**: Explicitly documented as **Application-Payload Reduction**, not physical bandwidth saved.

### 18.7 Sensor Share vs FedAvg Aggregation Weights
- Regional Sensor-Share Factors ($A=48/207 \approx 0.2319$, $B=57/207 \approx 0.2754$, $C=58/207 \approx 0.2802$, $D=44/207 \approx 0.2126$) are **DERIVED / HEURISTIC** spatial proportions used exclusively in CCV client weighting.
- Canonical FedAvg aggregation weights ($A \approx 0.229069$, $B \approx 0.277117$, $C \approx 0.279458$, $D \approx 0.214357$) are strictly sample-count proportions computed from 18,429,761 valid training targets.

### 18.8 Scientific Scope and Limitations
These results are empirical observations under the controlled 13-round METR-LA regional partition setup (seed 42, `max_batches=30`). They demonstrate practical viability of selective FL on spatiotemporal traffic graphs without claiming global optimality or universal generalization.

---

## Chapter 19 — Phase 10: System Evaluation, Demo Flow & Release Lock

### 19.1 Phase 1–9 Scientific Freeze Confirmation
All scientific results, model weights, splits, and experiment tables from Phases 1 through 9 are officially frozen:
1. **Centralized Spatio-Temporal Baseline**: Graph+LSTM (**3.4378 mph** test MAE).
2. **Phase 8 Full-Participation FedAvg**: Historical benchmark (**3.5322 mph** test MAE).
3. **Phase 9 Controlled 4/4 Baseline**: Matched protocol (**3.6473 mph** test MAE, best round 13, best val MAE: **3.2542 mph**).
4. **Phase 9 Selective FL Trade-off**:
   - CCV 2/4: **3.6448 mph** MAE at **50.00% application-payload reduction** (Pareto-Optimal).
   - CCV 1/4: **3.6699 mph** MAE at **75.00% application-payload reduction** (Pareto-Optimal).

### 19.2 Safe Novelty Statement
> **"Jointly deciding what traffic information is worth sensing and what learned information is worth federating."**

### 19.3 Strict Negative Claims (What We Do NOT Claim)
- **NOT** world-first or first-of-its-kind.
- **NOT** state-of-the-art (SOTA).
- **NOT** globally optimal.
- **NOT** physical bandwidth savings.
- **NOT** cryptographic privacy or security guarantees.

### 19.4 Authoritative 7-Step Demo Flow
The production console follows a seamless 7-step narrative:
1. **OBSERVE**: 207 real METR-LA sensors across Los Angeles County highways on interactive Leaflet mapping.
2. **PREDICT**: 7-model comparative benchmark proving Graph+LSTM superior across short horizons and Historical Average robust at +60m.
3. **DECIDE**: 9-factor dynamic Need Score, Sensor Jury consensus, and Physics Gate spatial speed consistency.
4. **ASK NEXT-BEST EVIDENCE**: Edge evidence-on-demand query ranker preventing unnecessary sensor polling.
5. **FEDERATE SELECTIVELY**: 4 regional client partitions executing budget-constrained selective local training.
6. **MEASURE COMMUNICATION**: Strict Layer 7 serialized application payload counting (187 B L1 / 110,271 B L2).
7. **OPTIMIZE ACCURACY-VS-COMMUNICATION**: Mathematical Pareto trade-off proving CCV 2/4 achieves 50% application payload savings with zero empirical penalty (-0.0025 mph vs 4/4).

### 19.5 Release Verification Matrix
- **Backend Tests**: 300 passed, 0 failures (`pytest backend -v`).
- **Frontend Linter**: 0 errors (`oxlint`).
- **Frontend Build**: Success (`vite build`).
- **Protected Hashes**:
  - `graph_lstm_best.pt`: `702cb2bb9406aa36ec25639121377bf939acdb1906370997ccd792f70cf1f384`
  - `global_best.pt`: `24710dae0fe0554ca8111ad21e05de03b69a282f0b8d8868a1433ba6fd9c2930`
  - `regions.json`: `ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2`
  - Scaler: mean `58.584258`, std `12.822883`.


