"""
TrafficPulse-X Phase 6 Stage 6.3: PyTorch Dataset for METR-LA Temporal Models.
Provides memory-safe PyTorch Dataset and DataLoader wrappers.
"""

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from typing import Tuple, Dict, Any


class METRLATemporalDataset(Dataset):
    """
    PyTorch Dataset for METR-LA sliding windows.
    Stores pre-built 2-channel input array (normalized_speed, input_mask) and targets.
    Input shape per window: (12, 207, 2)
    Target shape per window: (4, 207, 1) in raw MPH
    Mask shape per window: (4, 207, 1) boolean
    """
    def __init__(self, npz_path: str):
        data = np.load(npz_path)
        x = data["x"].astype(np.float32)           # (N, 12, 207, 1) normalized
        x_mask = data["x_mask"].astype(np.float32) # (N, 12, 207, 1) binary mask
        
        # Concatenate normalized speed and input mask into 2 input channels
        self.x_2ch = np.concatenate([x, x_mask], axis=-1) # (N, 12, 207, 2)
        self.y = data["y"].astype(np.float32)              # (N, 4, 207, 1) raw MPH
        self.y_mask = data["y_mask"].astype(bool)          # (N, 4, 207, 1) boolean mask

    def __len__(self) -> int:
        return self.x_2ch.shape[0]

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Returns:
            x_item: (12, 207, 2) float32
            y_item: (4, 207, 1) float32 raw MPH
            y_mask_item: (4, 207, 1) bool
        """
        return (
            torch.from_numpy(self.x_2ch[idx]),
            torch.from_numpy(self.y[idx]),
            torch.from_numpy(self.y_mask[idx])
        )


def create_dataloader(npz_path: str, batch_size: int = 64, shuffle: bool = False, num_workers: int = 0) -> DataLoader:
    """Helper function creating PyTorch DataLoader for METR-LA split."""
    ds = METRLATemporalDataset(npz_path)
    return DataLoader(ds, batch_size=batch_size, shuffle=shuffle, num_workers=num_workers)
