# TrafficPulse-X Phase 8 Stage 8.2 — Federated Learning Training Summary

> **Full-Participation 4-Client FedAvg Simulation (Real METR-LA Benchmark)**

---

## 📌 Executive Summary

- **Initialization**: Fresh deterministic `SpatialGraphLSTM` (`seed=42`). *Centralized trained checkpoint was NOT used for initialization.*
- **Rounds Completed**: 13 / 20 (Early stopping triggered: `True`)
- **Best Round**: **Round 8**
- **Best Global Validation MAE**: **3.1536 mph**
- **Total Training Duration**: **8874.77 s** (Round 1 duration: 203.31 s)

---

## 📊 Final FL Test Set Evaluation (global_best.pt)

### Overall Benchmark Metrics
- **Overall Test MAE**: **3.5322 mph**
- **Overall Test RMSE**: **7.0956 mph**
- **Overall Test MAPE**: **9.99%**

### Per-Horizon Test MAE
- **+5 min**: `2.4121` mph
- **+15 min**: `3.0663` mph
- **+30 min**: `3.7698` mph
- **+60 min**: `4.8806` mph

### Per-Region Test MAE
- **REGION_A** (North-East, 48 sensors): `2.4446` mph
- **REGION_B** (South-East, 57 sensors): `4.0770` mph
- **REGION_C** (Central-West, 58 sensors): `3.4840` mph
- **REGION_D** (North-West, 44 sensors): `4.0979` mph

---

## 🔬 Centralized Reference Comparison

- **Centralized Graph+LSTM Test MAE**: `3.4378` mph
- **Federated FedAvg Test MAE**: `3.5322` mph
- **Absolute Difference**: `+0.0944` mph
- **Relative Difference**: `+2.75%`

---

## 📦 Communication Byte Accounting

- **Raw Tensor Payload Bytes per Model**: `106,384` bytes (103.89 KB)
- **Serialized Application Payload Bytes per Model**: `110,271` bytes (107.69 KB)
- **Cumulative FL Serialized Payload Bytes (13 rounds)**: `7,167,615` bytes (6.84 MB)
