"""
Physics Gate Speed-Only Physical Plausibility Module.
Validates speed telemetry bounds, 5-minute step speed delta limits, and spatial neighbor consistency.
Explicitly operates on speed (mph) telemetry without fabricating vehicle volume flow.
"""

from typing import Dict, Any, List, Optional


def evaluate_physics_gate(
    sensor_id: str,
    current_speed: Optional[float],
    recent_speeds: List[float],
    neighbor_speeds: List[float]
) -> Dict[str, Any]:
    """
    Evaluates physical plausibility of speed observations for a sensor.
    Returns passed status, checksPassed dictionary, anomalyType, and note.
    """
    checks = {
        "validBoundsCheck": True,
        "stepDeltaCheck": True,
        "spatialNeighborCheck": True
    }
    anomaly_type = "NOMINAL"
    note = "Speed telemetry satisfies physical continuity boundaries."

    # 1. Bounds Check (0.0 mph to 100.0 mph)
    if current_speed is not None:
        if current_speed < 0.0 or current_speed > 100.0:
            checks["validBoundsCheck"] = False
            anomaly_type = "UNPHYSICAL_SPEED_BOUNDS"
            note = f"Speed {current_speed} mph exceeds valid physical limits (0-100 mph)."

    # 2. 5-Minute Step Delta Check (Max delta 40.0 mph)
    valid_recent = [s for s in recent_speeds if s is not None and s > 0.0]
    if current_speed is not None and current_speed > 0.0 and len(valid_recent) >= 2:
        prev_speed = valid_recent[-2]
        delta = abs(current_speed - prev_speed)
        if delta > 40.0:
            checks["stepDeltaCheck"] = False
            if anomaly_type == "NOMINAL":
                anomaly_type = "ABRUPT_SPEED_STEP_DELTA"
                note = f"Abrupt speed change of {delta:.1f} mph in 5 minutes exceeds plausible physical acceleration limit (40 mph/5-min)."

    # 3. Spatial Neighbor Check (Max neighbor variance 35.0 mph)
    valid_nbrs = [s for s in neighbor_speeds if s is not None and s > 0.0]
    if current_speed is not None and current_speed > 0.0 and valid_nbrs:
        max_nbr_diff = max(abs(current_speed - ns) for ns in valid_nbrs)
        if max_nbr_diff > 35.0:
            checks["spatialNeighborCheck"] = False
            if anomaly_type == "NOMINAL":
                anomaly_type = "SPATIAL_NEIGHBOR_DISAGREEMENT"
                note = f"Speed differs by {max_nbr_diff:.1f} mph from adjacent corridor graph neighbors."

    passed = all(checks.values())

    return {
        "sensorId": sensor_id,
        "currentSpeedMph": current_speed,
        "passed": passed,
        "anomalyType": anomaly_type,
        "checksPassed": checks,
        "note": note,
        "classification": "REAL_TELEMETRY_PHYSICS_GATE"
    }
