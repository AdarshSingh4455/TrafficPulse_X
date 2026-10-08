"""
Federated Client Local Training & Model Update Contract Module.
Executes local training on client's regional sensor data slice, evaluates local MAE,
and manages download/upload payload contracts with application byte accounting.
"""

import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

from ml.spatiotemporal.model import SpatialGraphLSTM
from ml.federated.prepare_clients import get_regional_subgraph, get_client_data_slice, load_client_partitions
from ml.federated.aggregation import compute_update_l2_norm, validate_model_parameters


def set_seed(seed: int = 42):
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


class FederatedClient:
    """
    Simulated FL Client bound to a specific METR-LA regional partition.
    """

    def __init__(
        self,
        client_id: str,
        region_id: str,
        raw_dir: str = "data/raw/metr-la",
        processed_dir: str = "data/processed/metr-la",
        device: Optional[torch.device] = None,
        seed: int = 42
    ):
        self.client_id = client_id
        self.region_id = region_id
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.seed = seed

        # Load partition info
        partitions = load_client_partitions(processed_dir)
        if region_id not in partitions:
            raise KeyError(f"Invalid region_id '{region_id}'")
        self.partition_info = partitions[region_id]

        self.sensor_count = self.partition_info["sensorCount"]
        self.global_indices = self.partition_info["globalIndices"]
        self.sensor_ids = self.partition_info["sensorIds"]
        self.train_valid_targets = self.partition_info["trainValidTargets"]

        # Scaler
        with open(os.path.join(processed_dir, "scaler.json"), "r", encoding="utf-8") as f:
            sc = json.load(f)
            self.mean = float(sc.get("mean", 58.584258))
            self.std = float(sc.get("std", 12.822883))

        # Induced regional subgraph
        _, a_norm_sub, _, _ = get_regional_subgraph(region_id, raw_dir=raw_dir, processed_dir=processed_dir)
        self.a_norm_tensor = torch.tensor(a_norm_sub, dtype=torch.float32, device=self.device)

        # Regional Data Slices (loaded on demand / memory)
        self.train_x, self.train_y, self.train_x_mask, self.train_y_mask = get_client_data_slice(
            region_id, split="train", processed_dir=processed_dir
        )
        self.val_x, self.val_y, self.val_x_mask, self.val_y_mask = get_client_data_slice(
            region_id, split="val", processed_dir=processed_dir
        )

        # Fresh deterministic model instance
        set_seed(seed)
        self.model = SpatialGraphLSTM(
            in_features=2,
            spatial_dim=32,
            hidden_dim=64,
            output_horizons=4,
            seq_len=12,
            use_residual=True
        ).to(self.device)

        self.downloaded_state_dict: Optional[Dict[str, torch.Tensor]] = None
        self.serialized_payload_bytes = 106384  # 26,596 float32 params * 4 bytes

    def download_global_model(self, global_state_dict: Dict[str, torch.Tensor]):
        """
        Downloads global model weights into client model.
        """
        if not validate_model_parameters(global_state_dict):
            raise ValueError(f"Client {self.client_id} received non-finite global weights.")
        
        # Clone downloaded state dict for update L2 norm calculation
        self.downloaded_state_dict = {k: v.clone().cpu() for k, v in global_state_dict.items()}
        self.model.load_state_dict(global_state_dict)

    def train_local_epoch(
        self,
        batch_size: int = 64,
        lr: float = 0.001,
        local_seed: int = 42
    ) -> float:
        """
        Performs 1 local training epoch on client's regional train dataset split using Adam optimizer
        and Masked MAE loss in raw mph space.
        Returns average local train MAE.
        """
        set_seed(local_seed)
        self.model.train()
        optimizer = optim.Adam(self.model.parameters(), lr=lr)

        num_samples = self.train_x.shape[0]
        indices = np.arange(num_samples)
        np.random.shuffle(indices)

        total_loss = 0.0
        total_valid = 0

        for i in range(0, num_samples, batch_size):
            batch_idx = indices[i: i + batch_size]
            bx = self.train_x[batch_idx]       # [B, 12, N, 1] normalized speed
            bx_mask = self.train_x_mask[batch_idx]
            by = self.train_y[batch_idx]       # [B, 4, N, 1] raw speed
            by_mask = self.train_y_mask[batch_idx]

            # Input tensor [B, 12, N, 2]
            bx_input = np.concatenate([bx, bx_mask], axis=-1)
            bx_tensor = torch.tensor(bx_input, dtype=torch.float32, device=self.device)
            by_tensor = torch.tensor(by, dtype=torch.float32, device=self.device)
            by_mask_tensor = torch.tensor(by_mask, dtype=torch.float32, device=self.device)

            optimizer.zero_grad()
            out_norm = self.model(bx_tensor, self.a_norm_tensor)  # [B, 4, N, 1]
            out_raw = out_norm * self.std + self.mean

            # Masked MAE loss in raw mph space
            valid_mask = (by_mask_tensor > 0.0) & (by_tensor > 0.0)
            if valid_mask.sum() > 0:
                loss = torch.abs(out_raw[valid_mask] - by_tensor[valid_mask]).mean()
                loss.backward()
                optimizer.step()

                total_loss += (torch.abs(out_raw[valid_mask] - by_tensor[valid_mask]).sum()).item()
                total_valid += valid_mask.sum().item()

        avg_mae = (total_loss / max(1, total_valid)) if total_valid > 0 else 0.0
        return round(float(avg_mae), 4)

    def evaluate_local_val(self, batch_size: int = 64) -> float:
        """
        Evaluates current model state on client's regional validation dataset split.
        Returns average local validation MAE in raw mph space.
        """
        self.model.eval()
        num_samples = self.val_x.shape[0]

        total_loss = 0.0
        total_valid = 0

        with torch.no_grad():
            for i in range(0, num_samples, batch_size):
                bx = self.val_x[i: i + batch_size]
                bx_mask = self.val_x_mask[i: i + batch_size]
                by = self.val_y[i: i + batch_size]
                by_mask = self.val_y_mask[i: i + batch_size]

                bx_input = np.concatenate([bx, bx_mask], axis=-1)
                bx_tensor = torch.tensor(bx_input, dtype=torch.float32, device=self.device)
                by_tensor = torch.tensor(by, dtype=torch.float32, device=self.device)
                by_mask_tensor = torch.tensor(by_mask, dtype=torch.float32, device=self.device)

                out_norm = self.model(bx_tensor, self.a_norm_tensor)
                out_raw = out_norm * self.std + self.mean

                valid_mask = (by_mask_tensor > 0.0) & (by_tensor > 0.0)
                if valid_mask.sum() > 0:
                    total_loss += (torch.abs(out_raw[valid_mask] - by_tensor[valid_mask]).sum()).item()
                    total_valid += valid_mask.sum().item()

        avg_val_mae = (total_loss / max(1, total_valid)) if total_valid > 0 else 0.0
        return round(float(avg_val_mae), 4)

    def upload_model_update(
        self,
        current_round: int = 1,
        local_train_mae: float = 0.0
    ) -> Dict[str, Any]:
        """
        Constructs client update record for server aggregation.
        """
        curr_state = {k: v.clone().cpu() for k, v in self.model.state_dict().items()}
        l2_norm = 0.0
        if self.downloaded_state_dict:
            l2_norm = compute_update_l2_norm(self.downloaded_state_dict, curr_state)

        val_mae = self.evaluate_local_val()

        return {
            "clientId": self.client_id,
            "regionId": self.region_id,
            "round": current_round,
            "localTrainMAE": local_train_mae,
            "localValMAE": val_mae,
            "validTrainTargets": self.train_valid_targets,
            "updateL2Norm": round(l2_norm, 6),
            "downloadPayloadBytes": self.serialized_payload_bytes,
            "uploadPayloadBytes": self.serialized_payload_bytes,
            "classification": "SERIALIZED_APPLICATION_PAYLOAD_BYTES",
            "stateDict": curr_state
        }
