"""
Central Backend Data Source Manager for TrafficPulse-X.
Single authoritative source of truth for REAL_METR_LA benchmark dataset.
Ensures uniform sensor schemas, single backend architecture, decision engine consistency,
and historical replay integrity across all backend API endpoints.
"""

import os
import json
from typing import Dict, Any, List, Optional

from backend.graph import SensorGraph
import backend.decision.state as state_mod
import backend.decision.coverage as coverage_mod
import backend.decision.need_score as need_mod
import backend.decision.query_ranker as ranker_mod
import backend.decision.evidence as evidence_mod
from backend.datasets.metr_la import (
    METRLADatasetInspector,
    inspect_metr_la_dataset,
    get_real_sensor_canonical,
    get_metr_la_snapshot
)


class DataSourceManager:
    """
    Central Backend Data Source Manager.
    Serves as the single authoritative runtime sensor source for the METR-LA real benchmark dataset.
    """

    def __init__(self, raw_dir: str = "data/raw/metr-la", processed_dir: str = "data/processed/metr-la"):
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir
        self.inspector = METRLADatasetInspector(raw_dir=raw_dir, processed_dir=processed_dir)

        # Inspect graph and initial snapshot to populate canonical sensor registry
        graph_info, sensor_ids, neighbors_map = self.inspector.inspect_graph()
        self.sensor_ids = sensor_ids or []
        self.neighbors_map = neighbors_map or {}

        # Get initial snapshot (time_index=0) to register 207 sensors
        snap = self.inspector.get_historical_snapshot(time_index=0, region_id="ALL", representatives_only=False)
        self.raw_sensors = snap.get("sensors", [])

        # Initialize SensorGraph and SensorStateManager on real 207-sensor topology
        self.graph = SensorGraph(self.raw_sensors, neighbors_map=self.neighbors_map)
        self.state_mgr = state_mod.SensorStateManager(self.raw_sensors)

    def get_health(self) -> Dict[str, Any]:
        metr_summary = self.inspector.inspect_and_save()
        real_avail = metr_summary.get("availability", "AVAILABLE")

        return {
            "backendStatus": "OK",
            "activeCapabilities": ["REAL_METR_LA"],
            "realDatasetAvailability": real_avail,
            "datasetName": "METR-LA",
            "mode": "HISTORICAL_REPLAY",
            "sensorsTotalReal": metr_summary.get("sensorCount", 207)
        }

    def get_datasets_status(self) -> Dict[str, Any]:
        metr_summary = self.inspector.inspect_and_save()
        avail = metr_summary.get("availability", "AVAILABLE")

        return {
            "researchMode": {
                "name": "METR-LA Real Benchmark Dataset",
                "classification": f"REAL_BENCHMARK {avail}",
                "sourceType": "REAL_BENCHMARK",
                "mode": "HISTORICAL_REPLAY",
                "availability": avail,
                "graphStatus": metr_summary.get("graphStatus", "AVAILABLE"),
                "timeSeriesStatus": metr_summary.get("timeSeriesStatus", "AVAILABLE"),
                "locationStatus": metr_summary.get("locationStatus", "AVAILABLE"),
                "sensorCount": metr_summary.get("sensorCount", 207),
                "metadataPath": "data/processed/metr-la/metadata.json"
            }
        }

    def get_dashboard_summary(self, time_index: int = 0) -> Dict[str, Any]:
        snap = self.inspector.get_historical_snapshot(time_index=time_index, region_id="ALL", representatives_only=False)
        total = snap["sensorCount"]
        active = len([s for s in snap["sensors"] if s.get("speedValid")])
        inactive = total - active
        high_cong = len([s for s in snap["sensors"] if s.get("speedCondition") in ["SLOW", "REDUCED"]])
        valid_pct = round((active / total) * 100, 1) if total > 0 else 0.0

        return {
            "sourceType": "REAL_BENCHMARK",
            "datasetName": "METR-LA",
            "mode": "HISTORICAL_REPLAY",
            "timeIndex": time_index,
            "timestamp": snap["timestamp"],
            "totalSensors": total,
            "activeSensors": active,
            "inactiveSensors": inactive,
            "highCongestionAreas": high_cong,
            "networkCoveragePercent": valid_pct
        }

    def get_representatives_for_region(self, region_id: str) -> List[str]:
        r_code = region_id.upper()
        if not r_code.startswith("REGION_"):
            r_code = f"REGION_{r_code}"
        rep_path = os.path.join(self.processed_dir, "representative_sensors.json")
        if os.path.exists(rep_path):
            with open(rep_path, "r", encoding="utf-8") as f:
                all_reps = json.load(f)
                if r_code in all_reps:
                    return [r["sensorId"] if isinstance(r, dict) else str(r) for r in all_reps[r_code]]
        return []

    def get_sensors(self, time_index: int = 0) -> List[Dict[str, Any]]:
        snap = self.inspector.get_historical_snapshot(time_index=time_index, region_id="ALL", representatives_only=False)
        result = []
        for s in snap["sensors"]:
            sid = s["sensorId"]
            raw_sp = s["rawSpeed"] if s["speedValid"] else None
            self.state_mgr.update_sensor_telemetry(sid, raw_sp, s["speedValid"])

            result.append({
                "sensorId": sid,
                "displayAlias": s["displayAlias"],
                "sourceType": "REAL_BENCHMARK",
                "datasetName": "METR-LA",
                "mode": "HISTORICAL_REPLAY",
                "regionId": s["regionId"],
                "timestamp": s["timestamp"],
                "coordinates": {
                    "latitude": s["latitude"],
                    "longitude": s["longitude"]
                },
                "measurements": {
                    "speed": raw_sp
                },
                "validity": {
                    "speedValid": s["speedValid"],
                    "isMaskedNull": s["maskedNull"]
                },
                "availability": {
                    "speed": True,
                    "flow": False,
                    "occupancy": False,
                    "hardwareHealth": False
                },
                "status": s["speedCondition"],
                "speed": raw_sp,
                "dataQuality": s["dataQuality"],
                "graphDegree": s["graphDegree"],
                "graph": {
                    "neighbors": self.neighbors_map.get(sid, [])
                }
            })
        return result

    def get_sensor_by_id(self, sensor_id: str, time_index: int = 0) -> Optional[Dict[str, Any]]:
        rec = get_real_sensor_canonical(sensor_id=sensor_id, time_index=time_index, raw_dir=self.raw_dir, processed_dir=self.processed_dir)
        if not rec:
            return None

        raw_sp = rec["measurements"]["speed"]
        valid = rec["validity"]["speedValid"]
        self.state_mgr.update_sensor_telemetry(sensor_id, raw_sp, valid)

        return {
            "sensorId": sensor_id,
            "sourceType": "REAL_BENCHMARK",
            "datasetName": "METR-LA",
            "mode": "HISTORICAL_REPLAY",
            "regionId": rec["regionId"],
            "timestamp": rec["timestamp"],
            "coordinates": {
                "latitude": rec["latitude"],
                "longitude": rec["longitude"]
            },
            "measurements": rec["measurements"],
            "validity": rec["validity"],
            "availability": {
                "speed": True,
                "flow": False,
                "occupancy": False,
                "hardwareHealth": False
            },
            "dataQuality": rec.get("dataQuality", 0.98),
            "timeSemantics": rec.get("timeSemantics"),
            "graphNeighbors": rec.get("graphNeighbors"),
            "intraRegionNeighbors": rec.get("intraRegionNeighbors"),
            "crossRegionNeighbors": rec.get("crossRegionNeighbors"),
            "graph": {
                "neighbors": rec.get("graphNeighbors", [])
            }
        }

    def get_network_topology(self) -> Dict[str, Any]:
        graph_info, sensor_ids, nbr_map = self.inspector.inspect_graph()
        return {
            "sourceType": "REAL_BENCHMARK",
            "datasetName": "METR-LA",
            "mode": "HISTORICAL_REPLAY",
            "nodeCount": len(sensor_ids) if sensor_ids else 0,
            "edgeCount": graph_info.get("numEdges", 0),
            "sparsity": graph_info.get("sparsity", 0.0),
            "neighborsMap": nbr_map
        }

    def get_spatial_speed_consistency(self, from_id: str, to_id: str) -> Dict[str, Any]:
        res = self.graph.get_spatial_speed_consistency(from_id, to_id)
        if not res:
            return {
                "fromSensor": from_id,
                "toSensor": to_id,
                "consistencyScore": 100.0,
                "isDisagreement": False,
                "severity": "normal",
                "note": "Sensors not directly adjacent in METR-LA topology"
            }
        return res

    def get_decision_need_score(self, sensor_id: str) -> Dict[str, Any]:
        cov_info = coverage_mod.calculate_network_coverage(self.raw_sensors, self.state_mgr)
        return need_mod.compute_sensor_need_score(sensor_id, self.graph, self.state_mgr, cov_info["sectorCoverageMap"])

    def get_counterfactual(self, sensor_id: str) -> Dict[str, Any]:
        need_res = self.get_decision_need_score(sensor_id)
        if not need_res:
            return {}
        return ranker_mod.compute_counterfactual_estimate(sensor_id, need_res, self.graph, self.state_mgr)

    def get_blind_spots(self) -> Dict[str, Any]:
        return coverage_mod.calculate_network_coverage(self.raw_sensors, self.state_mgr)

    def get_evidence_chain(self, sensor_id: str) -> Dict[str, Any]:
        cov_info = coverage_mod.calculate_network_coverage(self.raw_sensors, self.state_mgr)
        return evidence_mod.generate_evidence_chain(sensor_id, self.graph, self.state_mgr, cov_info["sectorCoverageMap"])

    def get_query_candidates(self) -> List[Dict[str, Any]]:
        cov_info = coverage_mod.calculate_network_coverage(self.raw_sensors, self.state_mgr)
        return ranker_mod.rank_query_candidates(self.raw_sensors, self.graph, self.state_mgr, cov_info["sectorCoverageMap"])

    def record_query(self, sensor_id: str) -> Dict[str, Any]:
        cov_info = coverage_mod.calculate_network_coverage(self.raw_sensors, self.state_mgr)
        need_res = need_mod.compute_sensor_need_score(sensor_id, self.graph, self.state_mgr, cov_info["sectorCoverageMap"])
        cf = ranker_mod.compute_counterfactual_estimate(sensor_id, need_res, self.graph, self.state_mgr)

        raw_bytes = cf["withQuery"]["expectedCost"]
        bytes_cost = int(float(raw_bytes.replace(" KB", "")) * 1024) if "KB" in raw_bytes else 4096

        receipt = self.state_mgr.record_query(
            sensor_id=sensor_id,
            reason=cf["reason"],
            benefit=cf["benefitRatio"],
            bytes_used=bytes_cost
        )

        return {
            "status": "SUCCESS",
            "action": "QUERY_EXECUTED",
            "bytesTransferred": f"{bytes_cost / 1024:.1f} KB",
            "expectedBenefit": cf["expectedBenefit"],
            "receipt": receipt,
            "needScoreBefore": need_res["needScore"],
            "counterfactual": cf
        }

    def record_heartbeat(self, sensor_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        st = self.state_mgr.get_state(sensor_id)
        if not st:
            return {"sensorId": sensor_id, "status": "NORMAL", "wakeUp": False}

        if "speed" in payload:
            self.state_mgr.update_sensor_telemetry(sensor_id, payload["speed"], True)

        cov_info = coverage_mod.calculate_network_coverage(self.raw_sensors, self.state_mgr)
        need_res = need_mod.compute_sensor_need_score(sensor_id, self.graph, self.state_mgr, cov_info["sectorCoverageMap"])

        factors = need_res.get("factors", {})
        if factors.get("trafficDrift", 0) > 0.35 or factors.get("spatialSpeedDisagreement", 0) > 0.35:
            st["commState"] = "WAKE_UP"
            st["wakeUpReason"] = need_res["reasons"][0] if need_res.get("reasons") else "Sudden traffic speed shift"

        return {
            "sensorId": sensor_id,
            "status": st["commState"],
            "state": st["commState"],
            "wakeUp": st["commState"] == "WAKE_UP",
            "drift": round(factors.get("trafficDrift", 0), 2),
            "needScore": need_res["needScore"],
            "wakeUpReason": st.get("wakeUpReason")
        }

    def reset_state(self) -> Dict[str, Any]:
        self.state_mgr.reset()
        return {"status": "RESET_SUCCESS"}
