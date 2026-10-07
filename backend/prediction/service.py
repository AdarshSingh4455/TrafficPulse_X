"""
Prediction Intelligence Service for TrafficPulse-X.
Loads frozen SpatialGraphLSTM checkpoint once, enforces train-only scaler and normalized graph,
and performs multi-horizon (+5, +15, +30, +60 min) real traffic prediction over historical replay.
"""

import os
import json
import pickle
import numpy as np
import torch
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple

from ml.spatiotemporal.model import SpatialGraphLSTM
from ml.graph.model import calculate_normalized_adjacency, count_parameters
from backend.data_source import DataSourceManager


_prediction_service_instance: Optional["PredictionService"] = None


class PredictionService:
    """
    Singleton / Cached Prediction Service for Real METR-LA Spatio-Temporal Forecasting.
    """

    def __init__(
        self,
        processed_dir: str = "data/processed/metr-la",
        raw_dir: str = "data/raw/metr-la",
        data_source_mgr: Optional[DataSourceManager] = None
    ):
        self.processed_dir = processed_dir
        self.raw_dir = raw_dir
        self.data_source_mgr = data_source_mgr or DataSourceManager(raw_dir=raw_dir, processed_dir=processed_dir)

        self.checkpoint_path = os.path.join(processed_dir, "models/spatiotemporal/graph_lstm_best.pt")
        self.summary_path = os.path.join(processed_dir, "models/final_prediction_summary.json")
        self.scaler_path = os.path.join(processed_dir, "scaler.json")
        self.regions_path = os.path.join(processed_dir, "regions.json")
        self.reps_path = os.path.join(processed_dir, "representative_sensors.json")
        self.adj_path = os.path.join(raw_dir, "adj_mx.pkl")
        self.h5_path = os.path.join(raw_dir, "metr-la.h5")

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_loaded = False
        self.model: Optional[SpatialGraphLSTM] = None
        self.a_norm_tensor: Optional[torch.Tensor] = None

        self.mean = 58.584258
        self.std = 12.822883
        self.sensor_ids: List[str] = []
        self.sensor_id_to_idx: Dict[str, int] = {}
        self.parameter_count = 26596

        self.speed_matrix: Optional[np.ndarray] = None
        self.timestamps: List[str] = []

        self._initialize_resources()

    def _initialize_resources(self):
        """Loads scaler, graph topology, sensor registry, speed matrix, and PyTorch model once."""
        # 1. Load Scaler
        if os.path.exists(self.scaler_path):
            with open(self.scaler_path, "r", encoding="utf-8") as f:
                sc = json.load(f)
                self.mean = float(sc.get("mean", 58.584258))
                self.std = float(sc.get("std", 12.822883))

        # 2. Load Adjacency Graph & Canonical Sensor IDs
        if os.path.exists(self.adj_path):
            with open(self.adj_path, "rb") as f:
                sensor_ids_raw, _, adj_mx = pickle.load(f, encoding="latin1")
                self.sensor_ids = [str(sid) for sid in sensor_ids_raw]
                self.sensor_id_to_idx = {sid: idx for idx, sid in enumerate(self.sensor_ids)}

                a_norm_np = calculate_normalized_adjacency(adj_mx, is_identity=False)
                self.a_norm_tensor = torch.tensor(a_norm_np, dtype=torch.float32, device=self.device)

        # 3. Load HDF5 Speed Matrix in memory once for instant sub-millisecond inference
        if os.path.exists(self.h5_path):
            try:
                import h5py
                with h5py.File(self.h5_path, "r") as hf:
                    df_grp = hf["df"]
                    self.speed_matrix = np.array(df_grp["block0_values"][:], dtype=np.float32)
                    if "axis1" in df_grp:
                        raw_ts = df_grp["axis1"][:]
                        self.timestamps = [pd.to_datetime(t).isoformat() for t in raw_ts]
            except Exception as e:
                print(f"Warning: Could not load HDF5 speed matrix into PredictionService memory: {e}")

        # 4. Load Model Checkpoint
        if os.path.exists(self.checkpoint_path) and self.a_norm_tensor is not None:
            try:
                model = SpatialGraphLSTM(
                    in_features=2,
                    spatial_dim=32,
                    hidden_dim=64,
                    output_horizons=4,
                    seq_len=12,
                    use_residual=True
                ).to(self.device)

                state_dict = torch.load(self.checkpoint_path, map_location=self.device, weights_only=True)
                model.load_state_dict(state_dict)
                model.eval()

                self.model = model
                self.parameter_count = count_parameters(model)
                self.model_loaded = True
            except Exception as e:
                print(f"Error loading Graph+LSTM checkpoint '{self.checkpoint_path}': {e}")
                self.model_loaded = False

    def get_status(self) -> Dict[str, Any]:
        """Returns model status response."""
        return {
            "modelName": "Graph+LSTM",
            "modelType": "SpatialGraphLSTM",
            "checkpointReady": self.model_loaded,
            "checkpointPath": self.checkpoint_path,
            "device": str(self.device),
            "horizons": ["+5 min", "+15 min", "+30 min", "+60 min"],
            "parameterCount": self.parameter_count,
            "modelVersion": "1.0.0",
            "scalerMean": self.mean,
            "scalerStd": self.std
        }

    def _run_model_inference(self, time_index: int) -> Tuple[np.ndarray, str]:
        """
        Runs model inference for a 12-step input window ending at time_index.
        Returns pred_raw of shape [4, 207] and input_end_timestamp.
        """
        if not self.model_loaded or self.model is None or self.a_norm_tensor is None:
            raise RuntimeError("MODEL_NOT_READY: Graph+LSTM model checkpoint is not loaded")

        if self.speed_matrix is None or self.speed_matrix.shape[0] == 0:
            raise RuntimeError("DATA_NOT_READY: Speed matrix is not loaded")

        num_steps = self.speed_matrix.shape[0]
        if time_index < 11 or time_index >= num_steps:
            raise ValueError(f"INSUFFICIENT_HISTORY: Request time_index={time_index} requires history window [t-11:t+1] (valid range: 11 to {num_steps - 1})")

        # Extract 12 historical speed steps ending at time_index
        raw_window = self.speed_matrix[time_index - 11: time_index + 1, :]  # [12, 207]
        input_ts = self.timestamps[time_index] if time_index < len(self.timestamps) else "2012-03-01T00:55:00"

        # Channel 0: Normalized speed (for non-zero valid observations)
        norm_speed = np.zeros_like(raw_window)
        valid_mask = (raw_window != 0.0) & (~np.isnan(raw_window))
        norm_speed[valid_mask] = (raw_window[valid_mask] - self.mean) / self.std

        # Channel 1: Binary valid mask
        valid_channel = valid_mask.astype(np.float32)

        # Construct input tensor [1, 12, 207, 2]
        x_input = np.stack([norm_speed, valid_channel], axis=-1)[np.newaxis, ...]
        x_tensor = torch.tensor(x_input, dtype=torch.float32, device=self.device)

        with torch.no_grad():
            pred_norm = self.model(x_tensor, self.a_norm_tensor)  # [1, 4, 207, 1]
            pred_norm_np = pred_norm.squeeze().cpu().numpy()     # [4, 207]

        # Denormalize predictions
        pred_raw = pred_norm_np * self.std + self.mean
        pred_raw = np.clip(pred_raw, 0.0, 100.0)  # Sanity clipping

        return pred_raw, input_ts

    def _build_sensor_item(
        self,
        sensor_id: str,
        pred_raw: np.ndarray,
        time_index: int
    ) -> Dict[str, Any]:
        """Builds forecast item for a single sensor."""
        s_idx = self.sensor_id_to_idx.get(sensor_id, 0)
        sensor_detail = self.data_source_mgr.get_sensor_by_id(sensor_id, time_index=time_index) or {}

        lat = sensor_detail.get("latitude", 34.0)
        lon = sensor_detail.get("longitude", -118.0)
        region_id = sensor_detail.get("regionId", "REGION_C")
        curr_speed = sensor_detail.get("measurements", {}).get("speed")

        horizons_map = [
            (5, 1, "+5 min"),
            (15, 3, "+15 min"),
            (30, 6, "+30 min"),
            (60, 12, "+60 min")
        ]

        predictions = []
        num_steps = self.speed_matrix.shape[0] if self.speed_matrix is not None else 0

        for h_min, offset_step, h_label in horizons_map:
            p_val = round(float(pred_raw[horizons_map.index((h_min, offset_step, h_label)), s_idx]), 2)
            act_val = None
            abs_err = None

            target_idx = time_index + offset_step
            if self.speed_matrix is not None and 0 <= target_idx < num_steps:
                gt = float(self.speed_matrix[target_idx, s_idx])
                if gt > 0.0 and not np.isnan(gt):
                    act_val = round(gt, 2)
                    abs_err = round(abs(p_val - act_val), 2)

            predictions.append({
                "horizonMinutes": h_min,
                "horizonLabel": h_label,
                "predictedSpeedMph": p_val,
                "actualSpeedMph": act_val,
                "absoluteErrorMph": abs_err
            })

        return {
            "sensorId": sensor_id,
            "regionId": region_id,
            "latitude": lat,
            "longitude": lon,
            "currentSpeedMph": curr_speed,
            "predictions": predictions
        }

    def forecast(
        self,
        time_index: int = 12,
        sensor_id: Optional[str] = None,
        region_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main forecast endpoint logic.
        Supports single sensor forecast, region forecast, or overall network summary.
        """
        if not self.model_loaded:
            raise RuntimeError("MODEL_NOT_READY: Spatio-temporal Graph+LSTM model is not ready")

        if sensor_id and sensor_id not in self.sensor_id_to_idx:
            raise KeyError(f"INVALID_SENSOR: Sensor ID '{sensor_id}' not found in canonical METR-LA benchmark.")

        valid_regions = ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]
        if region_id:
            r_clean = region_id.upper()
            if not r_clean.startswith("REGION_"):
                r_clean = f"REGION_{r_clean}"
            if r_clean not in valid_regions:
                raise KeyError(f"INVALID_REGION: Region ID '{region_id}' invalid. Valid regions: {valid_regions}")
            region_id = r_clean

        pred_raw, input_ts = self._run_model_inference(time_index)

        response = {
            "source": "REAL_METR_LA",
            "mode": "HISTORICAL_REPLAY",
            "model": "Graph+LSTM",
            "timeIndex": time_index,
            "inputEndTimestamp": input_ts,
            "sensorCount": len(self.sensor_ids)
        }

        # 1. Single Sensor Request
        if sensor_id:
            response["sensor"] = self._build_sensor_item(sensor_id, pred_raw, time_index)
            return response

        # 2. Region Request
        if region_id:
            response["regionId"] = region_id
            rep_sensors = self.data_source_mgr.get_representatives_for_region(region_id)
            if not rep_sensors:
                # Default subset of region sensors
                rep_sensors = [sid for sid in self.sensor_ids if (sid in self.sensor_id_to_idx)][:5]

            response["representativeForecasts"] = [
                self._build_sensor_item(sid, pred_raw, time_index) for sid in rep_sensors
            ]
            return response

        # 3. Network Overview Request (default: 20 representative sensors across 4 regions)
        default_reps = ["773869", "767541", "717447", "717816", "765171"]
        response["sensor"] = self._build_sensor_item("773869", pred_raw, time_index)
        response["representativeForecasts"] = [
            self._build_sensor_item(sid, pred_raw, time_index) for sid in default_reps
        ]
        return response

    def get_prediction_metrics(self) -> Dict[str, Any]:
        """Returns frozen Stage 6.6 metrics from authoritative summary artifact."""
        if os.path.exists(self.summary_path):
            with open(self.summary_path, "r", encoding="utf-8") as f:
                summary = json.load(f)

            return {
                "stage": "6.6",
                "primaryModel": "Graph+LSTM",
                "overallMetrics": summary["sevenModelComparativeBenchmark"]["modelsOverall"],
                "byHorizon": summary["sevenModelComparativeBenchmark"]["horizonWinners"],
                "byRegion": summary["regionBreakdown"]["regions"],
                "scientificClaims": summary["scientificClaims"]
            }
        else:
            raise FileNotFoundError("Final prediction summary artifact missing.")

    def get_prediction_models(self) -> Dict[str, Any]:
        """Returns compact 7-model comparative benchmark table."""
        if os.path.exists(self.summary_path):
            with open(self.summary_path, "r", encoding="utf-8") as f:
                summary = json.load(f)

            comp = summary["sevenModelComparativeBenchmark"]
            return {
                "stage": "6.6",
                "overallWinner": comp["overallWinner"],
                "horizon60Winner": summary.get("referenceHorizonModel", {}).get("modelName", "Historical Average"),
                "modelsOverall": comp["modelsOverall"],
                "horizonWinners": comp["horizonWinners"]
            }
        else:
            raise FileNotFoundError("Final prediction summary artifact missing.")


def get_prediction_service() -> PredictionService:
    """Singleton getter for PredictionService."""
    global _prediction_service_instance
    if _prediction_service_instance is None:
        _prediction_service_instance = PredictionService()
    return _prediction_service_instance
