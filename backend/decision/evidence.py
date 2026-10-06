# Progressive evidence acquisition engine

from typing import Dict, Any, List
from decision.config import CONFIDENCE_THRESHOLD, UNCERTAINTY_THRESHOLD, MAX_EVIDENCE_QUERIES

def generate_evidence_chain(
    target_sensor_id: str,
    graph,
    state_mgr,
    sector_coverage_map: Dict[str, float]
) -> Dict[str, Any]:
    from decision.need_score import compute_sensor_need_score
    from decision.query_ranker import compute_counterfactual_estimate

    target_need = compute_sensor_need_score(target_sensor_id, graph, state_mgr, sector_coverage_map)
    unc_proxy = target_need.get("factors", {}).get("uncertaintyProxy", 0.7)

    # Initial target step
    chain_steps = [{
        "sensorId": target_sensor_id,
        "status": "complete",
        "result": f"Flow anomaly evaluated: {target_need['reasons'][0]}" if target_need["reasons"] else "Nominal conditions",
        "timestamp": "18:42"
    }]

    confidence = round(1.0 - unc_proxy, 2)
    confidence = max(0.40, confidence)

    # Find 1-hop and 2-hop spatial witnesses in graph
    witnesses = graph.get_neighbors(target_sensor_id, k_hops=2)
    ranked_witnesses = []

    for w_id in witnesses:
        if w_id == target_sensor_id:
            continue
        w_need = compute_sensor_need_score(w_id, graph, state_mgr, sector_coverage_map)
        w_cf = compute_counterfactual_estimate(w_id, w_need, graph, state_mgr)
        ranked_witnesses.append((w_id, w_cf["queryUtility"], w_need))

    ranked_witnesses.sort(key=lambda x: x[1], reverse=True)

    queries_done = 1
    for w_id, util, w_need in ranked_witnesses:
        if queries_done >= MAX_EVIDENCE_QUERIES or confidence >= CONFIDENCE_THRESHOLD:
            break

        queries_done += 1
        confidence = round(min(0.96, confidence + 0.22), 2)
        
        w_st = state_mgr.get_state(w_id)
        w_flow = w_st.get("flow", 0)
        
        if w_flow > 1800:
            res_str = "Downstream corridor heavy flow corroborated"
        elif w_need.get("factors", {}).get("flowMismatch", 0) < 0.2:
            res_str = "Diversion flows within nominal parameters"
        else:
            res_str = "Neighboring sector boundary cross-validated"

        chain_steps.append({
            "sensorId": w_id,
            "status": "complete",
            "result": res_str,
            "timestamp": f"18:4{queries_done * 2}"
        })

    if ranked_witnesses and len(chain_steps) < len(ranked_witnesses) + 1:
        next_cand = ranked_witnesses[len(chain_steps) - 1][0]
        chain_steps.append({
            "sensorId": next_cand,
            "status": "waiting",
            "result": None,
            "timestamp": "--:--"
        })

    is_sufficient = confidence >= CONFIDENCE_THRESHOLD
    stop_reason = (
        "Evidence Confidence threshold met (≥ 85%)" if is_sufficient 
        else f"Max queries reached ({MAX_EVIDENCE_QUERIES} nodes)"
    )

    return {
        "targetSensor": target_sensor_id,
        "evidenceConfidence": f"{int(confidence * 100)}%",
        "currentConfidence": f"{int(confidence * 100)}%",
        "evidenceSufficient": "Yes" if is_sufficient else "No",
        "stoppingCondition": stop_reason,
        "sequence": chain_steps
    }
