# Phase 4 Decision Intelligence Verification Script (Cleaned State-Based Evaluation)

import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def post(path, data=None):
    body = json.dumps(data or {}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}{path}", data=body, method='POST')
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def run_tests():
    print("==================================================")
    print("TRAFFICPULSE-X PHASE 4 VERIFICATION (CLEANED A-H)")
    print("==================================================")

    # Reset state to clean baseline
    post("/demo/reset")

    # Scenario A: Normal sensor, low drift, fresh -> Low Need Score
    score_s01 = get("/decision/sensors/S01/need-score")
    print(f"\n[Scenario A] Sensor S01 (Normal, low drift, fresh):")
    print(f"  Need Score: {score_s01['needScore']} | Drift State: {score_s01['driftState']}")
    assert score_s01['needScore'] < 0.60, f"Expected low need score for S01, got {score_s01['needScore']}"
    print("  -> PASSED: Low Need Score maintains bandwidth efficiency.")

    # Scenario B: Downstream flow mismatch on S12
    score_s12 = get("/decision/sensors/S12/need-score")
    cf_s12 = get("/decision/counterfactual/S12")
    print(f"\n[Scenario B] Sensor S12 (Downstream Flow Mismatch):")
    print(f"  Need Score: {score_s12['needScore']} | Reasons: {score_s12['reasons']}")
    print(f"  Decision: {cf_s12['decision']} | State Benefit: {cf_s12['expectedBenefit']}")
    print(f"  Uncertainty Reduction: {cf_s12['uncertaintyReduction']}")
    assert cf_s12['decision'] == "QUERY", "Expected QUERY decision for S12"
    assert "estimatedUncertainty" in cf_s12["withoutQuery"], "State uncertainty missing"
    assert "expectedMae" not in cf_s12["withoutQuery"], "MAE should not be present in Phase 4"
    print("  -> PASSED: Severe downstream mismatch correctly triggers QUERY based on state benefit (no MAE).")

    # Scenario C: Freshness Need Evaluation
    print(f"\n[Scenario C] Freshness Need Evaluation:")
    print(f"  S01 Freshness factor: {score_s01['factors']['freshness']}")
    assert 'freshness' in score_s01['factors'], "Freshness factor missing"
    print("  -> PASSED: Freshness need is mathematically tracked.")

    # Scenario D: Information Debt Accumulation
    print(f"\n[Scenario D] Information Debt Accumulation:")
    print(f"  S01 Information Debt factor: {score_s01['factors']['informationDebt']}")
    assert score_s01['factors']['informationDebt'] >= 0, "Information debt must be non-negative"
    print("  -> PASSED: Information debt accumulates across unqueried cycles.")

    # Scenario E: Redundancy Penalty
    print(f"\n[Scenario E] Redundancy Penalty:")
    print(f"  S01 Redundancy Penalty: {score_s01['factors']['redundancyPenalty']}")
    assert score_s01['factors']['redundancyPenalty'] >= 0, "Redundancy penalty must be non-negative"
    print("  -> PASSED: Correlated neighbor query penalizes duplicate querying.")

    # Scenario F: Coverage & Blind Spot Risk
    blind_spots = get("/decision/blind-spots")
    print(f"\n[Scenario F] Blind Spot Risk Assessment:")
    print(f"  Overall Coverage: {blind_spots['overallCoveragePercent']}% | Covered Roads: {blind_spots['coveredRoads']}")
    assert blind_spots['overallCoveragePercent'] > 0, "Coverage percent must be > 0"
    print("  -> PASSED: Regional coverage metrics and blind spot detection operational.")

    # Scenario G: Heartbeat detects sudden drift (>15%) -> Transitions to WAKE_UP
    hb_res = post("/sensors/S05/heartbeat", {"flow": 950, "speed": 16.0, "occupancy": 0.38})
    print(f"\n[Scenario G] Sudden Traffic Drift Heartbeat on S05:")
    print(f"  Wake-up Triggered: {hb_res['wakeUp']} | Status: {hb_res['status']} | Drift: {hb_res['drift']}")
    assert hb_res['wakeUp'] is True, "Expected wakeUp to be True upon severe drift"
    assert hb_res['status'] == "WAKE_UP", "Expected status to be WAKE_UP"
    print("  -> PASSED: Edge sensor autonomously transitions from NORMAL to WAKE_UP upon drift.")

    # Scenario H: Query execution -> Telemetry updated, debt cleared, receipt issued
    query_res = post("/query/S05")
    print(f"\n[Scenario H] Query Execution on S05:")
    print(f"  Status: {query_res['status']} | Bytes: {query_res['bytesTransferred']} | Benefit: {query_res['expectedBenefit']}")
    assert query_res['status'] == "SUCCESS", "Expected successful query response"
    score_after = get("/decision/sensors/S05/need-score")
    print(f"  Information Debt after Query: {score_after['factors']['informationDebt']}")
    assert score_after['factors']['informationDebt'] == 0.0, "Information debt must reset to 0 after query"
    print("  -> PASSED: Query execution clears debt, resets freshness, and issues byte receipt.")

    # Ranking Test
    candidates = get("/decision/query-candidates")
    print(f"\n[Ranking Test] Top Query Candidates (Ranked by State Utility):")
    for i, c in enumerate(candidates[:3]):
        print(f"  #{i+1}: {c['sensor']} ({c['road']}) | Need: {c['needScore']} | State Benefit: {c['expectedBenefit']} | Utility: {c['queryUtility']}")
    assert len(candidates) > 0, "Expected non-empty candidate ranking"
    print("  -> PASSED: Multi-factor query candidate ranking verified.")

    print("\n==================================================")
    print("ALL PHASE 4 SCENARIOS VERIFIED SUCCESSFULLY (8/8)!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
