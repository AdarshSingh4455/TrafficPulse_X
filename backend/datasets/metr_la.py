import os
import json
import pickle
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans


# Centralized Time Boundaries
TIME_OF_DAY_BUCKETS = {
    "NIGHT": (0, 5),      # 00:00 - 05:59
    "MORNING": (6, 11),   # 06:00 - 11:59
    "MIDDAY": (12, 16),   # 12:00 - 16:59
    "EVENING": (17, 23)   # 17:00 - 23:59
}

# Representative Selection Weights
REP_WEIGHT_GRAPH = 0.35
REP_WEIGHT_QUALITY = 0.25
REP_WEIGHT_VARIABILITY = 0.20
REP_WEIGHT_DIVERSITY = 0.20


def derive_time_semantics(timestamp_val: Any) -> Dict[str, Any]:
    """
    Derives deterministic temporal attributes from real timestamps.
    Returns hour, minute, dayOfWeek, dayName, isWeekend, and timeOfDay bucket.
    """
    ts = pd.to_datetime(timestamp_val)
    hour = int(ts.hour)
    minute = int(ts.minute)
    day_of_week = int(ts.dayofweek)  # 0=Monday, 6=Sunday
    day_name = str(ts.day_name())
    is_weekend = day_of_week in (5, 6)

    time_of_day = "NIGHT"
    for bucket, (start_h, end_h) in TIME_OF_DAY_BUCKETS.items():
        if start_h <= hour <= end_h:
            time_of_day = bucket
            break

    return {
        "timestamp": ts.isoformat(),
        "hour": hour,
        "minute": minute,
        "dayOfWeek": day_of_week,
        "dayName": day_name,
        "isWeekend": is_weekend,
        "timeOfDay": time_of_day
    }


