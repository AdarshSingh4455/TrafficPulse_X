# Real Need Score calculation engine with multi-factor decomposition

import time
import math
from typing import Dict, Any, List, Tuple
from decision.config import NEED_WEIGHTS, DRIFT_THRESHOLD, FLOW_MISMATCH_THRESHOLD

def calculate_spatial_influence(sensor_id: str, graph) -> float:
    if sensor_id not in graph.sensors:
        return 0.2

    in_deg = len(graph.rev_adj.get(sensor_id, []))
    out_deg = len(graph.adj.get(sensor_id, []))
    two_hop = len(graph.get_neighbors(sensor_id, k_hops=2))

    score = (in_deg * 0.25) + (out_deg * 0.25) + (min(two_hop, 6) / 6.0 * 0.5)
    return round(min(1.0, max(0.05, score)), 2)

def calculate_traffic_drift(recent_flows: List[float]) -> Tuple[float, str]:
    if not recent_flows or len(recent_flows) < 2:
        return 0.1, "normal"

    current = recent_flows[-1]
    history = recent_flows[:-1]
    mean = sum(history) / len(history)
    
    variance = sum((x - mean) ** 2 for x in history) / len(history)
    std = math.sqrt(variance) if variance > 0 else 1.0

    z_score = abs(current - mean) / max(std, 20.0)
    drift = min(1.0, z_score / 3.0)

    state = "high" if drift > DRIFT_THRESHOLD else ("moderate" if drift > 0.15 else "normal")
    return round(drift, 2), state

def calculate_freshness_need(last_detailed_at: float) -> float:
    now = time.time()
    elapsed = max(0, now - last_detailed_at)
    freshness_need = min(1.0, elapsed / 600.0)
    return round(freshness_need, 2)

def calculate_information_debt(consecutive_skips: int, last_detailed_at: float) -> float:
    now = time.time()
    elapsed = max(0, now - last_detailed_at)
    skip_component = min(1.0, consecutive_skips / 5.0) * 0.6
    time_component = min(1.0, elapsed / 900.0) * 0.4
    return round(skip_component + time_component, 2)

def calculate_flow_mismatch(sensor_id: str, graph, state_mgr) -> float:
    in_edges = graph.rev_adj.get(sensor_id, [])
    if not in_edges:
        return 0.1

    max_mismatch = 0.0
    curr_s = state_mgr.get_state(sensor_id)
    obs_flow = curr_s.get("flow", 0)

    for edge in in_edges:
        upstream_id = edge["from"]
        up_s = state_mgr.get_state(upstream_id)
        up_flow = up_s.get("flow", 0)
        expected = up_flow * edge.get("transitionProb", 0.7)
        if expected > 0:
            mismatch = abs(expected - obs_flow) / max(expected, 100.0)
            max_mismatch = max(max_mismatch, min(1.0, mismatch))

    return round(max_mismatch, 2)

def calculate_redundancy_penalty(sensor_id: str, graph, state_mgr) -> float:
    now = time.time()
    one_hop = graph.get_neighbors(sensor_id, k_hops=1)
    
    for nbr in one_hop:
        nst = state_mgr.get_state(nbr)
        elapsed = now - nst.get("lastDetailedQueryAt", 0)
        if elapsed < 120 and nst.get("commState") == "QUERIED":
            return 0.35
            
    return 0.05

def compute_sensor_need_score(sensor_id: str, graph, state_mgr, sector_coverage_map: Dict[str, float]) -> Dict[str, Any]:
    st = state_mgr.get_state(sensor_id)
    if not st or not st.get("active", True):
        return {
            "sensorId": sensor_id,
            "needScore": 0.0,
            "reasons": ["Sensor is inactive or offline"],
            "factors": {}
        }

    sensor_base = graph.sensors.get(sensor_id, {})
    sector = sensor_base.get("sector", "Sector A")
    cov_ratio = sector_coverage_map.get(sector, 0.8)
    coverage_need = round(max(0.05, 1.0 - cov_ratio), 2)

    spatial = calculate_spatial_influence(sensor_id, graph)
    drift, drift_state = calculate_traffic_drift(st.get("recentFlows", []))
    freshness = calculate_freshness_need(st.get("lastDetailedQueryAt", time.time()))
    debt = calculate_information_debt(st.get("consecutiveSkipCount", 0), st.get("lastDetailedQueryAt", time.time()))
    flow_mis = calculate_flow_mismatch(sensor_id, graph, state_mgr)
    health = round(st.get("health", 0.95), 2)
    redundancy = calculate_redundancy_penalty(sensor_id, graph, state_mgr)

    # Uncertainty proxy combines freshness, flow mismatch, drift, and coverage need
    uncertainty_proxy = round(
        min(1.0, 0.35 * flow_mis + 0.25 * drift + 0.25 * freshness + 0.15 * coverage_need),
        2
    )

    factors = {
        "spatialInfluence": spatial,
        "uncertaintyProxy": uncertainty_proxy,
        "flowMismatch": flow_mis,
        "trafficDrift": drift,
        "freshness": freshness,
        "informationDebt": debt,
        "coverageNeed": coverage_need,
        "sensorHealth": health,
        "redundancyPenalty": redundancy
    }

    # Linear combination using centralized weights
    raw_score = (
        NEED_WEIGHTS["spatialInfluence"] * spatial +
        NEED_WEIGHTS["uncertaintyProxy"] * uncertainty_proxy +
        NEED_WEIGHTS["flowMismatch"] * flow_mis +
        NEED_WEIGHTS["trafficDrift"] * drift +
        NEED_WEIGHTS["freshness"] * freshness +
        NEED_WEIGHTS["informationDebt"] * debt +
        NEED_WEIGHTS["coverageNeed"] * coverage_need +
        NEED_WEIGHTS["sensorHealth"] * health -
        NEED_WEIGHTS["redundancyPenalty"] * redundancy
    )

    # Downweight degraded sensors (< 0.50 health) to avoid wasting bytes on unreliable data
    if health < 0.50:
        raw_score = raw_score * 0.5

    final_score = round(min(1.0, max(0.05, raw_score)), 2)

    reasons = []
    if flow_mis > FLOW_MISMATCH_THRESHOLD:
        reasons.append("Unexplained traffic mismatch (possible flow anomaly; additional evidence required)")
    if uncertainty_proxy > 0.6:
        reasons.append("High local uncertainty proxy")
    if drift > DRIFT_THRESHOLD:
        reasons.append("Sudden traffic drift detected")
    if spatial > 0.6:
        reasons.append("Core arterial chokepoint influence")
    if debt > 0.5:
        reasons.append("Elevated information debt from skips")
    if coverage_need > 0.3:
        reasons.append("Sector coverage deficit")

    if not reasons:
        reasons.append("Nominal conditions; low query priority")

    return {
        "sensorId": sensor_id,
        "needScore": final_score,
        "reasons": reasons,
        "factors": factors,
        "driftState": drift_state
    }
