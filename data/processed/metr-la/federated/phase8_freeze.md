# TrafficPulse-X Phase 8 — Final Federated Learning Audit & Freeze Report

> **Authoritative System Freeze Artifact for Stage 8.4**

---

## 📌 Phase 8 System Status
- **Status**: **`FROZEN_AND_VERIFIED`**
- **Region Checksum**: `ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2`
- **Global Model Checkpoint**: `data/processed/metr-la/federated/checkpoints/global_best.pt`
- **Checkpoint SHA-256**: `24710dae0fe0554ca8111ad21e05de03b69a282f0b8d8868a1433ba6fd9c2930`
- **Checkpoint File Size**: `111047 bytes`
- **Model Parameter Count**: `26,596 FP32 parameters`

---

## 👥 Regional Edge Clients & FedAvg Aggregation Weights
| Client ID | Region | Sensors | FedAvg Weight | Valid Timestep Samples ($n_i$) | Valid Scalar Elements |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **CLIENT_A** | REGION_A (North-East) | 48 | **22.9069%** | 1,099,026 | 4,221,681 |
| **CLIENT_B** | REGION_B (South-East) | 57 | **27.7117%** | 1,329,573 | 5,107,193 |
| **CLIENT_C** | REGION_C (Central-West) | 58 | **27.9458%** | 1,340,799 | 5,150,335 |
| **CLIENT_D** | REGION_D (North-West) | 44 | **21.4357%** | 1,028,442 | 3,950,552 |
| **Total** | — | **207** | **100.00%** | **4,797,840** | **18,429,761** |

---

## 📊 Benchmark Performance Summary (`test.npz`)
- **Selected Global Best Round**: **Round 8** (Best Global Validation MAE: `3.1536 mph`)
- **Final FL Test MAE**: **3.5322 mph**
- **Final FL Test RMSE**: **7.0956 mph**
- **Final FL Test MAPE**: **9.99%**
- **Horizon MAEs**: `+5`: 2.4121 mph | `+15`: 3.0663 mph | `+30`: 3.7698 mph | `+60`: 4.8806 mph
- **Regional Test MAEs**: `REGION_A`: 2.4446 mph | `REGION_B`: 4.0770 mph | `REGION_C`: 3.4840 mph | `REGION_D`: 4.0979 mph
- **Comparison Statement**: Full-participation FedAvg achieved 3.5322 mph test MAE, 2.75% higher than the frozen centralized Graph+LSTM reference baseline of 3.4378 mph.

---

## 📡 Full-Participation Communication Baseline
- **Per-Model Payload**: `106,384` raw tensor bytes | `110,271` serialized state bytes
- **Cumulative 13-Round Download**: `5,531,968` raw bytes | `5,734,092` serialized bytes
- **Cumulative 13-Round Upload**: `5,531,968` raw bytes | `5,734,092` serialized bytes
- **Total Payload**: **`11,063,936` raw bytes | `11,468,184` serialized bytes**
- **Classification**: `SERIALIZED_APPLICATION_PAYLOAD_BYTES` (*Protocol overhead excluded*)

---

## ⏱️ Round-13 Runtime Classification
- **Round 13 Duration**: `5117.68 s` (Anomaly Ratio: 16.71x)
- **Normal Round Median (Rounds 1–12)**: `306.35 s`
- **Classification**: `WALL_CLOCK_RUNTIME_WITH_EXTERNAL_DELAY / RESOURCE STALL`
