# TrafficPulse-X Demo & Viva Voce Guide

This document provides a safe demonstration sequence and scientifically accurate answers for technical presentations, project reviews, and viva voce examinations.

---

## 1. Project Elevator Pitch

> *"TrafficPulse-X is an Evidence-on-Demand Federated Traffic-Flow Prediction Platform designed around the concept: 'Sense only what matters. Ask the next best question. Share only what helps.' Built on the real METR-LA Los Angeles highway benchmark, it pairs dynamic spatio-temporal prediction (`Graph+LSTM`) with a multi-factor Decision Intelligence Engine and a 4-client Federated Learning framework to predict traffic speeds while systematically auditing communication payload costs."*

---

## 2. Core Project Objectives Status

| Objective | Description | Implementation Status |
|---|---|---|
| **Objective 1: Prediction Accuracy** | Multi-horizon spatio-temporal traffic speed forecasting (+5m to +60m). | **COMPLETE & EVALUATED** (Graph+LSTM test MAE = 3.4378 mph; FL test MAE = 3.5322 mph) |
| **Objective 2: Communication Cost Accounting & Optimization** | Payload auditing and selective edge communication. | **BASELINE ACCOUNTING COMPLETE** (Level 1: 32B/187B; Level 2: 11.47 MB); **OPTIMIZATION PENDING PHASE 9** |

---

## 3. Recommended 5-Minute Demonstration Sequence

1. **Overview Page**:
   - Highlight network-wide METR-LA speed statistics (207 sensors).
   - Point out real-time replay controls and baseline communication stats.
2. **Traffic Network Page**:
   - Demonstrate the interactive geospatial Leaflet map showing sensor locations.
   - Show sensor selection and historical speed replay time-series.
3. **Prediction Dashboard**:
   - Compare the 7 benchmark models (`Graph+LSTM`, `LSTM`, `GRU`, `Historical Average`, `Spatial GCN`, `Linear Regression`, `Last Value`).
   - Highlight four selected forecast horizons (+5m, +15m, +30m, +60m).
4. **Decision Intelligence Dashboard**:
   - Explain the 9-factor Need Score calculation (`DERIVED`).
   - Demonstrate Sensor Jury voting, Physics Gate spatial speed consistency, and Next-Best Query ranking.
5. **Federated Learning Dashboard**:
   - Explain regional partitioning across 4 Regional FL Clients (`REGION_A` to `REGION_D`).
   - Compare Round 8 validation-selected model results (+2.75% gap vs centralized reference).
6. **Communication Dashboard**:
   - Explain dual-level application payload accounting (Level 1 sensor-to-edge query vs. Level 2 client-to-server weight updates).
   - Clarify that Phase 9 selective communication optimization is not yet evaluated.

---

## 4. Viva Voce Questions & Safe Answers

### Q1: Is the traffic dataset real or synthetic?
**Safe Answer**: The dataset is the authoritative **METR-LA** benchmark containing real traffic speed telemetry collected from 207 highway sensors in Los Angeles County (March 1, 2012 to June 27, 2012).

### Q2: Is the system operating on live present-day traffic streaming?
**Safe Answer**: No. The system operates on **Historical Replay** and **Runtime Inference** over the real METR-LA benchmark dataset.

### Q3: What traffic signals are predicted? Do you predict volume or occupancy?
**Safe Answer**: The model predicts **vehicle speed in mph**. Flow (volume) and occupancy are not available in the METR-LA benchmark.

### Q4: Why select Graph+LSTM over pure GCN or standard LSTM?
**Safe Answer**: Traffic networks exhibit both spatial dependencies (neighboring road links) and temporal dependencies (time-series trends). `Graph+LSTM` combines Spatial Graph Convolutions ($\tilde{D}^{-1/2} \tilde{A} \tilde{D}^{-1/2}$) with temporal LSTM cells, achieving the best overall test MAE of **3.4378 mph**, outperforming pure Spatial GCN (5.4604 mph) and standard LSTM (3.5613 mph).

### Q5: Why is Historical Average better at the +60 minute horizon?
**Safe Answer**: Over long forecast horizons (+60 minutes), non-stationary traffic variance increases significantly. Historical Average acts as a variance-smoothing estimator, achieving **4.1934 mph** MAE compared to Graph+LSTM's 4.7158 mph at +60 minutes.

### Q6: Does the Federated Learning implementation guarantee data privacy?
**Safe Answer**: No security or cryptographic privacy guarantee is claimed. The system executes a **Federated Learning Simulation** using 4 Regional FL Clients under FedAvg to evaluate regional data partitioning performance.

### Q7: What communication costs are measured?
**Safe Answer**: Application-layer payload sizes are measured: Level 1 single sensor query (32 numeric float64 bytes / 187 serialized bytes) and Level 2 FL model updates (110,271 serialized bytes per client update; 11.47 MB total over 13 rounds). Transport/network layer protocol headers are excluded.

### Q8: Is communication optimization (e.g. 78.2% bandwidth savings) active?
**Safe Answer**: No. Communication baseline accounting is complete; Phase 9 communication optimization (selective FL participation, relevance scoring, and communication budgets) is marked as `NOT_STARTED` / `NOT_EVALUATED`.
