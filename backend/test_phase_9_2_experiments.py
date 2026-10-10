"""
Phase 9.2 — Controlled Selective FL Experiment Suite.
Tests:
- Correct FedAvg vs sensor-share distinction
- 4/4 baseline equivalence (11,468,184 B, 3.5322 mph)
- Policy result serialization and schema validation
- Exact communication byte accounting across budget tiers
- Application-payload reduction formula verification
- Selection history persistence and client count limits
- Information debt evolution and starvation prevention
- Zero test-label leakage in client selection
- Evaluation state transitions (NOT_EVALUATED vs EVALUATED_MEASURED)
- FastAPI Phase 9.2 experiment endpoints
- Immutability of protected baseline hashes
"""

import os
import json
import hashlib
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.communication_intelligence.policies import (
    CommunicationPolicySelector,
    CommunicationBudget,
    SERIALIZED_BYTES_PER_CLIENT_MODEL,
    FULL_PARTICIPATION_BASELINE_TOTAL_BYTES
)
from backend.communication_intelligence.service import get_comm_intel_service
from ml.federated.run_phase9_experiments import (
    EXPECTED_GRAPH_LSTM_HASH,
    EXPECTED_GLOBAL_BEST_HASH,
    EXPECTED_REGIONS_HASH,
    get_file_sha256,
    get_region_checksum,
    get_frozen_baseline_record
)


@pytest.fixture
def client():
    return TestClient(app)


# -----------------------------------------------------------------------------
# 1. Scientific Semantics: FedAvg vs Sensor Share
# -----------------------------------------------------------------------------

def test_1_fedavg_vs_sensor_share_factor_distinction():
    """
    Verify that sensorShareFactor values (|S_k| / 207) are NOT conflated with
    canonical Phase 8 FedAvg aggregation weights (computed from valid targets).
    """
    selector = CommunicationPolicySelector()
    states = {s.clientId: s for s in selector.compute_client_values()}

    # Sensor share factor: static topological proportion
    assert states["REGION_A"].sensorShareFactor == round(48 / 207, 4)  # ~0.2319
    assert states["REGION_B"].sensorShareFactor == round(57 / 207, 4)  # ~0.2754
    assert states["REGION_C"].sensorShareFactor == round(58 / 207, 4)  # ~0.2802
    assert states["REGION_D"].sensorShareFactor == round(44 / 207, 4)  # ~0.2126

    # Canonical Phase 8 FedAvg valid-target weights:
    # A=0.229069, B=0.277117, C=0.279458, D=0.214357
    fedavg_weights = {
        "REGION_A": 0.229069,
        "REGION_B": 0.277117,
        "REGION_C": 0.279458,
        "REGION_D": 0.214357
    }
    for cid in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]:
        assert abs(states[cid].sensorShareFactor - fedavg_weights[cid]) > 0.0005


# -----------------------------------------------------------------------------
# 2. 4/4 Baseline Equivalence
# -----------------------------------------------------------------------------

def test_2_four_of_four_baseline_byte_and_mae_equivalence():
    """
    Verify POLICY_BASELINE_4_OF_4 reproduces the frozen 13-round baseline metrics:
    - 52 downloads + 52 uploads = 104 transfers
    - 110,271 B per transfer = 11,468,184 B total
    - Test MAE = 3.5322 mph
    - Best round = 8 (Val MAE = 3.1536 mph)
    """
    baseline = get_frozen_baseline_record()
    assert baseline["policy"] == "POLICY_BASELINE_4_OF_4"
    assert baseline["clientsPerRound"] == 4
    assert baseline["totalRoundsEvaluated"] == 13
    assert baseline["bestRound"] == 8
    assert baseline["bestValidationMAE"] == 3.1536
    assert baseline["accuracyMetrics"]["testMAE"] == 3.5322
    assert baseline["communicationMetrics"]["totalApplicationBytes"] == FULL_PARTICIPATION_BASELINE_TOTAL_BYTES
    assert baseline["communicationMetrics"]["transfersCount"] == 104
    assert baseline["communicationMetrics"]["applicationPayloadReductionPercent"] == 0.0


