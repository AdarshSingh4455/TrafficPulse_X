# TrafficPulse-X Stage 6.3: GRU & LSTM Temporal Prediction Evaluation Report

## 1. Executive Summary & Model Selection
- **Validation Winner**: **LSTM** (selected based on validation loss on `val.npz`)
- **GRU Val Loss**: 3.1316 mph | **LSTM Val Loss**: 3.1306 mph
- **Evaluated Test Set**: `test.npz` (6,832 test windows $\times$ 207 sensors = 4,970,212 valid target evaluations)
- **Model Parameters**: GRU = 13,316 parameters | LSTM = 17,668 parameters

---

## 2. Comprehensive 5-Model Baseline Comparison (Raw MPH)

| Model Name | Overall MAE | Overall RMSE | Overall MAPE | Selected Backbone |
| :--- | :---: | :---: | :---: | :---: |
| **Last Value (Persistence)** | 3.9839 mph | 7.6411 mph | 10.15% | Baseline |
| **Historical Average (HA)** | 4.1930 mph | 7.8618 mph | 13.06% | Baseline |
| **Linear Regression (LR)** | 3.9763 mph | 7.2053 mph | 11.14% | Baseline |
| **GRU (Temporal)** | **3.5669 mph** | **7.2345 mph** | **10.03%** |  |
| **LSTM (Temporal)** | **3.5613 mph** | **7.2420 mph** | **9.93%** | Validation Winner |

---

## 3. Horizon-Wise MAE Comparison (Raw MPH)

| Horizon | Last Value | Historical Avg | Linear Regression | GRU | LSTM | Best Model per Horizon |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **+5 min** | 2.8158 | 4.1928 | 2.6763 | 2.4349 | 2.4372 | **GRU** |
| **+15 min** | 3.5045 | 4.1928 | 3.4026 | 3.0976 | 3.0940 | **LSTM** |
| **+30 min** | 4.2166 | 4.1929 | 4.2384 | 3.8068 | 3.7984 | **LSTM** |
| **+60 min** | 5.3987 | 4.1934 | 5.5879 | 4.9284 | 4.9156 | **HA** |

---

## 4. Region-Wise Performance Breakdown (MAE in Raw MPH)

| Region | Sensors | GRU MAE | LSTM MAE |
| :--- | :---: | :---: | :---: |
| **REGION_A (North-East)** | 48 | 2.4543 | 2.4549 |
| **REGION_B (South-East)** | 57 | 4.0965 | 4.0793 |
| **REGION_C (Central-West)** | 58 | 3.5407 | 3.5367 |
| **REGION_D (North-West)** | 44 | 4.1509 | 4.1510 |
