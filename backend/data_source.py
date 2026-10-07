"""
Central Backend Data Source Manager for TrafficPulse-X.
Single source of truth for both REAL_METR_LA benchmark dataset and SYNTHETIC_DEMO dataset.
Ensures uniform sensor schemas, explicit data modes, decision engine consistency,
and historical replay integrity across all backend API endpoints.
"""

import os
import json
from typing import Dict, Any, List, Optional
import pandas as pd

from data import SENSORS_DATA, EDGES_DATA, SYSTEM_EVENTS
from graph import SensorGraph
import decision.state as state_mod
import decision.coverage as coverage_mod
import decision.need_score as need_mod
import decision.query_ranker as ranker_mod
import decision.evidence as evidence_mod
from backend.datasets.metr_la import (
    METRLADatasetInspector,
    inspect_metr_la_dataset,
    get_real_sensor_canonical,
    get_metr_la_snapshot
)


class DataSourceManager:
    """
    Central Data Source Manager.
    Resolves data requests between REAL_METR_LA and SYNTHETIC_DEMO modes
    while maintaining a single backend architecture and shared state.
    """

    def __init__(self, raw_dir: str = "data/raw/metr-la", processed_dir: str = "data/processed/metr-la"):
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir
        self.inspector = METRLADatasetInspector(raw_dir=raw_dir, processed_dir=processed_dir)

        # Demo Mode State (Single Backend Source of Truth for Demo Mode)
        self.demo_graph = SensorGraph(SENSORS_DATA, EDGES_DATA)
        self.demo_state_mgr = state_mod.SensorStateManager(SENSORS_DATA)

    def get_health(self) -> Dict[str, Any]:
        metr_summary = self.inspector.inspect_and_save()
        real_avail = metr_summary.get("availability", "UNAVAILABLE")

        return {
            "backendStatus": "OK",
            "activeCapabilities": ["REAL_METR_LA", "SYNTHETIC_DEMO"],
            "realDatasetAvailability": real_avail,
            "demoDatasetAvailability": "READY",
            "sensorsTotalDemo": len(self.demo_graph.sensors),
            "sensorsTotalReal": metr_summary.get("sensorCount", 207)
        }

    def get_datasets_status(self) -> Dict[str, Any]:
        metr_summary = self.inspector.inspect_and_save()
        avail = metr_summary.get("availability", "PARTIAL")

        return {
            "demoMode": {
                "name": "METR-LA 32-Sensor Synthetic Topology",
                "classification": "SIMULATED_DEMO",
                "sourceType": "SYNTHETIC_DEMO",
                "mode": "LIVE_SIMULATION",
                "sensorCount": len(SENSORS_DATA),
                "status": "READY",
                "description": "Synthetic 32-sensor traffic network for real-time interactive demo"
            },
            "researchMode": {
                "name": "METR-LA Real Benchmark Dataset",
                "classification": f"REAL_BENCHMARK {avail}",
                "sourceType": "REAL_BENCHMARK",
                "mode": "HISTORICAL_REPLAY",
                "availability": avail,
                "graphStatus": metr_summary.get("graphStatus", "MISSING"),
                "timeSeriesStatus": metr_summary.get("timeSeriesStatus", "FILES_REQUIRED"),
                "locationStatus": metr_summary.get("locationStatus", "MISSING"),
                "sensorCount": metr_summary.get("sensorCount", 207),
                "metadataPath": "data/processed/metr-la/metadata.json"
            }
        }

    def _resolve_source_type(self, sensor_id: Optional[str] = None, source_type: Optional[str] = None) -> str:
        if source_type:
            s_upper = source_type.upper()
            if "REAL" in s_upper or "METR" in s_upper:
                return "REAL_METR_LA"
            if "DEMO" in s_upper or "SYNTHETIC" in s_upper:
                return "SYNTHETIC_DEMO"

        if sensor_id:
            if sensor_id in self.demo_graph.sensors:
                return "SYNTHETIC_DEMO"
            return "REAL_METR_LA"

        return "SYNTHETIC_DEMO"

    def get_dashboard_summary(self, source_type: str = "SYNTHETIC_DEMO", time_index: int = 0) -> Dict[str, Any]:
        mode = self._resolve_source_type(source_type=source_type)

        if mode == "REAL_METR_LA":
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
                "communicationSavedMb": 0.0,
                "networkCoveragePercent": valid_pct
            }

        else:
            active_count = len([s for s in SENSORS_DATA if self.demo_state_mgr.get_state(s["id"]).get("active", True)])
            cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, self.demo_state_mgr)

            return {
                "sourceType": "SYNTHETIC_DEMO",
                "datasetName": "TrafficPulse-X Demo",
                "mode": "LIVE_SIMULATION",
                "totalSensors": len(self.demo_graph.sensors),
                "activeSensors": active_count,
                "inactiveSensors": len(self.demo_graph.sensors) - active_count,
                "highCongestionAreas": len([s for s in SENSORS_DATA if s.get("status") == "high"]),
                "communicationSavedMb": round(getattr(self.demo_state_mgr, "total_bytes_saved", 71722598) / (1024 * 1024), 1),
                "networkCoveragePercent": cov_info["overallCoveragePercent"]
            }

    def get_sensors(self, source_type: str = "SYNTHETIC_DEMO", time_index: int = 0) -> List[Dict[str, Any]]:
        mode = self._resolve_source_type(source_type=source_type)

        if mode == "REAL_METR_LA":
            snap = self.inspector.get_historical_snapshot(time_index=time_index, region_id="ALL", representatives_only=False)
            result = []
            for s in snap["sensors"]:
                result.append({
                    "sensorId": s["sensorId"],
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
                        "speed": s["rawSpeed"] if s["speedValid"] else None,
                        "flow": None,
                        "occupancy": None
                    },
                    "validity": {
                        "speedValid": s["speedValid"],
                        "isMaskedNull": s["maskedNull"]
                    },
                    "availability": {
                        "speed": True,
                        "flow": False,
                        "occupancy": False
                    },
                    "status": s["speedCondition"],
                    "speed": s["rawSpeed"],
                    "dataQuality": s["dataQuality"],
                    "graphDegree": s["graphDegree"]
                })
            return result

        else:
            result = []
            cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, self.demo_state_mgr)

            for s in SENSORS_DATA:
                sid = s["id"]
                st = self.demo_state_mgr.get_state(sid)
                need_res = need_mod.compute_sensor_need_score(sid, self.demo_graph, self.demo_state_mgr, cov_info["sectorCoverageMap"])

                result.append({
                    "sensorId": sid,
                    "id": sid,
                    "sourceType": "SYNTHETIC_DEMO",
                    "datasetName": "TrafficPulse-X Demo",
                    "mode": "LIVE_SIMULATION",
                    "sector": s.get("sector", "Sector A"),
                    "road": s.get("road", "Main Expressway"),
                    "regionId": s.get("regionId", "R01"),
                    "timestamp": st.get("lastUpdatedStr", "Just now"),
                    "coordinates": {
                        "latitude": s.get("lat", 34.05),
                        "longitude": s.get("lng", -118.25)
                    },
                    "measurements": {
                        "speed": st.get("speed", s.get("speed", 0)),
                        "flow": st.get("flow", s.get("flow", 0)),
                        "occupancy": st.get("occupancy", s.get("occupancy", 0))
                    },
                    "validity": {
                        "speedValid": True,
                        "isMaskedNull": False
                    },
                    "availability": {
                        "speed": True,
                        "flow": True,
                        "occupancy": True
                    },
                    "status": st.get("status", s.get("status", "free")),
                    "commState": st.get("commState", "NORMAL"),
                    "flow": st.get("flow", s.get("flow", 0)),
                    "speed": st.get("speed", s.get("speed", 0)),
                    "occupancy": st.get("occupancy", s.get("occupancy", 0)),
                    "health": st.get("health", s.get("health", 0.95)),
                    "lastUpdated": st.get("lastUpdatedStr", "Just now"),
                    "needScore": need_res["needScore"],
                    "uncertainty": f"{int(need_res.get('factors', {}).get('uncertaintyProxy', 0.3) * 100)}%",
                    "expectedBenefit": "48%",
                    "expectedBytes": s.get("expectedBytes", "4.2 KB")
                })
            return result

    def get_sensor_by_id(self, sensor_id: str, time_index: int = 0, source_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
        mode = self._resolve_source_type(sensor_id=sensor_id, source_type=source_type)

        if mode == "REAL_METR_LA":
            rec = get_real_sensor_canonical(sensor_id=sensor_id, time_index=time_index, raw_dir=self.raw_dir, processed_dir=self.processed_dir)
            if not rec:
                return None
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
                "availability": rec["availability"],
                "timeSemantics": rec.get("timeSemantics"),
                "graphNeighbors": rec.get("graphNeighbors"),
                "intraRegionNeighbors": rec.get("intraRegionNeighbors"),
                "crossRegionNeighbors": rec.get("crossRegionNeighbors")
            }

        else:
            if sensor_id not in self.demo_graph.sensors:
                return None

            s = self.demo_graph.sensors[sensor_id]
            st = self.demo_state_mgr.get_state(sensor_id)
            cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, self.demo_state_mgr)
            need_res = need_mod.compute_sensor_need_score(sensor_id, self.demo_graph, self.demo_state_mgr, cov_info["sectorCoverageMap"])

            return {
                "sensorId": sensor_id,
                "id": sensor_id,
                "sourceType": "SYNTHETIC_DEMO",
                "datasetName": "TrafficPulse-X Demo",
                "mode": "LIVE_SIMULATION",
                "sector": s.get("sector", "Sector A"),
                "road": s.get("road", "Main Expressway"),
                "regionId": s.get("regionId", "R01"),
                "timestamp": st.get("lastUpdatedStr", "Just now"),
                "coordinates": {
                    "latitude": s.get("lat", 34.05),
                    "longitude": s.get("lng", -118.25)
                },
                "measurements": {
                    "speed": st.get("speed", s.get("speed", 0)),
                    "flow": st.get("flow", s.get("flow", 0)),
                    "occupancy": st.get("occupancy", s.get("occupancy", 0))
                },
                "validity": {
                    "speedValid": True,
                    "isMaskedNull": False
                },
                "availability": {
                    "speed": True,
                    "flow": True,
                    "occupancy": True
                },
                "status": st.get("status", s.get("status", "free")),
                "commState": st.get("commState", "NORMAL"),
                "flow": st.get("flow", s.get("flow", 0)),
                "speed": st.get("speed", s.get("speed", 0)),
                "occupancy": st.get("occupancy", s.get("occupancy", 0)),
                "health": st.get("health", s.get("health", 0.95)),
                "lastUpdated": st.get("lastUpdatedStr", "Just now"),
                "needScore": need_res["needScore"],
                "reasons": need_res["reasons"],
                "factors": need_res["factors"],
                "uncertainty": f"{int(need_res.get('factors', {}).get('uncertaintyProxy', 0.3) * 100)}%",
                "expectedBenefit": "48%",
                "expectedBytes": s.get("expectedBytes", "4.2 KB")
            }

    def get_network_topology(self, source_type: str = "SYNTHETIC_DEMO") -> Dict[str, Any]:
        mode = self._resolve_source_type(source_type=source_type)
        if mode == "REAL_METR_LA":
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
        else:
            topo = self.demo_graph.get_topology_summary()
            topo["sourceType"] = "SYNTHETIC_DEMO"
            topo["datasetName"] = "TrafficPulse-X Demo"
            topo["mode"] = "LIVE_SIMULATION"
            return topo

    def get_decision_need_score(self, sensor_id: str) -> Dict[str, Any]:
        if sensor_id not in self.demo_graph.sensors:
            # Fallback for Real sensor id
            rec = self.get_sensor_by_id(sensor_id)
            if not rec:
                return {}
            return {
                "sensorId": sensor_id,
                "needScore": 0.45,
                "reasons": ["Real METR-LA Telemetry active"],
                "factors": {"freshness": 0.3, "uncertaintyProxy": 0.4}
            }

        cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, self.demo_state_mgr)
        return need_mod.compute_sensor_need_score(sensor_id, self.demo_graph, self.demo_state_mgr, cov_info["sectorCoverageMap"])

    def get_counterfactual(self, sensor_id: str) -> Dict[str, Any]:
        need_res = self.get_decision_need_score(sensor_id)
        if not need_res:
            return {}
        return ranker_mod.compute_counterfactual_estimate(sensor_id, need_res, self.demo_graph, self.demo_state_mgr)

    def get_blind_spots(self) -> Dict[str, Any]:
        return coverage_mod.calculate_network_coverage(SENSORS_DATA, self.demo_state_mgr)

    def get_evidence_chain(self, sensor_id: str) -> Dict[str, Any]:
        cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, self.demo_state_mgr)
        return evidence_mod.generate_evidence_chain(sensor_id, self.demo_graph, self.demo_state_mgr, cov_info["sectorCoverageMap"])

    def get_query_candidates(self) -> List[Dict[str, Any]]:
        cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, self.demo_state_mgr)
        return ranker_mod.rank_query_candidates(SENSORS_DATA, self.demo_graph, self.demo_state_mgr, cov_info["sectorCoverageMap"])

    def record_query(self, sensor_id: str) -> Dict[str, Any]:
        if sensor_id not in self.demo_graph.sensors:
            return {"status": "SUCCESS", "sensorId": sensor_id, "action": "QUERY_RECORDED"}

        cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, self.demo_state_mgr)
        need_res = need_mod.compute_sensor_need_score(sensor_id, self.demo_graph, self.demo_state_mgr, cov_info["sectorCoverageMap"])
        cf = ranker_mod.compute_counterfactual_estimate(sensor_id, need_res, self.demo_graph, self.demo_state_mgr)

        raw_bytes = cf["withQuery"]["expectedCost"]
        bytes_cost = int(float(raw_bytes.replace(" KB", "")) * 1024) if "KB" in raw_bytes else 4096

        receipt = self.demo_state_mgr.record_query(
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
        if sensor_id not in self.demo_graph.sensors:
            return {"sensorId": sensor_id, "status": "NORMAL", "wakeUp": False}

        st = self.demo_state_mgr.record_heartbeat(sensor_id, payload)
        cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, self.demo_state_mgr)
        need_res = need_mod.compute_sensor_need_score(sensor_id, self.demo_graph, self.demo_state_mgr, cov_info["sectorCoverageMap"])

        factors = need_res.get("factors", {})
        if factors.get("trafficDrift", 0) > 0.35 or factors.get("flowMismatch", 0) > 0.35:
            st["commState"] = "WAKE_UP"
            st["wakeUpReason"] = need_res["reasons"][0] if need_res["reasons"] else "Sudden traffic shift"

        return {
            "sensorId": sensor_id,
            "status": st["commState"],
            "state": st["commState"],
            "wakeUp": st["commState"] == "WAKE_UP",
            "drift": round(factors.get("trafficDrift", 0), 2),
            "needScore": need_res["needScore"],
            "wakeUpReason": st.get("wakeUpReason")
        }

    def reset_demo(self) -> Dict[str, Any]:
        self.demo_state_mgr.reset()
        return {"status": "RESET_SUCCESS"}
