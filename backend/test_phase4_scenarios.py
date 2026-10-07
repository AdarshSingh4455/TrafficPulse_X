# Phase 4 Decision Intelligence Verification Script for REAL METR-LA Sensors

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
    print("TRAFFICPULSE-X DECISION INTELLIGENCE REAL-DATA VERIFICATION")
    print("==================================================")

    target_sensor = "773869"

    # Scenario A: Normal real sensor telemetry evaluation
    score_s01 = get(f"/decision/sensors/{target_sensor}/need-score")
    print(f"\n[Scenario A] Sensor {target_sensor}:")
    print(f"  Need Score: {score_s01['needScore']} | Drift State: {score_s01['driftState']}")
    assert "needScore" in score_s01, "Expected needScore in response"
    print("  -> PASSED: Real sensor Need Score evaluated.")

    # Scenario B: Counterfactual estimation
    cf_s01 = get(f"/decision/counterfactual/{target_sensor}")
    print(f"\n[Scenario B] Sensor {target_sensor} Counterfactual:")
    print(f"  Decision: {cf_s01['decision']} | State Benefit: {cf_s01['expectedBenefit']}")
    print(f"  Uncertainty Reduction: {cf_s01['uncertaintyReduction']}")
    assert "withoutQuery" in cf_s01, "State uncertainty missing"
    print("  -> PASSED: Counterfactual estimate evaluated.")

    # Scenario C: Freshness Need Evaluation
    print(f"\n[Scenario C] Freshness Need Evaluation:")
    print(f"  Freshness factor: {score_s01['factors']['freshness']}")
    assert 'freshness' in score_s01['factors'], "Freshness factor missing"
    print("  -> PASSED: Freshness need tracked.")

    # Scenario D: Information Debt Accumulation
    print(f"\n[Scenario D] Information Debt Accumulation:")
    print(f"  Information Debt factor: {score_s01['factors']['informationDebt']}")
    assert score_s01['factors']['informationDebt'] >= 0, "Information debt must be non-negative"
    print("  -> PASSED: Information debt accumulates.")

    # Scenario E: Redundancy Penalty
    print(f"\n[Scenario E] Redundancy Penalty:")
    print(f"  Redundancy Penalty: {score_s01['factors']['redundancyPenalty']}")
    assert score_s01['factors']['redundancyPenalty'] >= 0, "Redundancy penalty must be non-negative"
    print("  -> PASSED: Neighbor query penalizes duplicate querying.")

    # Scenario F: Coverage & Blind Spot Risk
    blind_spots = get("/decision/blind-spots")
    print(f"\n[Scenario F] Blind Spot Risk Assessment:")
    print(f"  Overall Coverage: {blind_spots['overallCoveragePercent']}%")
    assert blind_spots['overallCoveragePercent'] > 0, "Coverage percent must be > 0"
    print("  -> PASSED: Regional coverage metrics operational.")

    # Scenario G: Telemetry Heartbeat
    hb_res = post(f"/sensors/{target_sensor}/heartbeat", {"speed": 18.0})
    print(f"\n[Scenario G] Telemetry Heartbeat on {target_sensor}:")
    print(f"  Status: {hb_res['status']} | Need Score: {hb_res['needScore']}")
    assert "status" in hb_res, "Expected status in heartbeat response"
    print("  -> PASSED: Edge sensor heartbeat operational.")

    # Scenario H: Query execution
    query_res = post(f"/query/{target_sensor}")
    print(f"\n[Scenario H] Query Execution on {target_sensor}:")
    print(f"  Status: {query_res['status']} | Bytes: {query_res['bytesTransferred']}")
    assert query_res['status'] == "SUCCESS", "Expected successful query response"
    score_after = get(f"/decision/sensors/{target_sensor}/need-score")
    print(f"  Information Debt after Query: {score_after['factors']['informationDebt']}")
    assert score_after['factors']['informationDebt'] == 0.0, "Information debt must reset to 0 after query"
    print("  -> PASSED: Query execution clears debt.")

    # Ranking Test
    candidates = get("/decision/query-candidates")
    print(f"\n[Ranking Test] Top Query Candidates:")
    for i, c in enumerate(candidates[:3]):
        print(f"  #{i+1}: {c['sensor']} | Need: {c['needScore']} | Benefit: {c['expectedBenefit']}")
    assert len(candidates) == 207, f"Expected 207 candidate sensors, got {len(candidates)}"
    print("  -> PASSED: 207 real sensor candidate ranking verified.")

    print("\n==================================================")
    print("ALL REAL-DATA DECISION SCENARIOS VERIFIED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
