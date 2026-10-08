"""
Sensor Jury Evidence-Combination Decision Module.
Combines prediction uncertainty, drift, spatial disagreement, coverage, and data quality
into a multi-signal decision fusion consensus.
"""

from typing import Dict, Any, List


def evaluate_sensor_jury(
    sensor_id: str,
    graph,
    state_mgr,
    need_result: Dict[str, Any],
    pred_confidence_contract: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates multi-signal decision consensus for a target sensor.
    Returns supportingSignals, conflictingSignals, juryDecision, and juryConfidence.
    """
    factors = need_result.get("factors", {})
    drift = factors.get("trafficDrift", 0.0)
    disagreement = factors.get("spatialSpeedDisagreement", 0.0)
    unc_mph = pred_confidence_contract.get("uncertaintyMph", 3.0)
    conf_level = pred_confidence_contract.get("confidenceLevel", "MEDIUM")
    dq = factors.get("sensorHealth", 0.98)
    cov_need = factors.get("coverageNeed", 0.1)

    supporting_signals = []
    conflicting_signals = []

    # 1. Evaluate Prediction Signal
    if conf_level == "HIGH":
        supporting_signals.append(f"High prediction confidence (uncertainty = {unc_mph} mph)")
    else:
        conflicting_signals.append(f"Elevated prediction uncertainty ({unc_mph} mph)")

    # 2. Evaluate Speed Drift
    if drift > 0.35:
        conflicting_signals.append(f"High traffic speed drift (score = {drift})")
    else:
        supporting_signals.append(f"Stable historical speed trend (drift = {drift})")

    # 3. Evaluate Spatial Disagreement
    if disagreement > 0.30:
        conflicting_signals.append(f"Spatial speed disagreement across neighbors ({disagreement})")
    else:
        supporting_signals.append(f"Spatial speed consistency with graph neighbors ({disagreement})")

    # 4. Evaluate Data Quality & Coverage
    if dq >= 0.90:
        supporting_signals.append(f"Reliable telemetry data quality ({int(dq * 100)}%)")
    else:
        conflicting_signals.append(f"Degraded telemetry data quality ({int(dq * 100)}%)")

    # 5. Formulate Jury Consensus Decision
    conflict_count = len(conflicting_signals)
    support_count = len(supporting_signals)

    if conflict_count >= 3:
        jury_decision = "QUERY_REQUIRED"
        reason = "Multiple conflicting signals indicate high local state ambiguity."
    elif drift > 0.35 and disagreement > 0.30:
        jury_decision = "FLAG_CONGESTION"
        reason = "Drift and spatial disagreement corroborate corridor congestion."
    elif dq < 0.70:
        jury_decision = "FLAG_ANOMALY"
        reason = "Telemetry quality degradation requires validation query."
    else:
        jury_decision = "CONFIRM_NOMINAL"
        reason = "Consensus agreement across prediction, graph, and telemetry signals."

    jury_confidence = round(max(0.40, min(0.98, (support_count / max(1, support_count + conflict_count)))), 2)

    return {
        "sensorId": sensor_id,
        "juryDecision": jury_decision,
        "juryConfidence": f"{int(jury_confidence * 100)}%",
        "juryConfidenceScore": jury_confidence,
        "reason": reason,
        "supportingSignals": supporting_signals,
        "conflictingSignals": conflicting_signals
    }
