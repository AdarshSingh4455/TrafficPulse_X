# TrafficPulse-X Phase 8 Stage 8.2 — Federated Learning Training Summary

> **Full-Participation 4-Client FedAvg Simulation (Real METR-LA Benchmark)**

---

## 📌 Executive Summary

- **Initialization**: Fresh deterministic `SpatialGraphLSTM` (`seed=42`). *Centralized trained checkpoint was NOT used for initialization.*
- **Rounds Completed**: 13 / 20 (Early stopping triggered: `True`)
- **Best Round**: **Round 8**
- **Best Global Validation MAE**: **3.1536 mph**
- **Total Wall-Clock Training Duration**: **8874.77 s** (Round 1 duration: 203.31 s)

---

## 📊 Scientific Performance Evaluation (`test.npz`)

Evaluated **EXACTLY ONCE** on `global_best.pt` (Round 8) over the full 207-sensor test split:

- **Overall Test MAE**: **3.5322 mph**
- **Overall Test RMSE**: **7.0956 mph**
- **Overall Test MAPE**: **9.99%**

### Horizon Breakdown
- **+5 min**: `2.4121 mph`
- **+15 min**: `3.0663 mph`
- **+30 min**: `3.7698 mph`
- **+60 min**: `4.8806 mph`

### Regional Breakdown
- **REGION_A (North-East)**: `2.4446 mph`
- **REGION_B (South-East)**: `4.0770 mph`
- **REGION_C (Central-West)**: `3.4840 mph`
- **REGION_D (North-West)**: `4.0979 mph`

### Comparison to Centralized Reference Baseline
Full-participation FedAvg achieved 3.5322 mph test MAE, 2.75% higher than the frozen centralized Graph+LSTM reference baseline of 3.4378 mph.

---

## 📡 Payload Communication Accounting

- **Parameter Count**: 26,596 FP32 parameters per model
- **RAW_TENSOR_PAYLOAD_BYTES per Model**: 106,384 bytes
- **SERIALIZED_APPLICATION_PAYLOAD_BYTES per Model**: 110,271 bytes
- **Per-Round Transmissions**: 4 Client Downloads + 4 Client Uploads (8 model state objects per round)
- **Cumulative Download RAW_TENSOR_PAYLOAD_BYTES (13 rounds)**: 5,531,968 bytes
- **Cumulative Upload RAW_TENSOR_PAYLOAD_BYTES (13 rounds)**: 5,531,968 bytes
- **Total RAW_TENSOR_PAYLOAD_BYTES**: 11,063,936 bytes
- **Cumulative Download SERIALIZED_APPLICATION_PAYLOAD_BYTES (13 rounds)**: 5,734,092 bytes
- **Cumulative Upload SERIALIZED_APPLICATION_PAYLOAD_BYTES (13 rounds)**: 5,734,092 bytes
- **Total SERIALIZED_APPLICATION_PAYLOAD_BYTES**: 11,468,184 bytes

---

## ⏱️ Round-13 Runtime Audit
- **Normal Round Duration (Rounds 1–12)**: Median = 306.35 s, Mean = 304.77 s
- **Round 13 Duration**: 5117.68 s (Anomaly Ratio: 16.71x)
- **Runtime Classification**: `WALL_CLOCK_RUNTIME_WITH_EXTERNAL_DELAY / RESOURCE STALL`
