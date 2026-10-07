"""
TrafficPulse-X Phase 6 Stage 6.1: Traffic Prediction Baselines
Contains Last Value (Persistence) and Historical Average (HA) baseline models.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Optional


class LastValueBaseline:
    """
    Last Value (Persistence) Baseline Model.
    Predicts the last observed valid speed value from the input window for all target horizons.
    Calculated strictly in raw mph space.
    """
    def __init__(self, scaler_mean: float = 58.584258, scaler_std: float = 12.822883):
        self.mean = scaler_mean
        self.std = scaler_std

    def predict(self, x: np.ndarray, x_mask: Optional[np.ndarray] = None) -> np.ndarray:
        """
        x: shape (N, 12, 207, 1) normalized input features
        x_mask: optional boolean mask of shape (N, 12, 207, 1)
        Returns: predictions y_pred of shape (N, 4, 207, 1) in raw mph
        """
        N, T, S, C = x.shape
        last_norm = x[:, 11, :, 0]  # shape (N, S)
        last_raw = last_norm * self.std + self.mean

        if x_mask is not None:
            last_mask = x_mask[:, 11, :, 0]
            if not np.all(last_mask):
                for t in range(10, -1, -1):
                    invalid_mask = ~last_mask
                    if not np.any(invalid_mask):
                        break
                    valid_t_mask = x_mask[:, t, :, 0]
                    fill_mask = invalid_mask & valid_t_mask
                    raw_t = x[:, t, :, 0] * self.std + self.mean
                    last_raw[fill_mask] = raw_t[fill_mask]
                    last_mask = last_mask | valid_t_mask

        y_pred = np.repeat(last_raw[:, np.newaxis, :, np.newaxis], 4, axis=1)
        return y_pred


class HistoricalAverageBaseline:
    """
    Historical Average (HA) Baseline Model.
    Computes average traffic speeds per sensor for each (day_of_week, 5min_slot) pair
    strictly on the training dataset to prevent data leakage.
    Calculated in raw mph space.
    """
    def __init__(self, num_sensors: int = 207, fallback_mean: float = 58.584258):
        self.num_sensors = num_sensors
        self.fallback_mean = fallback_mean
        self.ha_table = np.zeros((num_sensors, 7, 288))
        self.counts = np.zeros((num_sensors, 7, 288))
        self.fitted = False

    def fit_from_hdf5(self, h5_path: str = "data/raw/metr-la/metr-la.h5", train_steps: int = 23990) -> None:
        """
        Fits HA table strictly on training steps [0, train_steps) of HDF5 file.
        """
        import h5py
        with h5py.File(h5_path, "r") as hf:
            raw_vals = hf["df"]["block0_values"][:train_steps, :]  # shape (23990, 207)
            raw_ts = pd.to_datetime(hf["df"]["axis1"][:train_steps], unit="ns")

        self.fit(raw_vals, raw_ts)

    def fit(self, raw_vals: np.ndarray, raw_ts: pd.DatetimeIndex) -> None:
        """
        raw_vals: shape (T, 207) in raw mph
        raw_ts: DatetimeIndex of length T
        """
        T, S = raw_vals.shape
        d_week = raw_ts.dayofweek.values
        s_5min = (raw_ts.hour * 60 + raw_ts.minute) // 5

        self.ha_table = np.zeros((S, 7, 288))
        self.counts = np.zeros((S, 7, 288))

        for t_idx in range(T):
            d = d_week[t_idx]
            s = s_5min[t_idx]
            vals = raw_vals[t_idx, :]
            valid = (vals > 0.0) & (~np.isnan(vals))
            self.ha_table[valid, d, s] += vals[valid]
            self.counts[valid, d, s] += 1

        valid_slots = self.counts > 0
        self.ha_table = np.where(valid_slots, self.ha_table / np.maximum(1, self.counts), self.fallback_mean)
        self.fitted = True

    def predict_timestamps(self, timestamps_y: np.ndarray) -> np.ndarray:
        """
        timestamps_y: array of string timestamps of shape (N, 4)
        Returns: predictions y_pred of shape (N, 4, 207, 1)
        """
        if not self.fitted:
            raise RuntimeError("HistoricalAverageBaseline must be fitted before predict_timestamps")

        N, H = timestamps_y.shape
        ts_flat = pd.to_datetime(timestamps_y.flatten())
        d_test = ts_flat.dayofweek.values.reshape(N, H)
        s_test = ((ts_flat.hour * 60 + ts_flat.minute) // 5).values.reshape(N, H)

        y_pred = np.zeros((N, H, self.num_sensors, 1))

        for n in range(N):
            for h in range(H):
                d = d_test[n, h]
                s = s_test[n, h]
                y_pred[n, h, :, 0] = self.ha_table[:, d, s]

        return y_pred
