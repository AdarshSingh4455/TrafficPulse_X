"""
Federated Learning Server Simulation Coordinator Module.
Manages global model state, versioned round checkpoints, FedAvg aggregation over
regional client updates, parameter validation safeguards, and rollback capability.
"""

import os
import json
import pickle
import numpy as np
import torch
from typing import Dict, Any, List, Optional, Tuple

from ml.spatiotemporal.model import SpatialGraphLSTM
from ml.graph.model import calculate_normalized_adjacency
from ml.federated.aggregation import fedavg_aggregate, validate_model_parameters
from ml.federated.prepare_clients import load_client_partitions


def set_seed(seed: int = 42):
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


class FederatedServer:
    """
    Simulated FL Server coordinating global rounds and state aggregation.
    """

    def __init__(
        self,
        raw_dir: str = "data/raw/metr-la",
        processed_dir: str = "data/processed/metr-la",
        device: Optional[torch.device] = None,
        seed: int = 42
    ):
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.seed = seed

        self.checkpoint_dir = os.path.join(processed_dir, "federated/checkpoints")
        os.makedirs(self.checkpoint_dir, exist_ok=True)

        # Scaler
        with open(os.path.join(processed_dir, "scaler.json"), "r", encoding="utf-8") as f:
            sc = json.load(f)
            self.mean = float(sc.get("mean", 58.584258))
            self.std = float(sc.get("std", 12.822883))

        # Adjacency graph
        adj_path = os.path.join(raw_dir, "adj_mx.pkl")
        with open(adj_path, "rb") as f:
            _, _, adj_mx = pickle.load(f, encoding="latin1")
            a_norm_np = calculate_normalized_adjacency(adj_mx, is_identity=False)
            self.a_norm_tensor = torch.tensor(a_norm_np, dtype=torch.float32, device=self.device)

        # Fresh deterministic SpatialGraphLSTM initialization (seed=42)
        set_seed(seed)
        self.global_model = SpatialGraphLSTM(
            in_features=2,
            spatial_dim=32,
            hidden_dim=64,
            output_horizons=4,
            seq_len=12,
            use_residual=True
        ).to(self.device)

        self.global_round = 0
        self.previous_valid_state: Optional[Dict[str, torch.Tensor]] = None
        self.round_history: List[Dict[str, Any]] = []

        # Save round 0 initial checkpoint
        self.save_checkpoint(round_num=0)

    def get_global_state_dict(self) -> Dict[str, torch.Tensor]:
        """Returns clone of current global model state dict."""
        return {k: v.clone().cpu() for k, v in self.global_model.state_dict().items()}

    def save_checkpoint(self, round_num: int) -> str:
        """
        Saves versioned global model checkpoint to disk.
        """
        ckpt_name = f"global_round_{round_num:03d}.pt"
        ckpt_path = os.path.join(self.checkpoint_dir, ckpt_name)
        torch.save(self.global_model.state_dict(), ckpt_path)
        return ckpt_path

    def rollback_to_checkpoint(self, checkpoint_path: str) -> bool:
        """
        Restores global model weights from specified checkpoint file.
        """
        if not os.path.exists(checkpoint_path):
            return False
        state = torch.load(checkpoint_path, map_location=self.device, weights_only=True)
        if validate_model_parameters(state):
            self.global_model.load_state_dict(state)
            return True
        return False

    def process_round_aggregation(
        self,
        client_updates: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes FedAvg aggregation over client updates for current round.
        Performs pre-aggregation validation, weighted averaging, forward pass sandbox check,
        and saves versioned checkpoint.
        """
        if not client_updates:
            raise ValueError("No client updates provided for aggregation.")

        self.global_round += 1

        client_states = [u["stateDict"] for u in client_updates]
        weights = [float(u["validTrainTargets"]) for u in client_updates]
        client_ids = [u["clientId"] for u in client_updates]

        # Backup current valid state prior to aggregation
        self.previous_valid_state = self.get_global_state_dict()

        try:
            # 1. Deterministic FedAvg Weighted Aggregation
            aggregated_state = fedavg_aggregate(client_states, weights)

            # 2. Sandbox Verification: Test loading and dummy forward pass
            temp_model = SpatialGraphLSTM(
                in_features=2, spatial_dim=32, hidden_dim=64, output_horizons=4, seq_len=12, use_residual=True
            ).to(self.device)
            temp_model.load_state_dict(aggregated_state)

            dummy_x = torch.zeros((1, 12, 207, 2), dtype=torch.float32, device=self.device)
            dummy_out = temp_model(dummy_x, self.a_norm_tensor)

            if dummy_out.shape != (1, 4, 207, 1) or not torch.isfinite(dummy_out).all():
                raise RuntimeError("Sandbox forward pass verification failed for aggregated state.")

            # 3. Apply aggregated state to global model
            self.global_model.load_state_dict(aggregated_state)

            # 4. Save versioned checkpoint
            ckpt_path = self.save_checkpoint(self.global_round)

            round_summary = {
                "globalRound": self.global_round,
                "status": "AGGREGATION_SUCCESS",
                "participatingClients": client_ids,
                "aggregationWeights": {u["clientId"]: round(w / sum(weights), 6) for u, w in zip(client_updates, weights)},
                "checkpointPath": ckpt_path,
                "downloadModelBytes": 106384,
                "uploadUpdateBytes": 106384 * len(client_updates)
            }
            self.round_history.append(round_summary)
            return round_summary

        except Exception as e:
            # Rollback to previous valid state if aggregation or sandbox check fails
            if self.previous_valid_state:
                self.global_model.load_state_dict(self.previous_valid_state)

            return {
                "globalRound": self.global_round,
                "status": "AGGREGATION_FAILED_ROLLED_BACK",
                "error": str(e),
                "rollbackExecuted": True
            }

    def evaluate_global_val(self, batch_size: int = 64) -> float:
        """
        Evaluates current global model state on full validation dataset (val.npz).
        Returns overall validation MAE in raw mph space.
        """
        val_path = os.path.join(self.processed_dir, "ml_ready/val.npz")
        val_data = np.load(val_path)
        val_x, val_y, val_x_mask, val_y_mask = val_data["x"], val_data["y"], val_data["x_mask"], val_data["y_mask"]

        self.global_model.eval()
        num_samples = val_x.shape[0]

        total_loss = 0.0
        total_valid = 0

        with torch.no_grad():
            for i in range(0, num_samples, batch_size):
                bx = val_x[i: i + batch_size]
                bx_mask = val_x_mask[i: i + batch_size]
                by = val_y[i: i + batch_size]
                by_mask = val_y_mask[i: i + batch_size]

                bx_input = np.concatenate([bx, bx_mask], axis=-1)
                bx_tensor = torch.tensor(bx_input, dtype=torch.float32, device=self.device)
                by_tensor = torch.tensor(by, dtype=torch.float32, device=self.device)
                by_mask_tensor = torch.tensor(by_mask, dtype=torch.float32, device=self.device)

                out_norm = self.global_model(bx_tensor, self.a_norm_tensor)
                out_raw = out_norm * self.std + self.mean

                valid_mask = (by_mask_tensor > 0.0) & (by_tensor > 0.0)
                if valid_mask.sum() > 0:
                    total_loss += (torch.abs(out_raw[valid_mask] - by_tensor[valid_mask]).sum()).item()
                    total_valid += valid_mask.sum().item()

        avg_val_mae = (total_loss / max(1, total_valid)) if total_valid > 0 else 0.0
        return round(float(avg_val_mae), 4)
