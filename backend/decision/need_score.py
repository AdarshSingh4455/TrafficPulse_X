# Need Score calculation engine operating on real METR-LA telemetry and spatial consistency

import time
import math
from typing import Dict, Any, List, Tuple
from backend.decision.config import NEED_WEIGHTS, DRIFT_THRESHOLD, SPATIAL_DISAGREEMENT_THRESHOLD


def calculate_spatial_influence(sensor_id: str, graph) -> float:
    if sensor_id not in graph.sensors:
        return 0.2

    nbrs = graph.adj.get(sensor_id, [])
    deg = len(nbrs)
    two_hop = len(graph.get_neighbors(sensor_id, k_hops=2))

    score = (deg * 0.15) + (min(two_hop, 10) / 10.0 * 0.5)
    return round(min(1.0, max(0.05, score)), 2)


def calculate_traffic_drift(recent_speeds: List[float]) -> Tuple[float, str]:
    valid_speeds = [s for s in recent_speeds if s is not None and s > 0.0]
    if not valid_speeds or len(valid_speeds) < 2:
        return 0.1, "normal"

    current = valid_speeds[-1]
    history = valid_speeds[:-1]
    mean = sum(history) / len(history)

    variance = sum((x - mean) ** 2 for x in history) / len(history)
    std = math.sqrt(variance) if variance > 0 else 1.0

    z_score = abs(current - mean) / max(std, 5.0)
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


def calculate_spatial_speed_disagreement(sensor_id: str, graph, state_mgr) -> float:
    nbr_ids = graph.adj.get(sensor_id, [])
    if not nbr_ids:
        return 0.1

    curr_s = state_mgr.get_state(sensor_id)
    curr_speed = curr_s.get("speed")
    if curr_speed is None or curr_speed <= 0.0:
        return 0.3 # Uncertainty due to masked null

    max_diff = 0.0
    for nbr_id in nbr_ids:
        nbr_s = state_mgr.get_state(nbr_id)
        nbr_speed = nbr_s.get("speed")
        if nbr_speed is not None and nbr_speed > 0.0:
            diff = abs(curr_speed - nbr_speed)
            disagreement = min(1.0, diff / 25.0)
            max_diff = max(max_diff, disagreement)

    return round(max_diff, 2)


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
            "reasons": ["Sensor telemetry is inactive or unavailable"],
            "factors": {}
        }

    sensor_base = graph.sensors.get(sensor_id, {})
    region = sensor_base.get("regionId", "REGION_A")
    cov_ratio = sector_coverage_map.get(region, 0.8)
    coverage_need = round(max(0.05, 1.0 - cov_ratio), 2)

    spatial = calculate_spatial_influence(sensor_id, graph)
    drift, drift_state = calculate_traffic_drift(st.get("recentSpeeds", []))
    freshness = calculate_freshness_need(st.get("lastDetailedQueryAt", time.time()))
    debt = calculate_information_debt(st.get("consecutiveSkipCount", 0), st.get("lastDetailedQueryAt", time.time()))
    disagreement = calculate_spatial_speed_disagreement(sensor_id, graph, state_mgr)
    data_quality = round(st.get("dataQuality", 0.98), 2)
    redundancy = calculate_redundancy_penalty(sensor_id, graph, state_mgr)

    uncertainty_proxy = round(
        min(1.0, 0.35 * disagreement + 0.25 * drift + 0.25 * freshness + 0.15 * coverage_need),
        2
    )

    factors = {
        "spatialInfluence": spatial,
        "uncertaintyProxy": uncertainty_proxy,
        "spatialSpeedDisagreement": disagreement,
        "trafficDrift": drift,
        "freshness": freshness,
        "informationDebt": debt,
        "coverageNeed": coverage_need,
        "sensorHealth": data_quality,
        "redundancyPenalty": redundancy
    }

    raw_score = (
        NEED_WEIGHTS["spatialInfluence"] * spatial +
        NEED_WEIGHTS["uncertaintyProxy"] * uncertainty_proxy +
        NEED_WEIGHTS["spatialSpeedDisagreement"] * disagreement +
        NEED_WEIGHTS["trafficDrift"] * drift +
        NEED_WEIGHTS["freshness"] * freshness +
        NEED_WEIGHTS["informationDebt"] * debt +
        NEED_WEIGHTS["coverageNeed"] * coverage_need +
        NEED_WEIGHTS["sensorHealth"] * data_quality -
        NEED_WEIGHTS["redundancyPenalty"] * redundancy
    )

    final_score = round(min(1.0, max(0.05, raw_score)), 2)

    reasons = []
    if disagreement > SPATIAL_DISAGREEMENT_THRESHOLD:
        reasons.append("Spatial speed disagreement across adjacent corridor")
    if uncertainty_proxy > 0.6:
        reasons.append("High local uncertainty proxy")
    if drift > DRIFT_THRESHOLD:
        reasons.append("Sudden speed drift detected")
    if spatial > 0.6:
        reasons.append("Core arterial chokepoint influence")
    if debt > 0.5:
        reasons.append("Elevated information debt from skips")
    if coverage_need > 0.3:
        reasons.append("Region coverage deficit")

    if not reasons:
        reasons.append("Nominal conditions; low query priority")

    return {
        "sensorId": sensor_id,
        "needScore": final_score,
        "reasons": reasons,
        "factors": factors,
        "driftState": drift_state
    }
