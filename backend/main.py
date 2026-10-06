# TrafficPulse-X FastAPI Backend Server with Real Decision Intelligence

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
from pydantic import BaseModel

from data import SENSORS_DATA, EDGES_DATA, SYSTEM_EVENTS
from graph import SensorGraph
import decision.state as state_mod
import decision.coverage as coverage_mod
import decision.need_score as need_mod
import decision.query_ranker as ranker_mod
import decision.evidence as evidence_mod
from decision.config import WAKE_UP_THRESHOLD, FLOW_MISMATCH_THRESHOLD
from backend.datasets.metr_la import (
    inspect_metr_la_dataset,
    get_real_sensor_canonical,
    get_metr_la_snapshot,
    get_metr_la_ml_ready_status
)

app = FastAPI(
    title="TrafficPulse-X API",
    description="Evidence-on-Demand Federated Traffic-Flow Prediction Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize network graph and state manager
graph = SensorGraph(SENSORS_DATA, EDGES_DATA)
state_mgr = state_mod.SensorStateManager(SENSORS_DATA)

class HeartbeatPayload(BaseModel):
    flow: float | None = None
    speed: float | None = None
    occupancy: float | None = None

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "TrafficPulse-X",
        "sensorsTotal": len(graph.sensors),
        "activeSensors": len(state_mgr.get_active_sensors())
    }

@app.get("/api/dashboard")
def get_dashboard_summary():
    active_count = len(state_mgr.get_active_sensors())
    cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)
    
    return {
        "totalSensors": len(graph.sensors),
        "activeSensors": active_count,
        "inactiveSensors": len(graph.sensors) - active_count,
        "highCongestionAreas": len([s for s in SENSORS_DATA if s.get("status") == "high"]),
        "communicationSavedMb": round(state_mgr.total_bytes_saved / (1024 * 1024), 1),
        "networkCoveragePercent": cov_info["overallCoveragePercent"]
    }

@app.get("/api/sensors")
def get_all_sensors():
    result = []
    cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)
    
    for s in SENSORS_DATA:
        sid = s["id"]
        st = state_mgr.get_state(sid)
        need_res = need_mod.compute_sensor_need_score(sid, graph, state_mgr, cov_info["sectorCoverageMap"])
        
        sensor_item = {
            **s,
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
        }
        result.append(sensor_item)

    return result

@app.get("/api/sensors/{sensor_id}")
def get_sensor_by_id(sensor_id: str):
    if sensor_id not in graph.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)
    need_res = need_mod.compute_sensor_need_score(sensor_id, graph, state_mgr, cov_info["sectorCoverageMap"])
    st = state_mgr.get_state(sensor_id)
    s = graph.sensors[sensor_id]

    return {
        **s,
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

@app.get("/api/decision/sensors/{sensor_id}/need-score")
def get_sensor_need_score(sensor_id: str):
    if sensor_id not in graph.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)
    return need_mod.compute_sensor_need_score(sensor_id, graph, state_mgr, cov_info["sectorCoverageMap"])

@app.get("/api/decision/counterfactual/{sensor_id}")
def get_sensor_counterfactual(sensor_id: str):
    if sensor_id not in graph.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)
    need_res = need_mod.compute_sensor_need_score(sensor_id, graph, state_mgr, cov_info["sectorCoverageMap"])
    return ranker_mod.compute_counterfactual_estimate(sensor_id, need_res, graph, state_mgr)

@app.get("/api/decision/blind-spots")
def get_blind_spots():
    return coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)

@app.get("/api/decision/evidence/{sensor_id}")
def get_evidence_chain(sensor_id: str):
    if sensor_id not in graph.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)
    return evidence_mod.generate_evidence_chain(sensor_id, graph, state_mgr, cov_info["sectorCoverageMap"])

@app.get("/api/decision/query-candidates")
def get_query_candidates():
    cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)
    return ranker_mod.rank_query_candidates(SENSORS_DATA, graph, state_mgr, cov_info["sectorCoverageMap"])

@app.get("/api/network")
def get_network_topology():
    return graph.get_topology_summary()

@app.get("/api/network/conservation")
def check_flow_conservation(from_id: str = "S01", to_id: str = "S05"):
    res = graph.get_flow_conservation(from_id, to_id)
    if not res:
        return {
            "fromSensor": from_id,
            "toSensor": to_id,
            "incomingFlow": 100,
            "expectedFlow": 68,
            "observedFlow": 29,
            "expectedDiversion": 21,
            "estimatedStoredVehicles": 11,
            "unexplainedDifference": 28,
            "severity": "high",
            "isMismatch": True
        }
    return res

@app.get("/api/events")
def get_events():
    return state_mgr.recent_decisions if state_mgr.recent_decisions else SYSTEM_EVENTS