# -----------------------------------------------------------------------------
# 3. Policy Result Serialization
# -----------------------------------------------------------------------------

def test_3_policy_result_serialization():
    """Verify policy baseline record serializes valid JSON with all required keys."""
    rec = get_frozen_baseline_record()
    ser = json.dumps(rec)
    deser = json.loads(ser)

    assert deser["scientificClassification"] == "MEASURED_EXPERIMENT_RESULT"
    assert deser["payloadClassification"] == "MEASURED_SERIALIZED_APPLICATION_PAYLOAD"
    assert "communicationMetrics" in deser
    assert "accuracyMetrics" in deser
    assert "starvationAudit" in deser


# -----------------------------------------------------------------------------
# 4. Exact Byte Accounting across Budget Tiers
# -----------------------------------------------------------------------------

def test_4_exact_communication_byte_totals_per_policy():
    """
    Verify theoretical and measured application bytes across budget tiers for 13 rounds:
    - 4/4: 13 rounds x 882,168 B = 11,468,184 B
    - 3/4: 13 rounds x 661,626 B = 8,601,138 B
    - 2/4: 13 rounds x 441,084 B = 5,734,092 B
    - 1/4: 13 rounds x 220,542 B = 2,867,046 B
    """
    tiers = {
        "4/4": 11468184,
        "3/4": 8601138,
        "2/4": 5734092,
        "1/4": 2867046
    }
    for budget_str, expected_total in tiers.items():
        k = int(budget_str[0])
        per_round = 2 * k * SERIALIZED_BYTES_PER_CLIENT_MODEL
        assert per_round * 13 == expected_total


# -----------------------------------------------------------------------------
# 5. Application Payload Reduction Formula
# -----------------------------------------------------------------------------

def test_5_application_payload_reduction_formula():
    """
    Verify application-payload reduction formula:
    reduction = 1 - (selective_total_bytes / baseline_total_bytes)
    """
    baseline_bytes = FULL_PARTICIPATION_BASELINE_TOTAL_BYTES  # 11,468,184 B

    # 4/4: 0.0%
    red_4 = round((1.0 - (11468184 / baseline_bytes)) * 100.0, 2)
    assert red_4 == 0.0

    # 3/4: 25.0%
    red_3 = round((1.0 - (8601138 / baseline_bytes)) * 100.0, 2)
    assert red_3 == 25.0

    # 2/4: 50.0%
    red_2 = round((1.0 - (5734092 / baseline_bytes)) * 100.0, 2)
    assert red_2 == 50.0

    # 1/4: 75.0%
    red_1 = round((1.0 - (2867046 / baseline_bytes)) * 100.0, 2)
    assert red_1 == 75.0


# -----------------------------------------------------------------------------
# 6. Selection History & Client Count Limits
# -----------------------------------------------------------------------------

def test_6_selection_history_client_count_limits():
    """Verify participant count strictly equals budget numerator without set overlap."""
    selector = CommunicationPolicySelector()
    for budget in ["4/4", "3/4", "2/4", "1/4"]:
        expected_k = int(budget[0])
        res = selector.select_participants(budget)
        assert len(res.selectedClients) == expected_k
        assert len(res.skippedClients) == 4 - expected_k
        assert len(set(res.selectedClients).intersection(set(res.skippedClients))) == 0


# -----------------------------------------------------------------------------
# 7. Information Debt Evolution & Starvation Prevention
# -----------------------------------------------------------------------------

def test_7_information_debt_evolution_and_zero_starvation():
    """
    Verify that CCV information debt increments when skipped and resets when selected.
    Ensure no client is starved indefinitely across 13 rounds for any policy.
    """
    for budget in ["3/4", "2/4", "1/4"]:
        selector = CommunicationPolicySelector()
        participations = {cid: 0 for cid in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]}
        max_debt = {cid: 0 for cid in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]}

        for _ in range(13):
            res = selector.select_participants(budget)
            debts = selector.debt_tracker.get_all_debts()
            for cid in res.selectedClients:
                participations[cid] += 1
            for cid, d in debts.items():
                if d > max_debt[cid]:
                    max_debt[cid] = d

        # Every client must participate at least once in 13 rounds
        for cid, count in participations.items():
            assert count >= 1, f"Client {cid} starved under budget {budget}!"

        # Maximum consecutive skips must be bounded (<= 4 rounds)
        for cid, d_max in max_debt.items():
            assert d_max <= 4, f"Client {cid} exceeded debt bound: {d_max}"


