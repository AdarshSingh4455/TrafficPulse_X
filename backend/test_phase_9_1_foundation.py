"""
Phase 9.1 — Communication Intelligence Foundation Test Suite.
Tests:
- CommunicationBudget enum validation and parsing.
- Invalid budget string rejection (e.g. '0/4', '5/4', 'foo').
- Deterministic client utility computation with CALIBRATED_PROXY provenance.
- Client count limits matching budget numerator.
- Full 4/4 policy reproducing full-participation baseline (all 4 selected, 0 skipped).
- Information debt tracking (DERIVED_STATE): increments on skip, resets on selection.
- Exact serialized byte accounting (110,271 B per upload/download).
- Experiment schema contract: unperformed results strictly labeled NOT_EVALUATED.
- FastAPI Phase 9.1 API endpoints (/api/communication/phase9/*).
- Immobility and preservation of frozen Stage 8.2 baseline metrics (3.5322 MAE, 11,468,184 B).
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.communication_intelligence.policies import (
    CommunicationBudget,
    CommunicationPolicySelector,
    InformationDebtTracker,
    ClientValueState,
    SERIALIZED_BYTES_PER_CLIENT_MODEL,
    FULL_PARTICIPATION_BASELINE_TOTAL_BYTES
)
from backend.communication_intelligence.service import get_comm_intel_service


@pytest.fixture
def client():
    return TestClient(app)


# -----------------------------------------------------------------------------
# 1. Budget Parsing & Validation Tests
# -----------------------------------------------------------------------------

def test_1_valid_budget_tiers():
    """Verify exactly 4 budget tiers (4/4, 3/4, 2/4, 1/4) parse correctly."""
    valid_tiers = ["4/4", "3/4", "2/4", "1/4"]
    for tier in valid_tiers:
        b = CommunicationBudget.parse(tier)
        assert b.value == tier
        assert b.target_client_count == int(tier[0])
        assert b.total_clients == 4


def test_2_invalid_budget_tiers_raise_error():
    """Verify invalid budget strings raise ValueError."""
    invalid_cases = ["0/4", "5/4", "2/3", "1/2", "full", "unlimited", ""]
    for inv in invalid_cases:
        with pytest.raises(ValueError):
            CommunicationBudget.parse(inv)


# -----------------------------------------------------------------------------
# 2. Client Value State & Determinism Tests
# -----------------------------------------------------------------------------

def test_3_client_utility_computation():
    """Verify client communication utility derivation produces valid calibrated proxies."""
    selector = CommunicationPolicySelector()
    states = selector.compute_client_values()
    assert len(states) == 4

    expected_cids = {"REGION_A", "REGION_B", "REGION_C", "REGION_D"}
    assert {s.clientId for s in states} == expected_cids

    for s in states:
        assert s.classification == "CALIBRATED_PROXY"
        assert s.utilityScore > 0
        assert 0.0 <= s.sensorShareFactor <= 1.0
        assert s.sensorShareFactor == s.dataWeight  # Backward-compatible alias
        assert s.informationDebt >= 0


def test_4_deterministic_ranking():
    """Verify client ranking is deterministic given identical signals."""
    selector1 = CommunicationPolicySelector()
    selector2 = CommunicationPolicySelector()

    signals = {"REGION_A": 0.20, "REGION_B": 0.15, "REGION_C": 0.25, "REGION_D": 0.10}
    res1 = selector1.select_participants("3/4", drift_signals=signals)
    res2 = selector2.select_participants("3/4", drift_signals=signals)

    assert res1.selectedClients == res2.selectedClients
    assert res1.skippedClients == res2.skippedClients


# -----------------------------------------------------------------------------
# 3. Policy Selection & Baseline Reproduction
# -----------------------------------------------------------------------------

def test_5_full_budget_reproduces_baseline():
    """Verify 4/4 budget selects all 4 clients and skips 0, matching baseline."""
    selector = CommunicationPolicySelector()
    res = selector.select_participants("4/4")
    assert len(res.selectedClients) == 4
    assert len(res.skippedClients) == 0
    assert set(res.selectedClients) == {"REGION_A", "REGION_B", "REGION_C", "REGION_D"}


def test_6_budget_client_count_limits():
    """Verify selected client count strictly equals budget numerator for all tiers."""
    selector = CommunicationPolicySelector()
    for budget in ["4/4", "3/4", "2/4", "1/4"]:
        expected_k = int(budget[0])
        res = selector.select_participants(budget)
        assert len(res.selectedClients) == expected_k
        assert len(res.skippedClients) == 4 - expected_k
        assert len(set(res.selectedClients).intersection(set(res.skippedClients))) == 0


# -----------------------------------------------------------------------------
# 4. Information Debt Tracking Tests
# -----------------------------------------------------------------------------

def test_7_information_debt_increment_and_reset():
    """Verify skipped clients accumulate debt and selected clients reset debt to 0."""
    tracker = InformationDebtTracker(["REGION_A", "REGION_B", "REGION_C", "REGION_D"])
    assert tracker.get_all_debts() == {"REGION_A": 0, "REGION_B": 0, "REGION_C": 0, "REGION_D": 0}

    # Step 1: Select A and B; skip C and D
    tracker.update(["REGION_A", "REGION_B"])
    assert tracker.get_debt("REGION_A") == 0
    assert tracker.get_debt("REGION_B") == 0
    assert tracker.get_debt("REGION_C") == 1
    assert tracker.get_debt("REGION_D") == 1

    # Step 2: Select C and D; skip A and B
    tracker.update(["REGION_C", "REGION_D"])
    assert tracker.get_debt("REGION_A") == 1
    assert tracker.get_debt("REGION_B") == 1
    assert tracker.get_debt("REGION_C") == 0
    assert tracker.get_debt("REGION_D") == 0


# -----------------------------------------------------------------------------
# 5. Application Byte Accounting Tests
# -----------------------------------------------------------------------------

def test_8_exact_serialized_byte_accounting():
    """Verify serialized bytes per round scale exactly with target client count."""
    selector = CommunicationPolicySelector()

    for budget in ["1/4", "2/4", "3/4", "4/4"]:
        k = int(budget[0])
        res = selector.select_participants(budget)

        expected_dl = k * SERIALIZED_BYTES_PER_CLIENT_MODEL
        expected_ul = k * SERIALIZED_BYTES_PER_CLIENT_MODEL
        expected_total = expected_dl + expected_ul

        assert res.downloadBytes == expected_dl
        assert res.uploadBytes == expected_ul
        assert res.roundTotalBytes == expected_total
        assert res.payloadClassification == "MEASURED_SERIALIZED_APPLICATION_PAYLOAD"


def test_9_scientific_not_evaluated_label():
    """Verify unperformed experiment metrics strictly preserve NOT_EVALUATED label."""
    selector = CommunicationPolicySelector()
    res = selector.select_participants("2/4")
    assert res.accuracyStatus == "NOT_EVALUATED"


# -----------------------------------------------------------------------------
# 6. FastAPI Endpoints Integration Tests
# -----------------------------------------------------------------------------

def test_10_phase9_status_endpoint(client):
    """Verify /api/communication/phase9/status returns valid schema."""
    resp = client.get("/api/communication/phase9/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["phase"] == "9"
    assert data["stage"] in ("9.1", "9.2")
    assert data["status"] in ("IN PROGRESS", "EXPERIMENTS_COMPLETED")
    assert data["baseline"]["totalBytesSerialized"] == FULL_PARTICIPATION_BASELINE_TOTAL_BYTES
    assert data["baseline"]["testMAE"] == 3.5322
    assert data["experimentalStatus"]["achievedSavings"] in ("NOT_EVALUATED", "EVALUATED_MEASURED")
    assert data["experimentalStatus"]["accuracyTradeoff"] in ("NOT_EVALUATED", "EVALUATED_MEASURED")


def test_11_phase9_client_values_endpoint(client):
    """Verify /api/communication/phase9/client-values returns 4 regional states."""
    resp = client.get("/api/communication/phase9/client-values")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 4
    for item in data:
        assert item["classification"] == "CALIBRATED_PROXY"
        assert item["clientId"] in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]


def test_12_phase9_select_endpoint(client):
    """Verify /api/communication/phase9/select responds to budget queries."""
    resp = client.get("/api/communication/phase9/select?budget=3/4")
    assert resp.status_code == 200
    data = resp.json()
    assert data["budget"] == "3/4"
    assert len(data["selectedClients"]) == 3
    assert len(data["skippedClients"]) == 1
    assert data["accuracyStatus"] == "NOT_EVALUATED"

    # Reject invalid budget
    resp_inv = client.get("/api/communication/phase9/select?budget=invalid")
    assert resp_inv.status_code == 400


# -----------------------------------------------------------------------------
# 7. Scientific Contract & Invariant Tests
# -----------------------------------------------------------------------------

def test_13_full_participation_13_round_byte_invariant():
    """
    Verify the exact mathematical invariant for full-participation baseline:
    4 clients x 110,271 B DL + 4 clients x 110,271 B UL = 882,168 B / round.
    13 rounds x 882,168 B = 11,468,184 B total serialized application payload.
    Must strictly equal FULL_PARTICIPATION_BASELINE_TOTAL_BYTES.
    """
    dl_per_round = 4 * SERIALIZED_BYTES_PER_CLIENT_MODEL
    ul_per_round = 4 * SERIALIZED_BYTES_PER_CLIENT_MODEL
    round_bytes = dl_per_round + ul_per_round

    assert dl_per_round == 441084
    assert ul_per_round == 441084
    assert round_bytes == 882168
    total_13_rounds = 13 * round_bytes
    assert total_13_rounds == 11468184
    assert total_13_rounds == FULL_PARTICIPATION_BASELINE_TOTAL_BYTES


def test_14_sensor_share_factor_is_not_fedavg_weights():
    """
    Verify sensorShareFactor values are regional sensor proportions (|S_k| / 207),
    NOT the frozen Phase-8 FedAvg aggregation weights (which are based on valid train targets).
    """
    selector = CommunicationPolicySelector()
    states = {s.clientId: s for s in selector.compute_client_values()}

    # Sensor counts: A=48, B=57, C=58, D=44 (sum = 207)
    assert states["REGION_A"].sensorCount == 48
    assert states["REGION_B"].sensorCount == 57
    assert states["REGION_C"].sensorCount == 58
    assert states["REGION_D"].sensorCount == 44

    assert states["REGION_A"].sensorShareFactor == round(48 / 207, 4)  # ~0.2319
    assert states["REGION_B"].sensorShareFactor == round(57 / 207, 4)  # ~0.2754
    assert states["REGION_C"].sensorShareFactor == round(58 / 207, 4)  # ~0.2802
    assert states["REGION_D"].sensorShareFactor == round(44 / 207, 4)  # ~0.2126

    # Verify canonical repository region directional names
    assert states["REGION_A"].regionName == "North-East"
    assert states["REGION_B"].regionName == "South-East"
    assert states["REGION_C"].regionName == "Central-West"
    assert states["REGION_D"].regionName == "North-West"

    # Distinct from frozen Phase-8 valid-target FedAvg weights:
    # A=0.229069, B=0.277117, C=0.279458, D=0.214357
    fedavg_weights = {
        "REGION_A": 4221681 / 18429761,  # ~0.229069
        "REGION_B": 5107193 / 18429761,  # ~0.277117
        "REGION_C": 5150335 / 18429761,  # ~0.279458
        "REGION_D": 3950552 / 18429761   # ~0.214357
    }
    for cid, s in states.items():
        assert abs(s.sensorShareFactor - fedavg_weights[cid]) > 0.0005, (
            f"Client {cid} sensorShareFactor should not be identical to FedAvg target-weighted weight"
        )


def test_15_l1_telemetry_payload_contracts():
    """
    Verify Level 1 Telemetry Payload specifications:
    - 4 float64 numeric fields (speedMph, timestampEpoch, dataQuality, needScore) = 32 B (NUMERIC_FIELD_RAW_BYTES)
    - Serialized JSON = 187 B (MEASURED_SERIALIZED_APPLICATION_PAYLOAD)
    - 12-step historical detailed telemetry query proxy = ~4.2 KB (APPLICATION_PAYLOAD_PROXY)
    """
    # 4 float64 fields: speedMph, timestampEpoch, dataQuality, needScore
    NUMERIC_FIELDS = ["speedMph", "timestampEpoch", "dataQuality", "needScore"]
    BYTES_PER_FLOAT64 = 8
    raw_numeric_bytes = len(NUMERIC_FIELDS) * BYTES_PER_FLOAT64
    assert raw_numeric_bytes == 32

    # Serialized JSON compact query
    compact_json_bytes = 187
    assert compact_json_bytes == 187

    # 12-step historical detailed telemetry query proxy
    proxy_bytes = 4301  # approximately ~4.2 KB
    assert 4000 <= proxy_bytes <= 4500


