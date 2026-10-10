"""
Phase 9.1 — Communication Intelligence Foundation.
Provides clean, mathematically sound abstractions for selective federated communication:
- Communication budget constraints (4/4, 3/4, 2/4, 1/4)
- Client Communication Value (CCV) utility formulation:
    CCV_k = alpha * s_k + beta * d_k + lambda * tau_k
    where:
      s_k   : Regional sensor-share proportion |S_k| / 207 (DERIVED_HEURISTIC)
      d_k   : Regional traffic drift proxy (CALIBRATED_PROXY, range [0, 1])
      tau_k : Federated information debt = consecutive skipped rounds (DERIVED_STATE)
      alpha = 1.0, beta = 0.5, lambda = 0.15
- Participant selection interface with deterministic ranking
- Federated Information Debt tracking (DERIVED_STATE, consecutive skipped rounds)
- Exact application-layer serialized payload byte accounting (MEASURED_SERIALIZED_APPLICATION_PAYLOAD)
- Experiment result schema with explicit NOT_EVALUATED states for unperformed experiments.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class CommunicationBudget(str, Enum):
    """
    Allowed communication budget tiers for selective FL communication.
    Represents ratio of active regional clients selected per round out of 4 total clients.
    """
    FULL = "4/4"         # 4 clients (Full participation baseline)
    HIGH = "3/4"         # 3 clients (75% participation)
    MEDIUM = "2/4"       # 2 clients (50% participation)
    CONSTRAINED = "1/4"  # 1 client (25% participation)

    @classmethod
    def parse(cls, value: str) -> "CommunicationBudget":
        for member in cls:
            if member.value == value:
                return member
        valid_tiers = [m.value for m in cls]
        raise ValueError(f"Invalid communication budget '{value}'. Must be one of: {valid_tiers}")

    @property
    def target_client_count(self) -> int:
        return int(self.value.split("/")[0])

    @property
    def total_clients(self) -> int:
        return 4


# Frozen baseline byte constants per client model update
# Note: Measured serialized application payload; excludes lower-layer physical network headers.
SERIALIZED_BYTES_PER_CLIENT_MODEL: int = 110271
RAW_BYTES_PER_CLIENT_MODEL: int = 106384
FULL_PARTICIPATION_BASELINE_TOTAL_BYTES: int = 11468184


class ClientValueState(BaseModel):
    """
    Representation of a client's communication utility for selective polling.
    Classified explicitly as CALIBRATED_PROXY / HEURISTIC.
    """
    clientId: str
    regionName: str
    sensorCount: int
    sensorShareFactor: float = Field(
        ...,
        description="Regional sensor-share proportion |S_k| / 207 (DERIVED_HEURISTIC). Not FedAvg weight."
    )
    dataWeight: float = Field(
        ...,
        description="Backward-compatible alias for sensorShareFactor."
    )
    driftScore: float = Field(
        0.0,
        description="Spatial speed drift relative to reference baseline (CALIBRATED_PROXY, range [0, 1])."
    )
    informationDebt: int = Field(
        0,
        description="Consecutive skipped aggregation rounds (DERIVED_STATE). Not physical queue backlog."
    )
    utilityScore: float = Field(
        ...,
        description="Combined Client Communication Value (CCV) score (CALIBRATED_PROXY)."
    )
    classification: str = Field("CALIBRATED_PROXY", description="Scientific data provenance label")


class SelectionResult(BaseModel):
    """
    Output of the selective communication policy for an aggregation round.
    """
    budget: str
    targetClientCount: int
    selectedClients: List[str]
    skippedClients: List[str]
    clientRationale: Dict[str, str]
    downloadBytes: int
    uploadBytes: int
    roundTotalBytes: int
    payloadClassification: str = "MEASURED_SERIALIZED_APPLICATION_PAYLOAD"
    accuracyStatus: str = "NOT_EVALUATED"


class ExperimentResultSchema(BaseModel):
    """
    Schema for selective communication experiment runs.
    Ensures that unperformed experiments explicitly state NOT_EVALUATED.
    """
    policyName: str
    budget: str
    roundNumber: int
    selectedClients: List[str]
    skippedClients: List[str]
    downloadBytes: int
    uploadBytes: int
    totalBytes: int
    validationMAE: Optional[float] = None
    testMAE: Optional[float] = None
    regionalMAE: Optional[Dict[str, float]] = None
    savingsPercentage: Optional[float] = None
    scientificStatus: str = "IN_PROGRESS"
    evaluationState: str = "NOT_EVALUATED"


class InformationDebtTracker:
    """
    Tracks accumulated information debt (consecutive skipped rounds) for each client.
    Classification: DERIVED_STATE.
    Represents logical algorithmic freshness deficit, NOT physical queue congestion.
    """
    def __init__(self, client_ids: Optional[List[str]] = None):
        self.client_ids = client_ids or ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]
        self._debt: Dict[str, int] = {cid: 0 for cid in self.client_ids}

    def get_debt(self, client_id: str) -> int:
        return self._debt.get(client_id, 0)

    def get_all_debts(self) -> Dict[str, int]:
        return dict(self._debt)

    def update(self, selected_clients: List[str]):
        """
        Increments debt for skipped clients; resets debt to 0 for selected clients.
        """
        for cid in self.client_ids:
            if cid in selected_clients:
                self._debt[cid] = 0
            else:
                self._debt[cid] += 1

    def reset(self):
        for cid in self.client_ids:
            self._debt[cid] = 0


class CommunicationPolicySelector:
    """
    Interface for selective client communication in Federated Learning.
    Computes deterministic ranking based on client communication value and information debt.
    """

    # Static regional sensor counts from canonical METR-LA partition (sum = 207 sensors)
    # Sensor share factor: s_k = |S_k| / 207 (HEURISTIC / DERIVED static topological ratio)
    REGIONAL_SENSOR_SHARES = {
        "REGION_A": {"name": "North-East", "sensors": 48, "share": 48 / 207},
        "REGION_B": {"name": "South-East", "sensors": 57, "share": 57 / 207},
        "REGION_C": {"name": "Central-West", "sensors": 58, "share": 58 / 207},
        "REGION_D": {"name": "North-West", "sensors": 44, "share": 44 / 207}
    }

    # Backward-compatible alias
    CLIENT_WEIGHTS = REGIONAL_SENSOR_SHARES

    def __init__(self, alpha: float = 1.0, beta: float = 0.5, debt_weight: float = 0.15):
        self.alpha = alpha
        self.beta = beta
        self.debt_weight = debt_weight
        self.debt_tracker = InformationDebtTracker(list(self.REGIONAL_SENSOR_SHARES.keys()))

    def compute_client_values(
        self,
        drift_signals: Optional[Dict[str, float]] = None
    ) -> List[ClientValueState]:
        """
        Computes client communication utility scores:
            CCV_k = alpha * s_k + beta * d_k + debt_weight * tau_k
        where:
            s_k   : Regional sensor-share proportion |S_k| / 207 (DERIVED_HEURISTIC)
            d_k   : Regional traffic drift proxy (CALIBRATED_PROXY)
            tau_k : Federated information debt (DERIVED_STATE)
        """
        signals = drift_signals or {"REGION_A": 0.18, "REGION_B": 0.12, "REGION_C": 0.22, "REGION_D": 0.15}
        states = []

        for cid, meta in self.REGIONAL_SENSOR_SHARES.items():
            debt = self.debt_tracker.get_debt(cid)
            drift = signals.get(cid, 0.15)
            sensor_share = meta["share"]

            # CCV Formula: alpha * s_k + beta * d_k + lambda * tau_k
            utility = float(self.alpha * sensor_share + (self.beta * drift) + (debt * self.debt_weight))

            states.append(ClientValueState(
                clientId=cid,
                regionName=meta["name"],
                sensorCount=meta["sensors"],
                sensorShareFactor=round(sensor_share, 4),
                dataWeight=round(sensor_share, 4),  # backward-compatible field
                driftScore=round(drift, 4),
                informationDebt=debt,
                utilityScore=round(utility, 4),
                classification="CALIBRATED_PROXY"
            ))

        return states

    def select_participants(
        self,
        budget: str,
        drift_signals: Optional[Dict[str, float]] = None
    ) -> SelectionResult:
        """
        Selects clients according to specified budget constraint.
        Budget must be one of: '4/4', '3/4', '2/4', '1/4'.
        """
        b_enum = CommunicationBudget.parse(budget)
        target_k = b_enum.target_client_count

        client_values = self.compute_client_values(drift_signals)

        # Sort clients by utilityScore descending; break ties deterministically by clientId
        ranked = sorted(client_values, key=lambda c: (-c.utilityScore, c.clientId))

        selected = [c.clientId for c in ranked[:target_k]]
        skipped = [c.clientId for c in ranked[target_k:]]

        rationale = {}
        for c in ranked[:target_k]:
            rationale[c.clientId] = (
                f"Selected: Utility {c.utilityScore:.4f} (SensorShare {c.sensorShareFactor:.3f}, "
                f"DriftProxy {c.driftScore:.2f}, InfoDebt {c.informationDebt})"
            )
        for c in ranked[target_k:]:
            rationale[c.clientId] = (
                f"Deferred: Utility {c.utilityScore:.4f} below budget threshold ({target_k}/4)"
            )

        # Update debt tracker for next step
        self.debt_tracker.update(selected)

        # Calculate exact byte consumption using serialized application payload constant
        download_bytes = target_k * SERIALIZED_BYTES_PER_CLIENT_MODEL
        upload_bytes = target_k * SERIALIZED_BYTES_PER_CLIENT_MODEL
        total_bytes = download_bytes + upload_bytes

        return SelectionResult(
            budget=b_enum.value,
            targetClientCount=target_k,
            selectedClients=selected,
            skippedClients=skipped,
            clientRationale=rationale,
            downloadBytes=download_bytes,
            uploadBytes=upload_bytes,
            roundTotalBytes=total_bytes,
            payloadClassification="MEASURED_SERIALIZED_APPLICATION_PAYLOAD",
            accuracyStatus="NOT_EVALUATED"
        )