@app.post("/api/query/{sensor_id}")
def execute_sensor_query(sensor_id: str):
    if sensor_id not in graph.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)
    need_res = need_mod.compute_sensor_need_score(sensor_id, graph, state_mgr, cov_info["sectorCoverageMap"])
    cf = ranker_mod.compute_counterfactual_estimate(sensor_id, need_res, graph, state_mgr)
    
    sensor_obj = graph.sensors[sensor_id]
    raw_bytes = cf["withQuery"]["expectedCost"]
    bytes_cost = int(float(raw_bytes.replace(" KB", "")) * 1024) if "KB" in raw_bytes else 4096

    receipt = state_mgr.record_query(
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

@app.post("/api/sensors/{sensor_id}/heartbeat")
def receive_sensor_heartbeat(sensor_id: str, payload: HeartbeatPayload):
    if sensor_id not in graph.sensors:
        raise HTTPException(status_code=404, detail="Sensor not found")

    st = state_mgr.record_heartbeat(sensor_id, payload.model_dump(exclude_unset=True))
    cov_info = coverage_mod.calculate_network_coverage(SENSORS_DATA, state_mgr)
    need_res = need_mod.compute_sensor_need_score(sensor_id, graph, state_mgr, cov_info["sectorCoverageMap"])

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

@app.post("/api/demo/reset")
def reset_demo_state():
    state_mgr.reset()
    return {"status": "RESET_SUCCESS"}

@app.get("/api/datasets/status")
def get_datasets_status():
    metr_la_summary = inspect_metr_la_dataset()
    avail = metr_la_summary.get("availability", "PARTIAL")
    mode_label = f"REAL_BENCHMARK {avail}"

    return {
        "demoMode": {
            "name": "METR-LA 32-Sensor Synthetic Topology",
            "classification": "SIMULATED_DEMO",
            "sourceType": "SYNTHETIC_DEMO",
            "sensorCount": len(SENSORS_DATA),
            "status": "READY",
            "description": "Synthetic 32-sensor traffic network for real-time interactive demo"
        },
        "researchMode": {
            "name": "METR-LA Real Benchmark Dataset",
            "classification": mode_label,
            "sourceType": "REAL_BENCHMARK",
            "availability": avail,
            "graphStatus": metr_la_summary.get("graphStatus", "MISSING"),
            "timeSeriesStatus": metr_la_summary.get("timeSeriesStatus", "FILES_REQUIRED"),
            "locationStatus": metr_la_summary.get("locationStatus", "MISSING"),
            "sensorCount": metr_la_summary.get("sensorCount", 207),
            "metadataPath": "data/processed/metr-la/metadata.json"
        }
    }

@app.get("/api/datasets/metr-la/summary")
def get_metr_la_dataset_summary():
    return inspect_metr_la_dataset()

@app.get("/api/datasets/metr-la/features")
def get_metr_la_feature_matrix():
    feat_path = "data/processed/metr-la/feature_support.json"
    if os.path.exists(feat_path):
        import json
        with open(feat_path, "r", encoding="utf-8") as f:
            return json.load(f)
    inspector = METRLADatasetInspector()
    return inspector.generate_feature_support_matrix(os.path.exists("data/raw/metr-la/metr-la.h5"))

@app.get("/api/datasets/metr-la/sensors/{sensor_id}")
def get_real_metr_la_sensor(sensor_id: str, time_index: int = 0):
    record = get_real_sensor_canonical(sensor_id, time_index=time_index)
    if not record:
        raise HTTPException(status_code=404, detail=f"Sensor ID '{sensor_id}' not found in METR-LA benchmark dataset")
    return record

@app.get("/api/datasets/metr-la/regions")
def get_metr_la_regions():
    reg_path = "data/processed/metr-la/regions.json"
    if os.path.exists(reg_path):
        import json
        with open(reg_path, "r", encoding="utf-8") as f:
            return json.load(f)
    inspector = METRLADatasetInspector()
    regions, _ = inspector.generate_regions_and_representatives()
    return regions

@app.get("/api/datasets/metr-la/regions/{region_id}")
def get_metr_la_region_detail(region_id: str):
    r_code = region_id.upper()
    if not r_code.startswith("REGION_"):
        r_code = f"REGION_{r_code}"

    regions = get_metr_la_regions()
    if r_code not in regions:
        raise HTTPException(status_code=404, detail=f"Region '{region_id}' not found. Valid regions: REGION_A, REGION_B, REGION_C, REGION_D")
    return regions[r_code]

@app.get("/api/datasets/metr-la/regions/{region_id}/representatives")
def get_metr_la_region_representatives(region_id: str):
    r_code = region_id.upper()
    if not r_code.startswith("REGION_"):
        r_code = f"REGION_{r_code}"

    rep_path = "data/processed/metr-la/representative_sensors.json"
    if os.path.exists(rep_path):
        import json
        with open(rep_path, "r", encoding="utf-8") as f:
            all_reps = json.load(f)
            if r_code in all_reps:
                return all_reps[r_code]

    raise HTTPException(status_code=404, detail=f"Representatives for region '{region_id}' not found.")

@app.get("/api/datasets/metr-la/representatives")
def get_all_metr_la_representatives():
    rep_path = "data/processed/metr-la/representative_sensors.json"
    if os.path.exists(rep_path):
        import json
        with open(rep_path, "r", encoding="utf-8") as f:
            return json.load(f)
    inspector = METRLADatasetInspector()
    _, reps = inspector.generate_regions_and_representatives()
    return reps

@app.get("/api/datasets/metr-la/snapshot")
def get_real_metr_la_snapshot(
    time_index: int = 0,
    region_id: str | None = None,
    representatives_only: bool = True
):
    try:
        return get_metr_la_snapshot(
            time_index=time_index,
            region_id=region_id,
            representatives_only=representatives_only
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except FileNotFoundError as fe:
        raise HTTPException(status_code=404, detail=str(fe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load snapshot: {str(e)}")

@app.get("/api/datasets/metr-la/ml-ready/status")
def get_metr_la_ml_ready_dataset_status():
    return get_metr_la_ml_ready_status()