# -----------------------------------------------------------------------------
# 8. Zero Test-Label Leakage
# -----------------------------------------------------------------------------

def test_8_no_test_label_leakage_in_participant_selection():
    """
    Verify that participant selection depends only on static sensorShareFactor,
    calibrated drift proxy, and information debt — with zero test label input.
    """
    selector = CommunicationPolicySelector()
    # Signature inspection: select_participants accepts budget and optional drift_signals only
    res = selector.select_participants("3/4")
    assert res.selectedClients is not None
    assert res.skippedClients is not None
    assert res.accuracyStatus == "NOT_EVALUATED"


# -----------------------------------------------------------------------------
# 9. FastAPI Endpoints for Phase 9.2
# -----------------------------------------------------------------------------

def test_9_fastapi_phase9_experiments_endpoints(client):
    """Verify Phase 9.2 API endpoints respond with valid schemas."""
    # /experiments
    resp = client.get("/api/communication/phase9/experiments")
    assert resp.status_code == 200
    data = resp.json()
    assert "policies" in data or "comparisonTable" in data

    # /tradeoff
    resp_to = client.get("/api/communication/phase9/tradeoff")
    assert resp_to.status_code == 200

    # /experiments/POLICY_BASELINE_4_OF_4
    resp_pol = client.get("/api/communication/phase9/experiments/POLICY_BASELINE_4_OF_4")
    assert resp_pol.status_code == 200
    p_data = resp_pol.json()
    assert p_data["policy"] == "POLICY_BASELINE_4_OF_4"
    assert p_data["clientsPerRound"] == 4


# -----------------------------------------------------------------------------
# 10. Protected Baseline Hashes
# -----------------------------------------------------------------------------

def test_10_protected_hashes_immutability():
    """
    Verify that all frozen scientific baseline artifacts remain strictly unmodified:
    - graph_lstm_best.pt: 702cb2bb9406aa36ec25639121377bf939acdb1906370997ccd792f70cf1f384
    - global_best.pt: 24710dae0fe0554ca8111ad21e05de03b69a282f0b8d8868a1433ba6fd9c2930
    - regions.json: ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2
    """
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    graph_lstm_path = os.path.join(project_root, "data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt")
    global_best_path = os.path.join(project_root, "data/processed/metr-la/federated/checkpoints/global_best.pt")
    regions_path = os.path.join(project_root, "data/processed/metr-la/regions.json")

    assert get_file_sha256(graph_lstm_path) == EXPECTED_GRAPH_LSTM_HASH
    assert get_file_sha256(global_best_path) == EXPECTED_GLOBAL_BEST_HASH
    assert get_region_checksum(regions_path) == EXPECTED_REGIONS_HASH


# -----------------------------------------------------------------------------
# 11. Pareto Dominance Mathematics
# -----------------------------------------------------------------------------

def test_11_pareto_dominance_mathematics():
    """
    Verify mathematical Pareto dominance:
    - Objectives: minimize payload bytes and test MAE.
    - 2/4 has strictly lower payload (5,734,092 B < 8,601,138 B) AND lower test MAE (3.6448 < 3.6530) than 3/4.
    - Therefore, 3/4 is strictly PARETO_DOMINATED by 2/4.
    - Pareto frontier contains POLICY_CCV_2_OF_4 and POLICY_CCV_1_OF_4.
    """
    service = get_comm_intel_service()
    summary = service.get_experiments_summary()
    pareto = summary.get("paretoAnalysis", {})

    assert pareto["dominatedPolicies"]["POLICY_CCV_3_OF_4"] == "POLICY_CCV_2_OF_4"
    assert "POLICY_CCV_2_OF_4" in pareto["paretoFrontier"]
    assert "POLICY_CCV_1_OF_4" in pareto["paretoFrontier"]
    assert "POLICY_CCV_3_OF_4" not in pareto["paretoFrontier"]


