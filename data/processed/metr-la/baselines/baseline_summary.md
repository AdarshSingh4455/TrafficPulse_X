# TrafficPulse-X Stage 6.1: Baseline Evaluation Report

## Dataset & Evaluation Contract
- **Dataset**: METR-LA ML-Ready Benchmark
- **Test Set Windows**: 6,832 windows
- **Target Dimensions**: 207 sensors × 4 horizons (+5m, +15m, +30m, +60m)
- **Total Targets**: 5,656,896
- **Valid Evaluated Targets**: 4,970,212
- **Masked Null Targets**: 686,684 (Excluded via `y_mask`)
- **Evaluation Unit**: Raw mph (Miles Per Hour)
- **Data Leakage Check**: PASSED (Historical Average fitted strictly on Train split `[0, 23990)`)

---

## 1. Overall Model Comparison

| Baseline Model | MAE (mph) | RMSE (mph) | MAPE (%) |
| :--- | :---: | :---: | :---: |
| **Last Value (Persistence)** | **3.9839** | **7.6411** | **10.15%** |
| **Historical Average (HA)** | **4.1930** | **7.8618** | **13.06%** |

---

## 2. Horizon-Wise Performance Breakdown

| Horizon | Last Value MAE | Last Value RMSE | Last Value MAPE | HA MAE | HA RMSE | HA MAPE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **+5 min** | 2.8158 | 4.6226 | 6.50% | 4.1928 | 7.8616 | 13.06% |
| **+15 min** | 3.5045 | 6.4092 | 8.63% | 4.1928 | 7.8617 | 13.06% |
| **+30 min** | 4.2166 | 8.0372 | 10.89% | 4.1929 | 7.8618 | 13.06% |
| **+60 min** | 5.3987 | 10.3200 | 14.58% | 4.1934 | 7.8620 | 13.06% |

---

## 3. Region-Wise Performance Breakdown

| Region | Sensors | Last Value MAE | Last Value RMSE | HA MAE | HA RMSE |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **REGION_A (North-East)** | 48 | 2.9803 | 5.4555 | 2.6000 | 4.9000 |
| **REGION_B (South-East)** | 57 | 4.4414 | 8.3009 | 4.9097 | 8.7994 |
| **REGION_C (Central-West)** | 58 | 3.9509 | 8.0040 | 4.2824 | 8.3684 |
| **REGION_D (North-West)** | 44 | 4.5493 | 8.3014 | 4.9125 | 8.5137 |
