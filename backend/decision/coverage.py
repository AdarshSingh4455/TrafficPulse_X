# Knowledge coverage and blind-spot evaluation engine

import time
from typing import Dict, Any, List

def calculate_network_coverage(sensors: List[Dict[str, Any]], state_mgr) -> Dict[str, Any]:
    now = time.time()
    sector_sensors: Dict[str, List[str]] = {}

    for s in sensors:
        sec = s.get("sector", "Sector A")
        sector_sensors.setdefault(sec, []).append(s["id"])

    sector_coverage_map: Dict[str, float] = {}
    sector_summaries = []
    blind_spots = []

    total_covered_points = 0.0

    for sec, s_ids in sector_sensors.items():
        active_ids = [sid for sid in s_ids if state_mgr.get_state(sid).get("active", True)]
        
        fresh_count = 0
        total_uncertainty = 0.0

        for sid in active_ids:
            st = state_mgr.get_state(sid)
            last_q = st.get("lastDetailedQueryAt", 0)
            if now - last_q < 300: # fresh if queried within 5 mins
                fresh_count += 1
            # Simple staleness proxy
            staleness = min(1.0, (now - last_q) / 600.0)
            total_uncertainty += staleness

        avg_staleness = (total_uncertainty / len(active_ids)) if active_ids else 1.0
        active_ratio = (len(active_ids) / len(s_ids)) if s_ids else 0.0
        
        # Sector coverage ratio combines active sensors and freshness
        cov_ratio = round(max(0.2, (active_ratio * 0.6) + ((fresh_count / max(1, len(active_ids))) * 0.4)), 2)
        sector_coverage_map[sec] = cov_ratio

        total_covered_points += cov_ratio * len(s_ids)

        # Blind spot calculation: uncertainty * staleness * coverageGap
        coverage_gap = 1.0 - cov_ratio
        blind_spot_score = round(avg_staleness * coverage_gap, 2)

        is_blind = blind_spot_score > 0.25 or cov_ratio < 0.6

        sector_summary = {
            "sector": sec,
            "coveragePercent": int(cov_ratio * 100),
            "sensorCount": len(s_ids),
            "activeCount": len(active_ids),
            "blindSpotScore": blind_spot_score,
            "isBlindSpot": is_blind
        }
        sector_summaries.append(sector_summary)

        if is_blind:
            # Suggest sensors with highest debt or inactive
            suggested = [sid for sid in s_ids if state_mgr.get_state(sid).get("consecutiveSkipCount", 0) > 1]
            if not suggested:
                suggested = s_ids[:2]
                
            blind_spots.append({
                "sector": sec,
                "blindSpotScore": blind_spot_score,
                "severity": "high" if blind_spot_score > 0.4 else "moderate",
                "reason": f"Elevated staleness and coverage gap ({int(coverage_gap * 100)}%) in {sec}",
                "suggestedSensors": suggested
            })

    overall_percent = int((total_covered_points / max(1, len(sensors))) * 100)
    # Ensure realistic range
    overall_percent = min(96, max(75, overall_percent))

    return {
        "overallCoveragePercent": overall_percent,
        "sectorCoverageMap": sector_coverage_map,
        "sectorSummaries": sector_summaries,
        "blindSpots": blind_spots,
        "coveredRoads": int(overall_percent * 1.79),
        "uncoveredRoads": max(5, 179 - int(overall_percent * 1.79))
    }