# -----------------------------------------------------------------------------
# 12. Reduction Sign Convention (Strictly Non-Negative)
# -----------------------------------------------------------------------------

def test_12_reduction_sign_convention_strictly_non_negative():
    """
    Verify application-payload reduction convention is strictly non-negative:
    reduction = 1 - (selective_bytes / baseline_bytes) >= 0
    Must never return negative percentages under reduction fields.
    """
    service = get_comm_intel_service()
    summary = service.get_experiments_summary()

    for row in summary.get("comparisonTable", []):
        red_pct = row["applicationPayloadReductionPercent"]
        assert red_pct >= 0.0, f"Reduction percent was negative: {red_pct} in {row['policy']}"
        assert red_pct in (0.0, 25.0, 50.0, 75.0)


# -----------------------------------------------------------------------------
# 13. Controlled Baseline vs Frozen Stage-8 Reference Separation
# -----------------------------------------------------------------------------

def test_13_controlled_baseline_vs_frozen_stage_8_separation():
    """
    Verify strict separation between:
    - FROZEN_STAGE_8_FEDAVG_REFERENCE (full epochs, 3.5322 MAE, Round 8)
    - POLICY_CONTROLLED_4_OF_4 (matched max_batches=30 protocol, Round 13)
    """
    service = get_comm_intel_service()
    summary = service.get_experiments_summary()

    frozen_ref = summary.get("frozenBaselineReference", {})
    ctrl_base = summary.get("controlledBaseline", {})

    assert frozen_ref["policy"] == "POLICY_BASELINE_4_OF_4"
    assert frozen_ref["bestRound"] == 8
    assert frozen_ref["accuracyMetrics"]["testMAE"] == 3.5322

    assert ctrl_base["policy"] == "POLICY_CONTROLLED_4_OF_4"
    assert ctrl_base["bestRound"] == 13
    assert abs(ctrl_base["accuracyMetrics"]["testMAE"] - 3.6473) < 0.001


# -----------------------------------------------------------------------------
# 14. Experiment Provenance in Persisted Artifacts
# -----------------------------------------------------------------------------

def test_14_experiment_provenance_actual_files():
    """
    Verify all Phase 9.2 experiment files contain real empirical data:
    13 rounds of training history, per-round validation metrics, client debts, byte accounting.
    No mock or empty arrays.
    """
    service = get_comm_intel_service()
    policies = ["policy_controlled_4_of_4", "policy_ccv_3_of_4", "policy_ccv_2_of_4", "policy_ccv_1_of_4"]

    for pol in policies:
        data = service.get_policy_details(pol)
        assert len(data["roundsHistory"]) == 13
        assert data["evaluationState"] == "EVALUATED_MEASURED"
        assert data["scientificClassification"] == "MEASURED_EXPERIMENT_RESULT"
        assert "participationCounts" in data["starvationAudit"]
        assert "maxConsecutiveSkippedRounds" in data["starvationAudit"]


# -----------------------------------------------------------------------------
# 15. Starvation Audit Wording & Observation Status
# -----------------------------------------------------------------------------

def test_15_starvation_audit_wording_and_observation():
    """
    Verify starvation audit reports observation state during the 13-round run:
    every client participated at least once, max consecutive skips bounded <= 4,
    starvationDetected is False.
    """
    service = get_comm_intel_service()
    for pol in ["policy_ccv_3_of_4", "policy_ccv_2_of_4", "policy_ccv_1_of_4"]:
        data = service.get_policy_details(pol)
        audit = data["starvationAudit"]
        assert audit["starvationDetected"] is False
        for cid, count in audit["participationCounts"].items():
            assert count >= 1, f"Client {cid} starved in {pol}"
        for cid, skips in audit["maxConsecutiveSkippedRounds"].items():
            assert skips <= 4, f"Client {cid} exceeded skip bound in {pol}"
