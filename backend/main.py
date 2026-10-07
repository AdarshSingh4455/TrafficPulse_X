# TrafficPulse-X FastAPI Backend Server (Real-Data-Only METR-LA Benchmark Architecture)

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from backend.data_source import DataSourceManager
from backend.prediction import get_prediction_service
from backend.datasets.metr_la import (
    inspect_metr_la_dataset,
    get_real_sensor_canonical,
    get_metr_la_snapshot,
    get_metr_la_ml_ready_status
)

app = FastAPI(
    title="TrafficPulse-X API",
    description="Evidence-on-Demand Spatio-Temporal Traffic Prediction Backend (Real METR-LA Benchmark)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Central Backend Data Source Manager Instance (Single Source of Truth)
data_source_mgr = DataSourceManager()
pred_service = get_prediction_service()


class HeartbeatPayload(BaseModel):
    speed: float | None = None


@app.get("/api/health")
def health_check():
    return data_source_mgr.get_health()


@app.get("/api/dashboard")
def get_dashboard_summary(time_index: int = 0):
    return data_source_mgr.get_dashboard_summary(time_index=time_index)


@app.get("/api/sensors")
def get_all_sensors(time_index: int = 0):
    return data_source_mgr.get_sensors(time_index=time_index)


@app.get("/api/sensors/{sensor_id}")
def get_sensor_by_id(sensor_id: str, time_index: int = 0):
    res = data_source_mgr.get_sensor_by_id(sensor_id=sensor_id, time_index=time_index)
    if not res:
        raise HTTPException(status_code=404, detail=f"Sensor '{sensor_id}' not found in METR-LA benchmark dataset")
    return res


@app.get("/api/decision/sensors/{sensor_id}/need-score")
def get_sensor_need_score(sensor_id: str):
    res = data_source_mgr.get_decision_need_score(sensor_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Sensor '{sensor_id}' not found")
    return res


@app.get("/api/decision/counterfactual/{sensor_id}")
def get_sensor_counterfactual(sensor_id: str):
    res = data_source_mgr.get_counterfactual(sensor_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Sensor '{sensor_id}' not found")
    return res


@app.get("/api/decision/blind-spots")
def get_blind_spots():
    return data_source_mgr.get_blind_spots()


@app.get("/api/decision/evidence/{sensor_id}")
def get_evidence_chain(sensor_id: str):
    return data_source_mgr.get_evidence_chain(sensor_id)


@app.get("/api/decision/query-candidates")
def get_query_candidates():
    return data_source_mgr.get_query_candidates()


@app.get("/api/network")
def get_network_topology():
    return data_source_mgr.get_network_topology()


@app.get("/api/network/spatial-consistency")
def check_spatial_speed_consistency(from_id: str = "773869", to_id: str = "767541"):
    return data_source_mgr.get_spatial_speed_consistency(from_id, to_id)


@app.get("/api/network/conservation")
def legacy_spatial_consistency_alias(from_id: str = "773869", to_id: str = "767541"):
    """Alias for backwards compatibility with spatial speed consistency evaluation."""
    return data_source_mgr.get_spatial_speed_consistency(from_id, to_id)


@app.get("/api/events")
def get_events():
    return data_source_mgr.state_mgr.recent_decisions if data_source_mgr.state_mgr.recent_decisions else [
        {
            "id": "DEC-01",
            "time": "18:42:00",
            "sensor": "773869",
            "decision": "QUERY",
            "benefit": "48.0%",
            "reason": "Core arterial chokepoint influence"
        }
    ]


@app.post("/api/query/{sensor_id}")
def execute_sensor_query(sensor_id: str):
    return data_source_mgr.record_query(sensor_id)


@app.post("/api/sensors/{sensor_id}/heartbeat")
def receive_sensor_heartbeat(sensor_id: str, payload: HeartbeatPayload):
    return data_source_mgr.record_heartbeat(sensor_id, payload.model_dump(exclude_unset=True))


@app.get("/api/datasets/status")
def get_datasets_status():
    return data_source_mgr.get_datasets_status()


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
    inspector = data_source_mgr.inspector
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
    inspector = data_source_mgr.inspector
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
    inspector = data_source_mgr.inspector
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


# =============================================================================
# Stage 6.7 Prediction Intelligence API Endpoints
# =============================================================================

@app.get("/api/prediction/status")
def get_prediction_status():
    """Returns Prediction Intelligence status and model checkpoint readiness."""
    return pred_service.get_status()


@app.get("/api/prediction/forecast")
def get_prediction_forecast(
    time_index: int = 12,
    sensor_id: str | None = None,
    region_id: str | None = None
):
    """
    Returns real spatio-temporal predictions (+5, +15, +30, +60 min) generated by
    the frozen Graph+LSTM model over METR-LA historical replay.
    """
    if not pred_service.model_loaded:
        raise HTTPException(
            status_code=503,
            detail="MODEL_NOT_READY: Spatio-temporal Graph+LSTM model checkpoint is not ready."
        )

    try:
        return pred_service.forecast(
            time_index=time_index,
            sensor_id=sensor_id,
            region_id=region_id
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke).strip("'"))
    except RuntimeError as re:
        raise HTTPException(status_code=503, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/api/prediction/metrics")
def get_prediction_metrics():
    """Returns frozen Stage 6.6 overall, horizon-wise, and region-wise metrics."""
    try:
        return pred_service.get_prediction_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load prediction metrics: {str(e)}")


@app.get("/api/prediction/models")
def get_prediction_models():
    """Returns 7-model comparative benchmark table from authoritative Stage 6.6 summary."""
    try:
        return pred_service.get_prediction_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load prediction models table: {str(e)}")

