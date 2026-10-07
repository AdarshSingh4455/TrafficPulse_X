# TrafficPulse-X Stage 6.2: Linear Regression Baseline Evaluation Report

## 1. Executive Summary & Formulation
- **Model Type**: Temporal Linear Regression (4 independent horizon models)
- **Feature Matrix**: **24 features per sensor sample** (12 normalized speeds + 12 binary input masks)
- **Target Contract**: Normalized space fitting with exact inverse-transformation to raw MPH space
- **Evaluation Contract**: Evaluated strictly on `test.npz` valid targets (`y_mask == True` and $y > 0$) with $\epsilon = 1e-5$
- **Sanity Checks**: NaN = `False`, Inf = `False`, Predictions $< 0.0$ mph = `0`, Predictions $> 70.0$ mph = `0`

---

## 2. Comparative Baseline Summary (Raw MPH)

| Model Name | Overall MAE | Overall RMSE | Overall MAPE |
| :--- | :---: | :---: | :---: |
| **Last Value (Persistence)** | 3.9839 mph | 7.6411 mph | 10.15% |
| **Historical Average (HA)** | 4.1930 mph | 7.8618 mph | 13.06% |
| **Linear Regression (LR)** | **3.9763 mph** | **7.2053 mph** | **11.14%** |

---

## 3. Horizon-Wise Performance Comparison

| Horizon | Last Value MAE | HA MAE | Linear Regression MAE | Best Stage 6.1 Baseline | Change vs Best Stage 6.1 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **+5 min** | 2.8158 mph | 4.1928 mph | **2.6763 mph** | Last Value (2.8158) | **-0.1395 mph (-4.95%)** |
| **+15 min** | 3.5045 mph | 4.1928 mph | **3.4026 mph** | Last Value (3.5045) | **-0.1019 mph (-2.91%)** |
| **+30 min** | 4.2166 mph | **4.1929 mph** | 4.2384 mph | HA (4.1929) | +0.0455 mph (+1.09%) |
| **+60 min** | 5.3987 mph | **4.1934 mph** | 5.5879 mph | HA (4.1934) | +1.3945 mph (+33.25%) |

---

## 4. Region-Wise Linear Regression Metrics

| Region | Sensors | MAE (mph) | RMSE (mph) | MAPE (%) |
| :--- | :---: | :---: | :---: | :---: |
| **REGION_A (North-East)** | 48 | 2.8962 | 4.9803 | 5.91% |
| **REGION_B (South-East)** | 57 | 4.5420 | 7.9750 | 14.28% |
| **REGION_C (Central-West)** | 58 | 3.9581 | 7.4984 | 11.18% |
| **REGION_D (North-West)** | 44 | 4.4662 | 7.8159 | 12.79% |
