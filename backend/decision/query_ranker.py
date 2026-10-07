# Candidate ranking and counterfactual query evaluator for real METR-LA sensors

from typing import Dict, Any, List
from backend.decision.config import MIN_QUERY_BENEFIT


def compute_counterfactual_estimate(
    sensor_id: str,
    need_result: Dict[str, Any],
    graph,
    state_mgr
) -> Dict[str, Any]:
    factors = need_result.get("factors", {})
    unc_proxy = factors.get("uncertaintyProxy", 0.3)
    debt = factors.get("informationDebt", 0.2)
    need_score = need_result.get("needScore", 0.3)
    cov_need = factors.get("coverageNeed", 0.2)

    cost_kb = 4.2
    raw_bytes_str = "4.2 KB"

    unc_before = unc_proxy
    risk_before = "High" if unc_proxy > 0.6 else ("Moderate" if unc_proxy > 0.3 else "Low")
    debt_before = debt

    unc_after = max(0.06, round(unc_proxy * 0.40, 2))
    unc_reduction = round(unc_before - unc_after, 2)
    cov_gain = round(cov_need * 0.50, 2)
    risk_after = "Low" if unc_after <= 0.2 else "Moderate"
    debt_after = 0.0

    benefit_ratio = round(
        min(1.0, max(0.05, (0.50 * unc_reduction / max(unc_before, 0.1)) + (0.30 * cov_gain) + (0.20 * debt_before))),
        2
    )
    benefit_percent_str = f"{int(benefit_ratio * 100)}%"

    cost_norm = max(0.1, cost_kb / 10.0)

    utility = round((need_score * benefit_ratio) / cost_norm, 2)

    st = state_mgr.get_state(sensor_id)
    is_active = st.get("active", True)
    data_quality = st.get("dataQuality", 0.98)

    if not is_active:
        decision = "SKIP"
        reason = "Sensor telemetry is offline; query suppressed"
        utility = 0.0
    elif data_quality < 0.50:
        decision = "SKIP"
        reason = "Sensor data quality degraded (< 50%); query suppressed to avoid noisy telemetry"
        utility = round(utility * 0.1, 2)
    elif benefit_ratio >= MIN_QUERY_BENEFIT and need_score >= 0.40 and utility > 0.15:
        decision = "QUERY"
        reason = "High uncertainty reduction and state coverage gain justify communication cost."
    else:
        decision = "SKIP"
        reason = "Marginal informational benefit; preserving network bandwidth budget."

    return {
        "sensorId": sensor_id,
        "withoutQuery": {
            "estimatedUncertainty": f"{int(unc_before * 100)}%",
            "blindSpotRisk": risk_before,
            "informationDebt": debt_before,
            "coverageGap": f"{int(cov_need * 100)}%"
        },
        "withQuery": {
            "estimatedUncertainty": f"{int(unc_after * 100)}%",
            "blindSpotRisk": risk_after,
            "informationDebt": debt_after,
            "expectedCost": raw_bytes_str,
            "coverageGain": f"+{int(cov_gain * 100)}%"
        },
        "expectedBenefit": benefit_percent_str,
        "benefitRatio": benefit_ratio,
        "uncertaintyReduction": f"-{int(unc_reduction * 100)}%",
        "queryUtility": utility,
        "decision": decision,
        "reason": reason
    }


def rank_query_candidates(
    sensors: List[Dict[str, Any]],
    graph,
    state_mgr,
    sector_coverage_map: Dict[str, float]
) -> List[Dict[str, Any]]:
    from backend.decision.need_score import compute_sensor_need_score
    candidates = []

    for s in sensors:
        sid = s.get("sensorId", s.get("id"))
        st = state_mgr.get_state(sid)
        if not st.get("active", True):
            continue

        need_res = compute_sensor_need_score(sid, graph, state_mgr, sector_coverage_map)
        cf = compute_counterfactual_estimate(sid, need_res, graph, state_mgr)

        candidates.append({
            "sensor": sid,
            "sensorId": sid,
            "road": s.get("displayAlias", f"Sensor {sid}"),
            "sector": s.get("regionId", "REGION_A"),
            "regionId": s.get("regionId", "REGION_A"),
            "needScore": need_res["needScore"],
            "expectedBenefit": cf["expectedBenefit"],
            "expectedBytes": cf["withQuery"]["expectedCost"],
            "queryUtility": cf["queryUtility"],
            "reason": need_res["reasons"][0] if need_res.get("reasons") else "Nominal",
            "action": "Query" if cf["decision"] == "QUERY" else "Skip",
            "decision": cf["decision"],
            "commState": st.get("commState", "NORMAL")
        })

    candidates.sort(key=lambda c: c["queryUtility"], reverse=True)
    return candidates
