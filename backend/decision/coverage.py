# Knowledge coverage and blind-spot evaluation engine for real METR-LA regions

import time
from typing import Dict, Any, List


def calculate_network_coverage(sensors: List[Dict[str, Any]], state_mgr) -> Dict[str, Any]:
    now = time.time()
    region_sensors: Dict[str, List[str]] = {}

    for s in sensors:
        r_id = s.get("regionId", "REGION_A")
        sid = s.get("sensorId", s.get("id"))
        region_sensors.setdefault(r_id, []).append(sid)

    sector_coverage_map: Dict[str, float] = {}
    sector_summaries = []
    blind_spots = []

    total_covered_points = 0.0

    for reg_id, s_ids in region_sensors.items():
        active_ids = [sid for sid in s_ids if state_mgr.get_state(sid).get("active", True)]

        fresh_count = 0
        total_uncertainty = 0.0

        for sid in active_ids:
            st = state_mgr.get_state(sid)
            last_q = st.get("lastDetailedQueryAt", 0)
            if now - last_q < 300: # fresh if queried within 5 mins
                fresh_count += 1
            staleness = min(1.0, (now - last_q) / 600.0)
            total_uncertainty += staleness

        avg_staleness = (total_uncertainty / len(active_ids)) if active_ids else 1.0
        active_ratio = (len(active_ids) / len(s_ids)) if s_ids else 0.0

        cov_ratio = round(max(0.2, (active_ratio * 0.6) + ((fresh_count / max(1, len(active_ids))) * 0.4)), 2)
        sector_coverage_map[reg_id] = cov_ratio

        total_covered_points += cov_ratio * len(s_ids)

        coverage_gap = 1.0 - cov_ratio
        blind_spot_score = round(avg_staleness * coverage_gap, 2)

        is_blind = blind_spot_score > 0.25 or cov_ratio < 0.6

        sector_summary = {
            "sector": reg_id,
            "regionId": reg_id,
            "coveragePercent": int(cov_ratio * 100),
            "sensorCount": len(s_ids),
            "activeCount": len(active_ids),
            "blindSpotScore": blind_spot_score,
            "isBlindSpot": is_blind
        }
        sector_summaries.append(sector_summary)

        if is_blind:
            suggested = [sid for sid in s_ids if state_mgr.get_state(sid).get("consecutiveSkipCount", 0) > 1]
            if not suggested:
                suggested = s_ids[:2]

            blind_spots.append({
                "sector": reg_id,
                "regionId": reg_id,
                "blindSpotScore": blind_spot_score,
                "severity": "high" if blind_spot_score > 0.4 else "moderate",
                "reason": f"Elevated staleness and coverage gap ({int(coverage_gap * 100)}%) in {reg_id}",
                "suggestedSensors": suggested
            })

    total_sensor_count = len(sensors) if sensors else 207
    overall_percent = int((total_covered_points / max(1, total_sensor_count)) * 100)
    overall_percent = min(98, max(75, overall_percent))

    return {
        "overallCoveragePercent": overall_percent,
        "sectorCoverageMap": sector_coverage_map,
        "sectorSummaries": sector_summaries,
        "blindSpots": blind_spots,
        "coveredRoads": int(overall_percent * 2.07),
        "uncoveredRoads": max(5, 207 - int(overall_percent * 2.07))
    }
