"""
TrafficPulse-X Phase 6 Stage 6.3: GRU & LSTM PyTorch Models.
Provides TemporalGRU, TemporalLSTM, MaskedMAELoss, and model utility functions.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple, Any


class TemporalGRU(nn.Module):
    """
    Lightweight Global Shared GRU Model for Traffic Speed Forecasting.
    Input shape: (B, 12, 207, 2) where 2 channels are (normalized_speed, validity_mask).
    Reshapes to (B * 207, 12, 2) for global shared sequence processing.
    Output shape: (B, 4, 207, 1) predicting raw or normalized speed for all 4 horizons.
    """
    def __init__(self, input_size: int = 2, hidden_size: int = 64, num_layers: int = 1, output_horizons: int = 4):
        super(TemporalGRU, self).__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_horizons = output_horizons

        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True
        )
        self.fc = nn.Linear(hidden_size, output_horizons)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: (B, 12, 207, 2)
        Returns: (B, 4, 207, 1)
        """
        B, T, S, C = x.shape
        # Reshape to (B * S, T, C)
        x_flat = x.transpose(1, 2).reshape(B * S, T, C)
        out, h_n = self.gru(x_flat)  # h_n shape: (1, B * S, hidden_size)
        h_last = h_n[-1]  # shape: (B * S, hidden_size)
        pred_flat = self.fc(h_last)  # shape: (B * S, 4)
        # Reshape back to (B, 4, S, 1)
        pred = pred_flat.view(B, S, self.output_horizons, 1).transpose(1, 2)
        return pred


class TemporalLSTM(nn.Module):
    """
    Lightweight Global Shared LSTM Model for Traffic Speed Forecasting.
    Input shape: (B, 12, 207, 2) where 2 channels are (normalized_speed, validity_mask).
    Reshapes to (B * 207, 12, 2) for global shared sequence processing.
    Output shape: (B, 4, 207, 1) predicting raw or normalized speed for all 4 horizons.
    """
    def __init__(self, input_size: int = 2, hidden_size: int = 64, num_layers: int = 1, output_horizons: int = 4):
        super(TemporalLSTM, self).__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_horizons = output_horizons

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True
        )
        self.fc = nn.Linear(hidden_size, output_horizons)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: (B, 12, 207, 2)
        Returns: (B, 4, 207, 1)
        """
        B, T, S, C = x.shape
        # Reshape to (B * S, T, C)
        x_flat = x.transpose(1, 2).reshape(B * S, T, C)
        out, (h_n, c_n) = self.lstm(x_flat)  # h_n shape: (1, B * S, hidden_size)
        h_last = h_n[-1]  # shape: (B * S, hidden_size)
        pred_flat = self.fc(h_last)  # shape: (B * S, 4)
        # Reshape back to (B, 4, S, 1)
        pred = pred_flat.view(B, S, self.output_horizons, 1).transpose(1, 2)
        return pred


class MaskedMAELoss(nn.Module):
    """
    Centralized Masked MAE Loss function.
    Excludes invalid/null targets (where y_mask == False) from loss computation.
    Handles empty-valid batches safely by returning 0.0.
    """
    def __init__(self):
        super(MaskedMAELoss, self).__init__()

    def forward(self, pred: torch.Tensor, target: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        """
        pred: (B, 4, 207, 1) predicted raw MPH
        target: (B, 4, 207, 1) target raw MPH
        mask: (B, 4, 207, 1) boolean valid mask
        """
        valid_mask = mask & (target > 0.0)
        valid_count = valid_mask.sum().float()

        if valid_count == 0:
            return torch.tensor(0.0, device=pred.device, dtype=pred.dtype)

        diff = torch.abs(pred - target) * valid_mask.float()
        loss = diff.sum() / valid_count
        return loss


def count_parameters(model: nn.Module) -> int:
    """Returns the total number of trainable parameters in a PyTorch model."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