class METRLADatasetInspector:
    """
    Inspector, canonicalizer, and region partitioner for METR-LA dataset.
    Enforces missing-value contract (NULL_VALUE = 0.0), data quality semantics,
    and 4-region spatial clustering with 20 representative sensors.
    """

    def __init__(self, raw_dir: str = "data/raw/metr-la", processed_dir: str = "data/processed/metr-la"):
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir
        self.h5_path = os.path.join(self.raw_dir, "metr-la.h5")
        self.adj_path = os.path.join(self.raw_dir, "adj_mx.pkl")
        self.txt_path = os.path.join(self.raw_dir, "graph_sensor_ids.txt")
        self.loc_path = os.path.join(self.raw_dir, "graph_sensor_locations.csv")

    def inspect_graph(self) -> Tuple[Dict[str, Any], Optional[List[str]], Optional[Dict[str, List[str]]]]:
        """Inspects graph topology files (adj_mx.pkl and graph_sensor_ids.txt)."""
        sensor_ids: List[str] = []
        if os.path.exists(self.txt_path):
            try:
                with open(self.txt_path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        sensor_ids = [s.strip() for s in content.split(",") if s.strip()]
            except Exception:
                pass

        if not os.path.exists(self.adj_path):
            return {
                "found": False,
                "graphStatus": "MISSING",
                "error": "Adjacency matrix file adj_mx.pkl missing"
            }, sensor_ids if sensor_ids else None, None

        try:
            with open(self.adj_path, "rb") as f:
                data = pickle.load(f, encoding="latin1")

            neighbors_map: Dict[str, List[str]] = {}
            if isinstance(data, (tuple, list)) and len(data) >= 3:
                graph_sensor_ids = [str(sid) for sid in data[0]]
                adj_matrix = np.array(data[2])
            elif isinstance(data, np.ndarray):
                adj_matrix = data
                graph_sensor_ids = sensor_ids
            else:
                return {"found": False, "graphStatus": "INVALID", "error": "Invalid adj_mx.pkl structure"}, None, None

            if not sensor_ids and graph_sensor_ids:
                sensor_ids = graph_sensor_ids

            n_sensors = adj_matrix.shape[0]
            non_zeros = int(np.count_nonzero(adj_matrix))
            total_elements = adj_matrix.size
            sparsity = float(1.0 - (non_zeros / total_elements)) if total_elements > 0 else 0.0

            # Build neighbor mapping
            for idx, sid in enumerate(graph_sensor_ids):
                row = adj_matrix[idx]
                nbr_indices = np.where(row > 0)[0]
                neighbors_map[sid] = [graph_sensor_ids[i] for i in nbr_indices if i != idx]

            non_zero_weights = adj_matrix[adj_matrix > 0]
            min_w = float(np.min(non_zero_weights)) if len(non_zero_weights) > 0 else 0.0
            max_w = float(np.max(non_zero_weights)) if len(non_zero_weights) > 0 else 0.0
            mean_w = float(np.mean(non_zero_weights)) if len(non_zero_weights) > 0 else 0.0

            return {
                "found": True,
                "graphStatus": "AVAILABLE",
                "sensorIdCount": len(sensor_ids),
                "adjacencyMatrixShape": [n_sensors, adj_matrix.shape[1] if adj_matrix.ndim > 1 else 1],
                "numEdges": non_zeros,
                "sparsity": round(sparsity, 4),
                "weightStats": {
                    "min": round(min_w, 4),
                    "max": round(max_w, 4),
                    "mean": round(mean_w, 4)
                }
            }, sensor_ids, neighbors_map

        except Exception as e:
            return {"found": False, "graphStatus": "CORRUPT", "error": f"Error parsing adj_mx.pkl: {str(e)}"}, None, None

    def inspect_locations(self) -> Tuple[Dict[str, Any], Optional[Dict[str, Tuple[float, float]]]]:
        """Inspects sensor geographic coordinates file (graph_sensor_locations.csv)."""
        if not os.path.exists(self.loc_path):
            return {
                "found": False,
                "locationStatus": "MISSING",
                "locationCount": 0
            }, None

        try:
            df = pd.read_csv(self.loc_path)
            if "sensor_id" not in df.columns:
                df = pd.read_csv(self.loc_path, header=None)
                if df.shape[1] >= 3:
                    df.columns = ["index", "sensor_id", "latitude", "longitude"][:df.shape[1]]

            sensor_col = "sensor_id" if "sensor_id" in df.columns else df.columns[1]
            lat_col = "latitude" if "latitude" in df.columns else df.columns[2]
            lon_col = "longitude" if "longitude" in df.columns else df.columns[3]

            coords_map: Dict[str, Tuple[float, float]] = {}
            sample_locs = []

            for _, row in df.iterrows():
                raw_id = str(row[sensor_col])
                if raw_id.endswith(".0"):
                    raw_id = raw_id[:-2]
                lat = float(row[lat_col])
                lon = float(row[lon_col])
                coords_map[raw_id] = (lat, lon)
                if len(sample_locs) < 5:
                    sample_locs.append({
                        "sensor_id": raw_id,
                        "latitude": lat,
                        "longitude": lon
                    })

            return {
                "found": True,
                "locationStatus": "AVAILABLE",
                "locationCount": len(df),
                "validCoordinatesCount": len(coords_map),
                "sampleLocations": sample_locs
            }, coords_map
        except Exception as e:
            return {
                "found": False,
                "locationStatus": "CORRUPT",
                "error": f"Error reading location CSV: {str(e)}"
            }, None

    def inspect_time_series(self, expected_sensor_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Inspects measurement time-series file (metr-la.h5, .npz, .csv).
        Enforces missing-value contract (NULL_VALUE = 0.0) and calculates raw vs valid statistics.
        """
        candidate_files = [
            "metr-la.h5", "METR-LA.h5", "metr-la.npz", "metr-la.pkl",
            "vel.csv", "metr-la.csv"
        ]

        found_file = None
        for filename in candidate_files:
            p = os.path.join(self.raw_dir, filename)
            if os.path.exists(p):
                found_file = (filename, p)
                break

        if not found_file:
            return {
                "found": False,
                "timeSeriesStatus": "FILES_REQUIRED",
                "missingFiles": ["metr-la.h5"],
                "reason": "Measurement file not found in data/raw/metr-la/"
            }

        filename, file_path = found_file
        file_size = os.path.getsize(file_path)

        if file_size == 0:
            return {
                "found": False,
                "filename": filename,
                "fileSize": 0,
                "timeSeriesStatus": "CORRUPT_FILE",
                "corrupt": True,
                "error": "File is empty (0 bytes)"
            }

        try:
            arr = None
            timestamps = []
            ts_sensor_ids = []

            if filename.endswith(".h5"):
                import h5py
                with h5py.File(file_path, "r") as hf:
                    if "df" in hf:
                        df_grp = hf["df"]
                        if "block0_values" in df_grp:
                            arr = df_grp["block0_values"][:]
                            if "block0_items" in df_grp:
                                ts_sensor_ids = [x.decode("utf-8") if isinstance(x, bytes) else str(x) for x in df_grp["block0_items"][:]]
                            if "axis1" in df_grp:
                                raw_ts = df_grp["axis1"][:]
                                timestamps = [pd.to_datetime(t).isoformat() for t in raw_ts]
                    elif "data" in hf:
                        arr = hf["data"][:]

            elif filename.endswith(".csv"):
                df = pd.read_csv(file_path, index_col=0, parse_dates=True)
                arr = df.values
                timestamps = [pd.to_datetime(t).isoformat() for t in df.index]
                ts_sensor_ids = [str(col) for col in df.columns]

            elif filename.endswith(".npz"):
                data = np.load(file_path)
                for k in ["x", "data", "arr_0"]:
                    if k in data:
                        arr = data[k]
                        break

            elif filename.endswith(".pkl"):
                with open(file_path, "rb") as f:
                    data = pickle.load(f)
                    if hasattr(data, "values"):
                        arr = data.values
                        timestamps = [pd.to_datetime(t).isoformat() for t in data.index]
                        ts_sensor_ids = [str(col) for col in data.columns]
                    else:
                        arr = np.array(data)

            if arr is None:
                return {
                    "found": False,
                    "filename": filename,
                    "fileSize": file_size,
                    "timeSeriesStatus": "CORRUPT_FILE",
                    "corrupt": True,
                    "error": "Unable to extract numeric matrix from file"
                }

            arr = np.array(arr)
            if arr.ndim == 3:
                arr = arr[:, :, 0]

            n_records, n_sensors = arr.shape if arr.ndim == 2 else (arr.shape[0], 1)
            total_values = arr.size

            dup_timestamps = len(timestamps) - len(set(timestamps)) if timestamps else 0

            nan_mask = np.isnan(arr)
            nan_count = int(np.sum(nan_mask))
            nan_pct = round(float(nan_count / total_values * 100), 4) if total_values > 0 else 0.0

            zero_mask = (arr == 0.0)
            masked_null_count = int(np.sum(zero_mask))
            masked_null_pct = round(float(masked_null_count / total_values * 100), 4) if total_values > 0 else 0.0

            valid_mask = (arr != 0.0) & (~nan_mask)
            valid_obs_count = int(np.sum(valid_mask))
            valid_obs_pct = round(float(valid_obs_count / total_values * 100), 4) if total_values > 0 else 0.0

            sensor_zero_counts = np.sum(zero_mask, axis=0)
            top5_indices = np.argsort(sensor_zero_counts)[::-1][:5]
            top_masked_sensors = []
            for idx in top5_indices:
                sid = ts_sensor_ids[idx] if idx < len(ts_sensor_ids) else str(idx)
                cnt = int(sensor_zero_counts[idx])
                pct = round(float(cnt / n_records * 100), 4)
                top_masked_sensors.append({
                    "sensorId": sid,
                    "maskedCount": cnt,
                    "maskedPercentage": pct
                })

            max_consec_run = 0
            max_consec_sensor = ""
            for idx in range(n_sensors):
                col = arr[:, idx]
                is_zero = (col == 0.0)
                cur_run = 0
                m_run = 0
                for v in is_zero:
                    if v:
                        cur_run += 1
                        if cur_run > m_run:
                            m_run = cur_run
                    else:
                        cur_run = 0
                if m_run > max_consec_run:
                    max_consec_run = m_run
                    max_consec_sensor = ts_sensor_ids[idx] if idx < len(ts_sensor_ids) else str(idx)

            sensor_mismatch = False
            mismatch_count = 0
            matched_count = 0
            missing_ids = []
            extra_ids = []
            order_match = False

            if expected_sensor_ids and ts_sensor_ids:
                expected_set = set(expected_sensor_ids)
                ts_set = set(ts_sensor_ids)
                matched_count = len(expected_set.intersection(ts_set))
                missing_ids = list(expected_set - ts_set)
                extra_ids = list(ts_set - expected_set)
                mismatch_count = len(missing_ids) + len(extra_ids)
                sensor_mismatch = mismatch_count > 0
                order_match = (expected_sensor_ids == ts_sensor_ids)
            elif expected_sensor_ids:
                matched_count = n_sensors if n_sensors == len(expected_sensor_ids) else 0
                sensor_mismatch = (n_sensors != len(expected_sensor_ids))
                mismatch_count = abs(n_sensors - len(expected_sensor_ids))
                order_match = not sensor_mismatch

            raw_min = float(np.min(arr)) if total_values > 0 else 0.0
            raw_max = float(np.max(arr)) if total_values > 0 else 0.0
            raw_mean = float(np.mean(arr)) if total_values > 0 else 0.0
            raw_std = float(np.std(arr)) if total_values > 0 else 0.0

            valid_vals = arr[valid_mask]
            valid_min = float(np.min(valid_vals)) if len(valid_vals) > 0 else 0.0
            valid_max = float(np.max(valid_vals)) if len(valid_vals) > 0 else 0.0
            valid_mean = float(np.mean(valid_vals)) if len(valid_vals) > 0 else 0.0
            valid_std = float(np.std(valid_vals)) if len(valid_vals) > 0 else 0.0

            features_found = {
                "speed": {
                    "available": True,
                    "source": filename
                },
                "flow": {
                    "available": False,
                    "source": None,
                    "reason": "NOT_AVAILABLE_IN_METR_LA"
                },
                "occupancy": {
                    "available": False,
                    "source": None,
                    "reason": "NOT_AVAILABLE_IN_METR_LA"
                }
            }

            return {
                "found": True,
                "filename": filename,
                "fileSize": file_size,
                "timeSeriesStatus": "AVAILABLE",
                "corrupt": False,
                "dataframeShape": [n_records, n_sensors],
                "timeSteps": n_records,
                "sensorCount": n_sensors,
                "totalSamples": total_values,
                "duplicateTimestamps": dup_timestamps,
                "missingness": {
                    "nanCount": nan_count,
                    "nanPercentage": nan_pct,
                    "maskedNullValue": 0.0,
                    "maskedNullCount": masked_null_count,
                    "maskedNullPercentage": masked_null_pct,
                    "validObservationCount": valid_obs_count,
                    "validObservationPercentage": valid_obs_pct,
                    "topMaskedSensors": top_masked_sensors,
                    "maxConsecutiveZeroRun": {
                        "sensorId": max_consec_sensor,
                        "steps": max_consec_run
                    }
                },
                "featuresFound": features_found,
                "sensorIdCrossCheck": {
                    "measurementSensorCount": n_sensors,
                    "graphSensorCount": len(expected_sensor_ids) if expected_sensor_ids else 0,
                    "matchedSensorCount": matched_count,
                    "missingIds": missing_ids,
                    "extraIds": extra_ids,
                    "orderMatch": order_match,
                    "sensorIdMismatch": sensor_mismatch
                },
                "rawSpeedStats": {
                    "min": round(raw_min, 2),
                    "max": round(raw_max, 2),
                    "mean": round(raw_mean, 2),
                    "std": round(raw_std, 2)
                },
                "validSpeedStats": {
                    "min": round(valid_min, 2),
                    "max": round(valid_max, 2),
                    "mean": round(valid_mean, 2),
                    "std": round(valid_std, 2)
                },
                "startTime": timestamps[0] if timestamps else None,
                "endTime": timestamps[-1] if timestamps else None,
                "samplingIntervalMinutes": 5,
                "timestampValidation": "PASSED" if dup_timestamps == 0 else "WARNING_DUPLICATES"
            }

        except Exception as e:
            return {
                "found": False,
                "filename": filename,
                "fileSize": file_size,
                "timeSeriesStatus": "CORRUPT_FILE",
                "corrupt": True,
                "error": f"Corrupt or invalid dataset file: {str(e)}"
            }

    def generate_feature_support_matrix(self, ts_ok: bool) -> Dict[str, Any]:
        """
        Generates and saves data/processed/metr-la/feature_support.json mapping
        dataset capabilities to TrafficPulse-X features.
        Enforces Stage 5.3 & 5.4 terminology corrections.
        """
        matrix = {
            "datasetName": "METR-LA",
            "sourceType": "REAL_BENCHMARK",
            "features": {
                "speedTelemetry": {
                    "classification": "REAL_DATA_SUPPORTED",
                    "available": ts_ok,
                    "source": "metr-la.h5" if ts_ok else None
                },
                "spatialGraphTopology": {
                    "classification": "REAL_DATA_SUPPORTED",
                    "available": True,
                    "source": "adj_mx.pkl"
                },
                "sensorCoordinates": {
                    "classification": "REAL_DATA_SUPPORTED",
                    "available": True,
                    "source": "graph_sensor_locations.csv"
                },
                "temporalHistory": {
                    "classification": "REAL_DATA_SUPPORTED",
                    "available": ts_ok,
                    "source": "metr-la.h5" if ts_ok else None
                },
                "trafficDrift": {
                    "classification": "REAL_DATA_SUPPORTED",
                    "available": ts_ok,
                    "description": "Speed delta between consecutive 5-min intervals"
                },
                "neighborDisagreement": {
                    "classification": "REAL_DATA_SUPPORTED",
                    "available": ts_ok,
                    "description": "Spatial speed variance among graph neighbors"
                },
                "speedPredictionTarget": {
                    "classification": "PREDICTION_TARGET_AVAILABLE",
                    "available": ts_ok,
                    "description": "Speed time-series target for GNN/LSTM prediction models (Model training NOT_IMPLEMENTED)"
                },
                "freshness": {
                    "classification": "STATE_SUPPORTED",
                    "available": True,
                    "freshnessMode": "HISTORICAL_REPLAY",
                    "description": "Historical replay freshness derived relative to replay clock (replayTime - lastQueryTime)"
                },
                "coverage": {
                    "classification": "STATE_SUPPORTED",
                    "available": True,
                    "description": "Network coverage calculation across 207 spatial sensors"
                },
                "dataQuality": {
                    "classification": "REAL_DATA_SUPPORTED",
                    "available": True,
                    "description": "Observation reliability ratio (valid_observations / total_observations)"
                },
                "spatialRegions": {
                    "classification": "REAL_DERIVED",
                    "available": True,
                    "source": "real coordinates + deterministic KMeans (k=4)",
                    "description": "4 spatial region clusters partitioned using real sensor latitude/longitude"
                },
                "mapRepresentatives": {
                    "classification": "REAL_DERIVED_SELECTION",
                    "available": True,
                    "source": "real sensors + deterministic selection algorithm",
                    "description": "5 representative real sensors selected per region (20 total) using multi-factor criteria"
                },
                "hardwareSensorHealth": {
                    "classification": "NOT_AVAILABLE",
                    "available": False,
                    "source": None,
                    "reason": "NOT_AVAILABLE in REAL METR-LA mode (Hardware health telemetry is not present in METR-LA)"
                },
                "heartbeatState": {
                    "classification": "STATE_SUPPORTED",
                    "available": True,
                    "description": "Heartbeat and replay query state logic"
                },
                "spatialSpeedConsistency": {
                    "classification": "REAL_DERIVED",
                    "available": True,
                    "source": "real speed + real adjacency graph",
                    "description": "Spatial speed variation and anomaly detection across adjacent real sensors"
                },
                "occupancyCongestion": {
                    "classification": "NOT_AVAILABLE",
                    "available": False,
                    "source": None,
                    "reason": "Road occupancy (%) telemetry does not exist in METR-LA"
                }
            }
        }

        os.makedirs(self.processed_dir, exist_ok=True)
        feat_path = os.path.join(self.processed_dir, "feature_support.json")
        with open(feat_path, "w", encoding="utf-8") as f:
            json.dump(matrix, f, indent=2)

        return matrix

    def generate_regions_and_representatives(self) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Partitions all 207 real sensors into 4 geographically coherent regions using KMeans (random_state=42).
        Selects exactly 5 representative real sensors per region (20 total).
        Saves regions.json and representative_sensors.json under data/processed/metr-la/.
        """
        loc_info, coords_map = self.inspect_locations()
        graph_info, sensor_ids, nbr_map = self.inspect_graph()

        if not coords_map or not sensor_ids:
            return {}, {}

        # 1. Build DataFrame of 207 sensor coordinates in graph order
        records = []
        for sid in sensor_ids:
            lat, lon = coords_map.get(sid, (0.0, 0.0))
            records.append({"sensor_id": sid, "latitude": lat, "longitude": lon})

        df_coords = pd.DataFrame(records)
        coords = df_coords[["latitude", "longitude"]].values

        # 2. KMeans spatial clustering (k=4, random_state=42)
        kmeans = KMeans(n_clusters=4, random_state=42, n_init=10).fit(coords)
        df_coords["cluster"] = kmeans.labels_

        # Map cluster integer to REGION_A, REGION_B, REGION_C, REGION_D deterministically by centroids
        centroids = kmeans.cluster_centers_
        sorted_cluster_indices = np.argsort(centroids[:, 0] + centroids[:, 1])

        # Cluster 3 (max lat+lon) -> REGION_A (North-West)
        # Cluster 2 -> REGION_B (North-East)
        # Cluster 1 -> REGION_C (Central-West)
        # Cluster 0 (min lat+lon) -> REGION_D (South-East)
        cluster_to_region = {
            sorted_cluster_indices[3]: "REGION_A",
            sorted_cluster_indices[2]: "REGION_B",
            sorted_cluster_indices[1]: "REGION_C",
            sorted_cluster_indices[0]: "REGION_D"
        }

        df_coords["regionId"] = df_coords["cluster"].map(cluster_to_region)
        region_map = dict(zip(df_coords["sensor_id"], df_coords["regionId"]))

        # Directional names derived from centroid coordinates
        # REGION_A (34.159, -118.234): North-East
        # REGION_B (34.078, -118.288): South-East
        # REGION_C (34.134, -118.355): Central-West
        # REGION_D (34.171, -118.505): North-West
        directional_names = {
            "REGION_A": "North-East",
            "REGION_B": "South-East",
            "REGION_C": "Central-West",
            "REGION_D": "North-West"
        }

        # Load speed time-series for valid stats & quality
        data_quality = {}
        speed_std = {}
        valid_means = {}
        masked_pcts = {}

        if os.path.exists(self.h5_path):
            try:
                import h5py
                with h5py.File(self.h5_path, "r") as hf:
                    df_grp = hf["df"]
                    values = df_grp["block0_values"][:]
                    items = [x.decode("utf-8") if isinstance(x, bytes) else str(x) for x in df_grp["block0_items"][:]]

                for idx, sid in enumerate(items):
                    col = values[:, idx]
                    valid = col[col != 0.0]
                    total = len(col)
                    dq = len(valid) / total if total > 0 else 1.0
                    m_pct = (1.0 - dq) * 100
                    std_val = float(np.std(valid)) if len(valid) > 0 else 0.0
                    mean_val = float(np.mean(valid)) if len(valid) > 0 else 0.0

                    data_quality[sid] = dq
                    masked_pcts[sid] = round(m_pct, 2)
                    speed_std[sid] = round(std_val, 2)
                    valid_means[sid] = round(mean_val, 2)
            except Exception:
                pass

        # Fallback values if HDF5 missing
        for sid in sensor_ids:
            if sid not in data_quality:
                data_quality[sid] = 1.0
                masked_pcts[sid] = 0.0
                speed_std[sid] = 12.0
                valid_means[sid] = 55.0

        # Degree calculation
        degrees = {sid: len(nbr_map.get(sid, [])) if nbr_map else 0 for sid in sensor_ids}

        # 3. Calculate Region Summaries & Statistics
        regions_json = {}
        representative_json = {}

        for r_code in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]:
            r_df = df_coords[df_coords["regionId"] == r_code]
            r_sids = r_df["sensor_id"].tolist()
            r_sids_set = set(r_sids)

            c_lat = float(r_df["latitude"].mean())
            c_lon = float(r_df["longitude"].mean())

            lat_range = [round(float(r_df["latitude"].min()), 5), round(float(r_df["latitude"].max()), 5)]
            lon_range = [round(float(r_df["longitude"].min()), 5), round(float(r_df["longitude"].max()), 5)]

            # Internal vs Cross-region edges
            internal_edges = 0
            outgoing_edges = 0
            incoming_edges = 0

            for sid in r_sids:
                nbrs = nbr_map.get(sid, []) if nbr_map else []
                for n in nbrs:
                    if n in r_sids_set:
                        internal_edges += 1
                    else:
                        outgoing_edges += 1

            # Incoming cross-region edges
            for sid in sensor_ids:
                if sid not in r_sids_set:
                    nbrs = nbr_map.get(sid, []) if nbr_map else []
                    for n in nbrs:
                        if n in r_sids_set:
                            incoming_edges += 1

            r_speeds = [valid_means[s] for s in r_sids]
            r_stds = [speed_std[s] for s in r_sids]
            r_masked = [masked_pcts[s] for s in r_sids]
            r_degrees = [degrees[s] for s in r_sids]

            regions_json[r_code] = {
                "regionId": r_code,
                "directionalName": directional_names[r_code],
                "sensorCount": len(r_sids),
                "sensorIds": r_sids,
                "centroid": {
                    "latitude": round(c_lat, 5),
                    "longitude": round(c_lon, 5)
                },
                "spatialBounds": {
                    "latitudeRange": lat_range,
                    "longitudeRange": lon_range
                },
                "graphStatistics": {
                    "internalEdgeCount": internal_edges,
                    "outgoingCrossRegionEdgeCount": outgoing_edges,
                    "incomingCrossRegionEdgeCount": incoming_edges,
                    "meanNodeDegree": round(float(np.mean(r_degrees)), 2) if r_degrees else 0.0,
                    "maxNodeDegree": int(np.max(r_degrees)) if r_degrees else 0
                },
                "speedStatistics": {
                    "validMeanSpeed": round(float(np.mean(r_speeds)), 2) if r_speeds else 0.0,
                    "validSpeedStd": round(float(np.mean(r_stds)), 2) if r_stds else 0.0,
                    "maskedNullPercentage": round(float(np.mean(r_masked)), 2) if r_masked else 0.0
                }
            }

            # 4. Representative Sensor Selection (5 per region)
            r_prefix = r_code.split("_")[1]
            aliases = ["01", "02", "03", "04", "05"]

            max_deg = max(r_degrees) if r_degrees and max(r_degrees) > 0 else 1
            max_std = max(r_stds) if r_stds and max(r_stds) > 0 else 1.0

            scores = {}
            for s in r_sids:
                g_score = degrees[s] / max_deg
                q_score = data_quality[s]
                v_score = speed_std[s] / max_std
                scores[s] = (REP_WEIGHT_GRAPH * g_score +
                             REP_WEIGHT_QUALITY * q_score +
                             REP_WEIGHT_VARIABILITY * v_score)

            selected_sids = []
            r_pos_map = r_df.set_index("sensor_id")[["latitude", "longitude"]]

            for _ in range(5):
                best_sid = None
                best_comb = -1.0

                for s in r_sids:
                    if s in selected_sids:
                        continue
                    base_s = scores[s]

                    if len(selected_sids) == 0:
                        div_score = 1.0
                    else:
                        s_pos = r_pos_map.loc[s].values
                        dists = [np.linalg.norm(s_pos - r_pos_map.loc[sel].values) for sel in selected_sids]
                        min_d = min(dists)
                        div_score = min(1.0, min_d / 0.08)

                    comb_score = base_s + REP_WEIGHT_DIVERSITY * div_score
                    if comb_score > best_comb:
                        best_comb = comb_score
                        best_sid = s

                if best_sid:
                    selected_sids.append(best_sid)

            rep_list = []
            for idx, sid in enumerate(selected_sids):
                alias = f"{r_prefix}{aliases[idx]}"
                loc_row = r_pos_map.loc[sid]
                rep_list.append({
                    "displayAlias": alias,
                    "sensorId": sid,
                    "regionId": r_code,
                    "latitude": float(loc_row["latitude"]),
                    "longitude": float(loc_row["longitude"]),
                    "representativeScore": round(scores[sid], 4),
                    "graphDegree": degrees[sid],
                    "dataQuality": round(data_quality[sid], 4),
                    "maskedPercentage": masked_pcts[sid],
                    "speedVariability": speed_std[sid],
                    "validMeanSpeed": valid_means[sid]
                })

            representative_json[r_code] = rep_list

        # 5. Save processed JSON outputs
        os.makedirs(self.processed_dir, exist_ok=True)

        reg_path = os.path.join(self.processed_dir, "regions.json")
        if not os.path.exists(reg_path):
            with open(reg_path, "w", encoding="utf-8") as f:
                json.dump(regions_json, f, indent=2)

        rep_path = os.path.join(self.processed_dir, "representative_sensors.json")
        if not os.path.exists(rep_path):
            with open(rep_path, "w", encoding="utf-8") as f:
                json.dump(representative_json, f, indent=2)

        return regions_json, representative_json

    def get_canonical_real_sensor(self, sensor_id: str, time_index: int = 0) -> Optional[Dict[str, Any]]:
        """
        Retrieves a canonical real METR-LA sensor record in TrafficPulse-X schema format.
        Includes region assignment and intra/cross region graph neighbors.
        """
        graph_info, sensor_ids, nbr_map = self.inspect_graph()
        if not sensor_ids or sensor_id not in sensor_ids:
            return None

        loc_info, coords_map = self.inspect_locations()
        lat, lon = coords_map.get(sensor_id, (0.0, 0.0)) if coords_map else (0.0, 0.0)

        # Region assignment
        reg_path = os.path.join(self.processed_dir, "regions.json")
        region_id = "UNKNOWN"
        if os.path.exists(reg_path):
            try:
                with open(reg_path, "r", encoding="utf-8") as f:
                    reg_data = json.load(f)
                    for r_code, r_obj in reg_data.items():
                        if sensor_id in r_obj.get("sensorIds", []):
                            region_id = r_code
                            break
            except Exception:
                pass

        all_nbrs = nbr_map.get(sensor_id, []) if nbr_map else []
        intra_nbrs = []
        cross_nbrs = []

        if region_id != "UNKNOWN" and os.path.exists(reg_path):
            with open(reg_path, "r", encoding="utf-8") as f:
                reg_data = json.load(f)
                r_members = set(reg_data.get(region_id, {}).get("sensorIds", []))
                for n in all_nbrs:
                    if n in r_members:
                        intra_nbrs.append(n)
                    else:
                        cross_nbrs.append(n)
        else:
            intra_nbrs = all_nbrs

        raw_speed = 0.0
        ts_str = "2012-03-01T00:00:00"
        has_speed = False

        if os.path.exists(self.h5_path):
            try:
                import h5py
                with h5py.File(self.h5_path, "r") as hf:
                    df_grp = hf["df"]
                    items = [x.decode("utf-8") if isinstance(x, bytes) else str(x) for x in df_grp["block0_items"][:]]
                    if sensor_id in items:
                        s_idx = items.index(sensor_id)
                        values = df_grp["block0_values"]
                        n_steps = values.shape[0]
                        safe_t = min(max(0, time_index), n_steps - 1)
                        raw_speed = float(values[safe_t, s_idx])
                        has_speed = True

                        if "axis1" in df_grp:
                            ts_str = pd.to_datetime(df_grp["axis1"][safe_t]).isoformat()
            except Exception:
                pass

        time_meta = derive_time_semantics(ts_str)

        return {
            "sensorId": sensor_id,
            "regionId": region_id,
            "latitude": lat,
            "longitude": lon,
            "timestamp": ts_str,
            "measurements": {
                "speed": raw_speed if has_speed else None,
                "flow": None,
                "occupancy": None
            },
            "validity": {
                "speedValid": raw_speed != 0.0 if has_speed else False,
                "isMaskedNull": raw_speed == 0.0 if has_speed else True
            },
            "availability": {
                "speed": has_speed,
                "flow": False,
                "occupancy": False
            },
            "timeSemantics": time_meta,
            "graphNeighbors": all_nbrs,
            "intraRegionNeighbors": intra_nbrs,
            "crossRegionNeighbors": cross_nbrs
        }

    def inspect_and_save(self) -> Dict[str, Any]:
        """Performs complete dataset inspection, partitioning, and updates metadata.json."""
        if not os.path.exists(self.raw_dir):
            metadata = {
                "datasetName": "METR-LA",
                "classification": "REAL",
                "sourceType": "REAL_BENCHMARK",
                "availability": "UNAVAILABLE",
                "graphStatus": "MISSING",
                "timeSeriesStatus": "FILES_REQUIRED",
                "locationStatus": "MISSING",
                "regionCount": 0,
                "representativeCount": 0,
                "error": f"Raw data directory '{self.raw_dir}' does not exist.",
                "validations": {
                    "missingDir": True,
                    "corruptFile": False,
                    "duplicateTimestamps": None,
                    "nanCount": None,
                    "nanPercentage": None,
                    "maskedNullCount": None,
                    "maskedNullPercentage": None,
                    "sensorIdMismatch": None,
                    "timestampValidation": "NOT_EVALUATED"
                },
                "lastInspected": datetime.now(timezone.utc).isoformat()
            }
            self._save_metadata(metadata)
            self.generate_feature_support_matrix(False)
            return metadata

        graph_info, sensor_ids, _ = self.inspect_graph()
        location_info, _ = self.inspect_locations()
        ts_info = self.inspect_time_series(expected_sensor_ids=sensor_ids)

        graph_ok = graph_info.get("found", False)
        ts_ok = ts_info.get("found", False)
        is_corrupt = ts_info.get("corrupt", False) or (graph_info.get("graphStatus") in ["CORRUPT", "INVALID"])

        graph_sensors_count = len(sensor_ids) if sensor_ids else 0
        ts_sensors_count = ts_info.get("sensorCount", 0) if ts_ok else 0
        adj_dim = graph_info.get("adjacencyMatrixShape", [0, 0])[0] if graph_ok else 0

        consistency_pass = False
        if graph_ok and ts_ok:
            consistency_pass = (ts_sensors_count == graph_sensors_count == adj_dim) and not ts_info.get("sensorIdCrossCheck", {}).get("sensorIdMismatch", False)

        if is_corrupt:
            availability = "CORRUPT"
        elif consistency_pass:
            availability = "READY"
        elif graph_ok:
            availability = "PARTIAL"
        else:
            availability = "UNAVAILABLE"

        sensor_count = graph_sensors_count if graph_sensors_count > 0 else ts_sensors_count

        missing_files = []
        if not graph_ok:
            missing_files.append("adj_mx.pkl")
        if not ts_ok:
            missing_files.append("metr-la.h5")

        missingness = ts_info.get("missingness", {}) if ts_ok else {}

        if ts_ok:
            validations = {
                "missingDir": False,
                "corruptFile": False,
                "duplicateTimestamps": ts_info.get("duplicateTimestamps", 0),
                "nanCount": missingness.get("nanCount", 0),
                "nanPercentage": missingness.get("nanPercentage", 0.0),
                "maskedNullCount": missingness.get("maskedNullCount", 0),
                "maskedNullPercentage": missingness.get("maskedNullPercentage", 0.0),
                "sensorIdMismatch": ts_info.get("sensorIdCrossCheck", {}).get("sensorIdMismatch", False),
                "timestampValidation": ts_info.get("timestampValidation", "PASSED")
            }
        else:
            validations = {
                "missingDir": False,
                "corruptFile": is_corrupt,
                "duplicateTimestamps": None,
                "nanCount": None,
                "nanPercentage": None,
                "maskedNullCount": None,
                "maskedNullPercentage": None,
                "sensorIdMismatch": None,
                "timestampValidation": "NOT_EVALUATED"
            }

        # Run region partitioning and representative selection
        regions_dict, reps_dict = self.generate_regions_and_representatives()

        metadata = {
            "datasetName": "METR-LA",
            "classification": "REAL",
            "sourceType": "REAL_BENCHMARK",
            "availability": availability,
            "graphStatus": graph_info.get("graphStatus", "MISSING"),
            "timeSeriesStatus": ts_info.get("timeSeriesStatus", "FILES_REQUIRED"),
            "locationStatus": location_info.get("locationStatus", "MISSING"),
            "regionCount": len(regions_dict),
            "representativeCount": sum(len(v) for v in reps_dict.values()),
            "fileStatus": {
                "graphTopology": graph_ok,
                "measurementFile": ts_ok,
                "locationFile": location_info.get("found", False),
                "missingFiles": missing_files
            },
            "sensorCount": sensor_count,
            "consistencyCheck": {
                "passed": consistency_pass,
                "timeSeriesSensors": ts_sensors_count,
                "graphSensors": graph_sensors_count,
                "adjacencyDimension": adj_dim
            },
            "graphStats": graph_info if graph_ok else None,
            "locationStats": location_info if location_info.get("found") else None,
            "timeSeriesStats": ts_info if ts_ok else None,
            "validations": validations,
            "lastInspected": datetime.now(timezone.utc).isoformat()
        }

        self._save_metadata(metadata)
        self.generate_feature_support_matrix(ts_ok)
        if ts_ok:
            ml_ready_dir = os.path.join(self.processed_dir, "ml_ready")
            train_npz = os.path.join(ml_ready_dir, "train.npz")
            test_npz = os.path.join(ml_ready_dir, "test.npz")
            if not (os.path.exists(train_npz) and os.path.exists(test_npz)):
                try:
                    self.prepare_ml_ready_dataset()
                except Exception:
                    pass
        return metadata

    def _save_metadata(self, metadata: Dict[str, Any]) -> None:
        """Saves metadata dictionary to data/processed/metr-la/metadata.json."""
        os.makedirs(self.processed_dir, exist_ok=True)
        out_path = os.path.join(self.processed_dir, "metadata.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)


    def get_historical_snapshot(
        self,
        time_index: int = 0,
        region_id: Optional[str] = None,
        representatives_only: bool = True
    ) -> Dict[str, Any]:
        """
        Retrieves real METR-LA historical telemetry snapshot for a specific 5-minute time index.
        Filters by region_id and representatives_only (5 per region or 20 total) without sending the full HDF5.
        """
        if not os.path.exists(self.h5_path):
            raise FileNotFoundError(f"METR-LA measurement file '{self.h5_path}' not found.")

        import h5py
        with h5py.File(self.h5_path, "r") as hf:
            df_grp = hf["df"]
            values = df_grp["block0_values"]
            n_steps, n_sensors = values.shape
            items = [x.decode("utf-8") if isinstance(x, bytes) else str(x) for x in df_grp["block0_items"][:]]
            raw_ts = df_grp["axis1"][:]

        if time_index < 0 or time_index >= n_steps:
            raise ValueError(f"time_index {time_index} is out of bounds (0 to {n_steps - 1})")

        current_ts = pd.to_datetime(raw_ts[time_index]).isoformat()
        time_meta = derive_time_semantics(current_ts)

        # Load locations & graph info
        loc_info, coords_map = self.inspect_locations()
        graph_info, sensor_ids, nbr_map = self.inspect_graph()

        # Load representative mapping
        rep_path = os.path.join(self.processed_dir, "representative_sensors.json")
        reg_path = os.path.join(self.processed_dir, "regions.json")

        all_reps_map: Dict[str, Dict[str, Any]] = {}
        if os.path.exists(rep_path):
            with open(rep_path, "r", encoding="utf-8") as f:
                rep_data = json.load(f)
                for r_code, r_list in rep_data.items():
                    for item in r_list:
                        all_reps_map[item["sensorId"]] = item

        sensor_region_map: Dict[str, str] = {}
        if os.path.exists(reg_path):
            with open(reg_path, "r", encoding="utf-8") as f:
                reg_data = json.load(f)
                for r_code, r_obj in reg_data.items():
                    for sid in r_obj.get("sensorIds", []):
                        sensor_region_map[sid] = r_code

        # Determine target sensors to include in snapshot
        target_sids = []
        if representatives_only:
            if region_id and region_id.upper() != "ALL":
                r_code = region_id.upper()
                if not r_code.startswith("REGION_"):
                    r_code = f"REGION_{r_code}"
                target_sids = [sid for sid, obj in all_reps_map.items() if obj.get("regionId") == r_code]
            else:
                target_sids = list(all_reps_map.keys())
        else:
            if region_id and region_id.upper() != "ALL":
                r_code = region_id.upper()
                if not r_code.startswith("REGION_"):
                    r_code = f"REGION_{r_code}"
                target_sids = [sid for sid, r in sensor_region_map.items() if r == r_code]
            else:
                target_sids = items

        # Load snapshot frame speed array for instant calculation
        with h5py.File(self.h5_path, "r") as hf:
            step_values = hf["df"]["block0_values"][time_index, :]

        # Calculate baselines & snapshot sensor records
        snapshot_sensors = []
        for sid in target_sids:
            if sid not in items:
                continue
            s_idx = items.index(sid)
            val = float(step_values[s_idx])

            rep_info = all_reps_map.get(sid, {})
            display_alias = rep_info.get("displayAlias", f"S{sid[-2:]}")
            r_assigned = sensor_region_map.get(sid, rep_info.get("regionId", "REGION_A"))

            lat, lon = coords_map.get(sid, (0.0, 0.0)) if coords_map else (0.0, 0.0)
            dq = rep_info.get("dataQuality", 0.95)
            deg = len(nbr_map.get(sid, [])) if nbr_map else 0

            speed_valid = (val != 0.0)
            masked_null = (val == 0.0)

            # Valid speed baseline
            valid_mean = rep_info.get("validMeanSpeed", 55.0)
            baseline = valid_mean if valid_mean > 0 else 55.0

            if masked_null:
                speed_cond = "NO_DATA"
                speed_ratio = 0.0
            else:
                speed_ratio = round(val / baseline, 2) if baseline > 0 else 1.0
                if speed_ratio >= 0.80:
                    speed_cond = "NORMAL"
                elif speed_ratio >= 0.60:
                    speed_cond = "REDUCED"
                else:
                    speed_cond = "SLOW"

            snapshot_sensors.append({
                "displayAlias": display_alias,
                "sensorId": sid,
                "regionId": r_assigned,
                "latitude": lat,
                "longitude": lon,
                "timestamp": current_ts,
                "speed": val if speed_valid else None,
                "rawSpeed": val,
                "speedValid": speed_valid,
                "maskedNull": masked_null,
                "speedCondition": speed_cond,
                "baselineSpeed": baseline,
                "speedRatio": speed_ratio,
                "dataQuality": dq,
                "graphDegree": deg,
                "flow": None,
                "occupancy": None,
                "hardwareHealth": None,
                "availability": {
                    "speed": True,
                    "flow": False,
                    "occupancy": False
                }
            })

        return {
            "timeIndex": time_index,
            "timestamp": current_ts,
            "totalTimeSteps": n_steps,
            "timeSemantics": time_meta,
            "sensorCount": len(snapshot_sensors),
            "regionId": region_id if region_id else "ALL",
            "representativesOnly": representatives_only,
            "sensors": snapshot_sensors
        }

    def prepare_ml_ready_dataset(
        self,
        ml_ready_dir: str = "data/processed/metr-la/ml_ready",
        input_steps: int = 12,
        target_horizons: Optional[List[int]] = None,
        train_ratio: float = 0.70,
        val_ratio: float = 0.10,
        test_ratio: float = 0.20
    ) -> Dict[str, Any]:
        """
        Converts raw METR-LA benchmark (207 sensors x 34,272 time steps) into a clean,
        leakage-safe, ML-ready dataset with 70/10/20 chronological split, train-only
        StandardScaler, sliding input windows (12 steps=60min), multi-horizon targets
        ([1, 3, 6, 12] steps), target validity masks, canonical sensor index mapping,
        and NPZ archives.
        """
        if target_horizons is None:
            target_horizons = [1, 3, 6, 12]

        if not os.path.exists(self.h5_path):
            return {
                "status": "NOT_READY",
                "error": f"Raw measurement file '{self.h5_path}' not found."
            }

        import h5py
        with h5py.File(self.h5_path, "r") as hf:
            df_grp = hf["df"]
            raw_arr = df_grp["block0_values"][:]  # shape (34272, 207)
            sensor_ids = [x.decode("utf-8") if isinstance(x, bytes) else str(x) for x in df_grp["block0_items"][:]]
            raw_ts = [pd.to_datetime(t).isoformat() for t in df_grp["axis1"][:]]

        n_steps, n_sensors = raw_arr.shape

        # 1. Canonical Sensor Index Mapping
        os.makedirs(self.processed_dir, exist_ok=True)
        os.makedirs(ml_ready_dir, exist_ok=True)

        sensor_index_map = {
            "sensorIds": sensor_ids,
            "idToIndex": {sid: idx for idx, sid in enumerate(sensor_ids)},
            "sensorCount": n_sensors
        }
        with open(os.path.join(self.processed_dir, "sensor_index.json"), "w", encoding="utf-8") as f:
            json.dump(sensor_index_map, f, indent=2)

        # 2. Chronological Split Indices
        n_train = int(n_steps * train_ratio)
        n_val = int(n_steps * val_ratio)
        n_test = n_steps - n_train - n_val

        train_raw = raw_arr[0:n_train, :]
        val_raw = raw_arr[n_train:n_train + n_val, :]
        test_raw = raw_arr[n_train + n_val:, :]

        train_ts = raw_ts[0:n_train]
        val_ts = raw_ts[n_train:n_train + n_val]
        test_ts = raw_ts[n_train + n_val:]

        # 3. Train-Only StandardScaler Fit (strictly on valid train observations != 0.0)
        train_valid_mask = (train_raw != 0.0) & (~np.isnan(train_raw))
        train_valid_vals = train_raw[train_valid_mask]

        if len(train_valid_vals) == 0:
            scaler_mean = 0.0
            scaler_std = 1.0
        else:
            scaler_mean = float(np.mean(train_valid_vals))
            scaler_std = float(np.std(train_valid_vals))

        scaler_info = {
            "scalerType": "StandardScaler",
            "mean": round(scaler_mean, 6),
            "std": round(scaler_std, 6),
            "fittedOn": "train_valid_only",
            "maskedNullValue": 0.0,
            "numValidTrainObservations": int(np.sum(train_valid_mask)),
            "totalTrainObservations": int(train_raw.size)
        }
        with open(os.path.join(self.processed_dir, "scaler.json"), "w", encoding="utf-8") as f:
            json.dump(scaler_info, f, indent=2)

        # 4. Temporal Sliding Window Pre-Allocated Matrix Builder
        max_horizon_offset = max(target_horizons)
        target_offsets = np.array(target_horizons, dtype=int)

        def build_windows(split_arr: np.ndarray, split_ts: List[str]):
            L = len(split_arr)
            max_start = L - input_steps - max_horizon_offset + 1
            if max_start <= 0:
                return (
                    np.empty((0, input_steps, n_sensors, 1), dtype=np.float32),
                    np.empty((0, len(target_horizons), n_sensors, 1), dtype=np.float32),
                    np.empty((0, input_steps, n_sensors, 1), dtype=bool),
                    np.empty((0, len(target_horizons), n_sensors, 1), dtype=bool),
                    np.empty((0, input_steps), dtype="U30"),
                    np.empty((0, len(target_horizons)), dtype="U30")
                )

            num_windows = max_start
            x_arr = np.empty((num_windows, input_steps, n_sensors, 1), dtype=np.float32)
            y_arr = np.empty((num_windows, len(target_horizons), n_sensors, 1), dtype=np.float32)
            x_mask_arr = np.empty((num_windows, input_steps, n_sensors, 1), dtype=bool)
            y_mask_arr = np.empty((num_windows, len(target_horizons), n_sensors, 1), dtype=bool)
            ts_x_arr = np.empty((num_windows, input_steps), dtype="U30")
            ts_y_arr = np.empty((num_windows, len(target_horizons)), dtype="U30")

            for i in range(num_windows):
                x_seq_raw = split_arr[i:i + input_steps, :]
                mask_x = (x_seq_raw != 0.0) & (~np.isnan(x_seq_raw))
                norm_x = np.where(mask_x, (x_seq_raw - scaler_mean) / scaler_std, 0.0)

                x_arr[i, :, :, 0] = norm_x
                x_mask_arr[i, :, :, 0] = mask_x
                ts_x_arr[i, :] = split_ts[i:i + input_steps]

                last_in = i + input_steps - 1
                t_indices = last_in + target_offsets
                y_seq_raw = split_arr[t_indices, :]
                mask_y = (y_seq_raw != 0.0) & (~np.isnan(y_seq_raw))

                y_arr[i, :, :, 0] = y_seq_raw
                y_mask_arr[i, :, :, 0] = mask_y
                ts_y_arr[i, :] = [split_ts[idx] for idx in t_indices]

            return x_arr, y_arr, x_mask_arr, y_mask_arr, ts_x_arr, ts_y_arr

        # 5. Build Splits and Save Compressed NPZ Archives
        x_tr, y_tr, xm_tr, ym_tr, tsx_tr, tsy_tr = build_windows(train_raw, train_ts)
        x_val, y_val, xm_val, ym_val, tsx_val, tsy_val = build_windows(val_raw, val_ts)
        x_te, y_te, xm_te, ym_te, tsx_te, tsy_te = build_windows(test_raw, test_ts)

        np.savez_compressed(
            os.path.join(ml_ready_dir, "train.npz"),
            x=x_tr, y=y_tr, x_mask=xm_tr, y_mask=ym_tr,
            timestamps_x=tsx_tr, timestamps_y=tsy_tr
        )

        np.savez_compressed(
            os.path.join(ml_ready_dir, "val.npz"),
            x=x_val, y=y_val, x_mask=xm_val, y_mask=ym_val,
            timestamps_x=tsx_val, timestamps_y=tsy_val
        )

        np.savez_compressed(
            os.path.join(ml_ready_dir, "test.npz"),
            x=x_te, y=y_te, x_mask=xm_te, y_mask=ym_te,
            timestamps_x=tsx_te, timestamps_y=tsy_te
        )

        # Observation Quality Stats
        train_valid_pct = round(float(np.mean(xm_tr) * 100), 2) if xm_tr.size > 0 else 0.0
        val_valid_pct = round(float(np.mean(xm_val) * 100), 2) if xm_val.size > 0 else 0.0
        test_valid_pct = round(float(np.mean(xm_te) * 100), 2) if xm_te.size > 0 else 0.0
        overall_valid_pct = round(float(np.mean((raw_arr != 0.0) & (~np.isnan(raw_arr))) * 100), 2)

        target_minutes = [h * 5 for h in target_horizons]

        summary = {
            "status": "READY",
            "datasetName": "METR-LA",
            "sourceType": "REAL_BENCHMARK",
            "totalTimeSteps": n_steps,
            "sensorCount": n_sensors,
            "featureCount": 1,
            "featureNames": ["speed"],
            "inputSteps": input_steps,
            "inputDurationMinutes": input_steps * 5,
            "targetHorizons": target_horizons,
            "targetMinutes": target_minutes,
            "samplingIntervalMinutes": 5,
            "splitRatio": [train_ratio, val_ratio, test_ratio],
            "targetContract": {
                "storedTargetSpace": "RAW_MPH",
                "trainingTargetNormalization": "SAME_TRAIN_ONLY_SCALER",
                "evaluationSpace": "INVERSE_TRANSFORMED_MPH"
            },
            "graphNormalizationContract": {
                "method": "SYMMETRIC_NORMALIZED_ADJACENCY",
                "selfLoops": True,
                "formula": "A_hat = A + I; D_hat = degree(A_hat); A_norm = D_hat^(-1/2) * A_hat * D_hat^(-1/2)",
                "rawAdjacencyPreserved": True
            },
            "scaler": scaler_info,
            "splits": {
                "train": {
                    "halfOpenInterval": [0, n_train],
                    "inclusiveIndexRange": [0, n_train - 1],
                    "timeStepRange": [0, n_train],
                    "startTime": train_ts[0] if train_ts else None,
                    "endTime": train_ts[-1] if train_ts else None,
                    "totalSteps": n_train,
                    "numWindows": len(x_tr),
                    "xShape": list(x_tr.shape),
                    "yShape": list(y_tr.shape)
                },
                "val": {
                    "halfOpenInterval": [n_train, n_train + n_val],
                    "inclusiveIndexRange": [n_train, n_train + n_val - 1],
                    "timeStepRange": [n_train, n_train + n_val],
                    "startTime": val_ts[0] if val_ts else None,
                    "endTime": val_ts[-1] if val_ts else None,
                    "totalSteps": n_val,
                    "numWindows": len(x_val),
                    "xShape": list(x_val.shape),
                    "yShape": list(y_val.shape)
                },
                "test": {
                    "halfOpenInterval": [n_train + n_val, n_steps],
                    "inclusiveIndexRange": [n_train + n_val, n_steps - 1],
                    "timeStepRange": [n_train + n_val, n_steps],
                    "startTime": test_ts[0] if test_ts else None,
                    "endTime": test_ts[-1] if test_ts else None,
                    "totalSteps": n_test,
                    "numWindows": len(x_te),
                    "xShape": list(x_te.shape),
                    "yShape": list(y_te.shape)
                }
            },
            "dataQuality": {
                "trainValidObservationPercentage": train_valid_pct,
                "valValidObservationPercentage": val_valid_pct,
                "testValidObservationPercentage": test_valid_pct,
                "overallValidObservationPercentage": overall_valid_pct
            },
            "adjacencyMatrixShape": [n_sensors, n_sensors],
            "generatedAt": datetime.now(timezone.utc).isoformat()
        }

        with open(os.path.join(ml_ready_dir, "summary.json"), "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        return summary

    def get_ml_ready_status(self, ml_ready_dir: str = "data/processed/metr-la/ml_ready") -> Dict[str, Any]:
        """Returns the status and metadata of the ML-ready dataset."""
        summary_path = os.path.join(ml_ready_dir, "summary.json")
        if os.path.exists(summary_path):
            try:
                with open(summary_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

        if os.path.exists(self.h5_path):
            return self.prepare_ml_ready_dataset(ml_ready_dir=ml_ready_dir)

        return {
            "status": "NOT_READY",
            "reason": f"Raw measurement file '{self.h5_path}' not found.",
            "mlReadyPath": ml_ready_dir
        }


def inspect_metr_la_dataset(raw_dir: str = "data/raw/metr-la", processed_dir: str = "data/processed/metr-la") -> Dict[str, Any]:
    inspector = METRLADatasetInspector(raw_dir=raw_dir, processed_dir=processed_dir)
    return inspector.inspect_and_save()


def get_real_sensor_canonical(sensor_id: str, time_index: int = 0, raw_dir: str = "data/raw/metr-la", processed_dir: str = "data/processed/metr-la") -> Optional[Dict[str, Any]]:
    inspector = METRLADatasetInspector(raw_dir=raw_dir, processed_dir=processed_dir)
    return inspector.get_canonical_real_sensor(sensor_id=sensor_id, time_index=time_index)


def get_metr_la_snapshot(time_index: int = 0, region_id: Optional[str] = None, representatives_only: bool = True, raw_dir: str = "data/raw/metr-la", processed_dir: str = "data/processed/metr-la") -> Dict[str, Any]:
    inspector = METRLADatasetInspector(raw_dir=raw_dir, processed_dir=processed_dir)
    return inspector.get_historical_snapshot(time_index=time_index, region_id=region_id, representatives_only=representatives_only)


def get_metr_la_ml_ready_status(raw_dir: str = "data/raw/metr-la", processed_dir: str = "data/processed/metr-la", ml_ready_dir: str = "data/processed/metr-la/ml_ready") -> Dict[str, Any]:
    inspector = METRLADatasetInspector(raw_dir=raw_dir, processed_dir=processed_dir)
    return inspector.get_ml_ready_status(ml_ready_dir=ml_ready_dir)

