"""
Phase 9.1 — Communication Intelligence Service.
Exposes read-only status and interactive budget simulation queries for Phase 9 foundation.
"""

import os
import json
from typing import Dict, Any, List, Optional
from backend.communication_intelligence.policies import (
    CommunicationPolicySelector,
    CommunicationBudget,
    ClientValueState,
    SelectionResult,
    FULL_PARTICIPATION_BASELINE_TOTAL_BYTES,
    SERIALIZED_BYTES_PER_CLIENT_MODEL
)


class CommunicationIntelligenceService:
    """
    Service managing Phase 9 communication policies, client utility derivation,
    and budget simulation.
    """

    def __init__(self):
        self.selector = CommunicationPolicySelector()

    def get_phase9_status(self) -> Dict[str, Any]:
        """
        Returns Phase 9 status and baseline configuration.
        Dynamic: reflects EVALUATED_MEASURED once Phase 9.2 experiments are complete.
        """
        summary_path = "data/processed/metr-la/phase9/experiment_summary.json"
        is_completed = os.path.exists(summary_path)

        achieved_savings = "NOT_EVALUATED"
        accuracy_tradeoff = "NOT_EVALUATED"
        status_str = "IN PROGRESS"
        stage_str = "9.1"

        if is_completed:
            try:
                with open(summary_path, "r", encoding="utf-8") as f:
                    s_data = json.load(f)
                if s_data.get("status") == "EXPERIMENTS_COMPLETED":
                    achieved_savings = "EVALUATED_MEASURED"
                    accuracy_tradeoff = "EVALUATED_MEASURED"
                    status_str = "EXPERIMENTS_COMPLETED"
                    stage_str = "9.2"
            except Exception:
                pass

        return {
            "phase": "9",
            "stage": stage_str,
            "status": status_str,
            "objective": "Selective Federated Communication Under Budget Constraints",
            "budgetTiers": [b.value for b in CommunicationBudget],
            "clientCount": 4,
            "baseline": {
                "participationMode": "FULL_PARTICIPATION_FEDAVG",
                "roundCount": 13,
                "totalBytesSerialized": FULL_PARTICIPATION_BASELINE_TOTAL_BYTES,
                "bytesPerModel": SERIALIZED_BYTES_PER_CLIENT_MODEL,
                "testMAE": 3.5322
            },
            "experimentalStatus": {
                "achievedSavings": achieved_savings,
                "accuracyTradeoff": accuracy_tradeoff
            },
            "scientificNotice": (
                "Phase 9.2 controlled selective experiments measured under identical splits, "
                "architecture, and seed=42 without fabricating test metrics."
            )
        }

    def get_client_values(self) -> List[Dict[str, Any]]:
        """
        Returns current client communication utility values and information debts.
        """
        states = self.selector.compute_client_values()
        return [s.model_dump() for s in states]

    def evaluate_budget(self, budget_str: str = "3/4") -> Dict[str, Any]:
        """
        Simulates client selection for an aggregation round under the given budget tier.
        """
        result = self.selector.select_participants(budget_str)
        return result.model_dump()

    def get_experiments_summary(self) -> Dict[str, Any]:
        """
        Returns synthesized Phase 9.2 experiment summary and comparison table.
        """
        summary_path = "data/processed/metr-la/phase9/experiment_summary.json"
        if not os.path.exists(summary_path):
            return {
                "status": "NOT_EVALUATED",
                "message": "Phase 9.2 selective experiments have not completed execution.",
                "comparisonTable": []
            }
        with open(summary_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_policy_details(self, policy: str) -> Dict[str, Any]:
        """
        Returns detailed results for a specific policy (e.g. POLICY_CCV_3_OF_4).
        """
        pol_key = policy.lower()
        if not pol_key.startswith("policy_"):
            pol_key = f"policy_{pol_key}"
        path = f"data/processed/metr-la/phase9/{pol_key}.json"
        if not os.path.exists(path):
            raise FileNotFoundError(f"Experiment artifact for policy '{policy}' not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_tradeoff(self) -> Dict[str, Any]:
        """
        Returns Pareto trade-off analysis between application-payload reduction and test MAE.
        """
        summary = self.get_experiments_summary()
        if summary.get("status") == "NOT_EVALUATED":
            return {
                "status": "NOT_EVALUATED",
                "tradeoffAnalysis": "Experiments pending execution."
            }
        return {
            "status": "EVALUATED_MEASURED",
            "paretoAnalysis": summary.get("paretoAnalysis", {}),
            "comparisonTable": summary.get("comparisonTable", [])
        }

    def get_rounds_history(self, policy: str) -> List[Dict[str, Any]]:
        """
        Returns round-by-round selection history, CCV values, information debts, and validation MAEs.
        """
        pol_data = self.get_policy_details(policy)
        return pol_data.get("roundsHistory", [])


_comm_intel_service_instance: Optional[CommunicationIntelligenceService] = None


def get_comm_intel_service() -> CommunicationIntelligenceService:
    global _comm_intel_service_instance
    if _comm_intel_service_instance is None:
        _comm_intel_service_instance = CommunicationIntelligenceService()
    return _comm_intel_service_instance
