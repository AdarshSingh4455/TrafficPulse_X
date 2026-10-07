"""
TrafficPulse-X Phase 6 Stage 6.2: Linear Regression Baseline Model.
Trains independent horizon linear regression models using 24 features (12 normalized speeds + 12 binary masks).
Calculated strictly in raw mph space using train-only scaler stats.
"""

import json
import os
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.linear_model import LinearRegression


class LinearRegressionBaseline:
    """
    Temporal Linear Regression Baseline for Traffic Speed Forecasting.
    Trains independent linear models per target horizon using 12 historical speed steps + 12 mask features per sensor.
    """
    def __init__(self, scaler_mean: float = 58.584258, scaler_std: float = 12.822883):
        self.mean = scaler_mean
        self.std = scaler_std
        self.horizons = [0, 1, 2, 3]
        self.models: Dict[int, LinearRegression] = {}
        self.fitted = False

    def _extract_features(self, x: np.ndarray, x_mask: np.ndarray) -> np.ndarray:
        """
        Extracts 24 input features per sensor sample:
        - 12 normalized historical speed steps
        - 12 binary input mask indicators
        x: shape (N, 12, 207, 1)
        x_mask: shape (N, 12, 207, 1)
        Returns: feature matrix of shape (N * 207, 24)
        """
        N, T, S, C = x.shape
        # Transpose to (N, S, T) then reshape to (N * S, T)
        x_feat = x.transpose(0, 2, 1, 3).reshape(N * S, T)
        m_feat = x_mask.transpose(0, 2, 1, 3).reshape(N * S, T).astype(np.float32)
        return np.hstack([x_feat, m_feat])

    def fit(self, x_train: np.ndarray, y_train: np.ndarray, x_mask_train: np.ndarray, y_mask_train: np.ndarray) -> Dict[str, Any]:
        """
        Fits independent linear regression models per horizon strictly on valid training samples.
        x_train: shape (N_tr, 12, 207, 1) normalized
        y_train: shape (N_tr, 4, 207, 1) raw mph
        x_mask_train: shape (N_tr, 12, 207, 1)
        y_mask_train: shape (N_tr, 4, 207, 1)
        """
        X_tr = self._extract_features(x_train, x_mask_train) # (N_tr * 207, 24)
        fit_stats = {}

        for h_idx in self.horizons:
            y_tr_h_raw = y_train[:, h_idx, :, 0].transpose(0, 1).reshape(-1) # (N_tr * 207,)
            y_mask_tr_h = y_mask_train[:, h_idx, :, 0].transpose(0, 1).reshape(-1)

            # Fit strictly on valid unmasked targets (y_mask == True and y_raw > 0)
            valid_idx = y_mask_tr_h & (y_tr_h_raw > 0.0)
            y_tr_norm = (y_tr_h_raw[valid_idx] - self.mean) / self.std
            X_tr_valid = X_tr[valid_idx]

            model = LinearRegression(fit_intercept=True)
            model.fit(X_tr_valid, y_tr_norm)
            self.models[h_idx] = model

            fit_stats[f"horizon_{h_idx}"] = {
                "numTrainSamples": int(np.sum(valid_idx)),
                "intercept": float(model.intercept_),
                "numFeatures": int(X_tr_valid.shape[1])
            }

        self.fitted = True
        return fit_stats

    def predict(self, x: np.ndarray, x_mask: np.ndarray) -> np.ndarray:
        """
        Predicts traffic speeds in raw mph for all 4 target horizons.
        x: shape (N, 12, 207, 1) normalized
        x_mask: shape (N, 12, 207, 1)
        Returns: y_pred of shape (N, 4, 207, 1) in raw mph
        """
        if not self.fitted:
            raise RuntimeError("LinearRegressionBaseline must be fitted before predict")

        N, T, S, C = x.shape
        X_feat = self._extract_features(x, x_mask) # (N * S, 24)
        y_pred = np.zeros((N, 4, S, 1), dtype=np.float32)

        for h_idx in self.horizons:
            model = self.models[h_idx]
            pred_norm = model.predict(X_feat) # (N * S,)
            pred_raw = pred_norm * self.std + self.mean
            # Reshape back to (N, S) then transpose to (N, 1, S, 1)
            y_pred[:, h_idx, :, 0] = pred_raw.reshape(N, S)

        return y_pred

    def export_artifacts(self) -> Dict[str, Any]:
        """
        Exports model coefficients, intercepts, and metadata as a serializable dict.
        """
        feature_names = [f"speed_t_minus_{11-t}" for t in range(12)] + [f"mask_t_minus_{11-t}" for t in range(12)]
        artifacts = {
            "modelType": "LinearRegression",
            "scalerMean": self.mean,
            "scalerStd": self.std,
            "featureCount": 24,
            "featureNames": feature_names,
            "horizons": {}
        }

        for h_idx, model in self.models.items():
            artifacts["horizons"][f"horizon_{h_idx}"] = {
                "intercept": float(model.intercept_),
                "coefficients": [float(c) for c in model.coef_]
            }

        return artifacts

    def save_artifacts(self, save_path: str) -> None:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        art = self.export_artifacts()
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(art, f, indent=2)
