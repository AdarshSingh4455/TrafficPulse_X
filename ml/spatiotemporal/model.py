"""
TrafficPulse-X Phase 6 Stage 6.5: Spatio-Temporal Graph + LSTM Model Definition.
Combines 2-layer Graph Convolution (with self-residual connection) across all 12 input timesteps
with a 1-layer LSTM temporal sequence processor for METR-LA 207-node traffic forecasting.
"""

import math
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from ml.graph.model import GraphConv, calculate_normalized_adjacency, count_parameters


class SpatialGraphLSTM(nn.Module):
    """
    Spatio-Temporal Graph + LSTM Model (SpatialGraphLSTM).
    
    Architecture:
    1. Spatial GCN Encoder (applied across ALL 12 timesteps):
       - GraphConv(2 -> 32), ReLU
       - GraphConv(32 -> 32), ReLU
       - Residual self-projection: Linear(2 -> 32)
    2. Temporal LSTM Processor:
       - LSTM(input_size=32, hidden_size=64, num_layers=1, batch_first=True)
    3. Output Head:
       - Linear(64 -> 4) -> Reshaped to canonical [B, 4, 207, 1]
    """
    def __init__(
        self,
        in_features: int = 2,
        spatial_dim: int = 32,
        hidden_dim: int = 64,
        output_horizons: int = 4,
        seq_len: int = 12,
        use_residual: bool = True
    ):
        super().__init__()
        self.in_features = in_features
        self.spatial_dim = spatial_dim
        self.hidden_dim = hidden_dim
        self.output_horizons = output_horizons
        self.seq_len = seq_len
        self.use_residual = use_residual

        # Spatial GCN Encoder
        self.gc1 = GraphConv(in_features, spatial_dim)
        self.gc2 = GraphConv(spatial_dim, spatial_dim)
        if use_residual:
            self.proj_self = nn.Linear(in_features, spatial_dim)

        # Temporal LSTM Processor
        self.lstm = nn.LSTM(
            input_size=spatial_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True
        )

        # Output Prediction Head
        self.fc_out = nn.Linear(hidden_dim, output_horizons)

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> torch.Tensor:
        # x shape: [B, 12, 207, 2]
        # adj_norm shape: [207, 207]
        batch_size, seq_len, num_nodes, in_dim = x.shape

        # Step 1: Apply GraphConv across all 12 timesteps
        spatial_features = []
        for t in range(seq_len):
            x_t = x[:, t, :, :]  # [B, 207, 2]
            h1 = F.relu(self.gc1(x_t, adj_norm))  # [B, 207, 32]
            h2 = F.relu(self.gc2(h1, adj_norm))   # [B, 207, 32]

            if self.use_residual:
                h_t = h2 + self.proj_self(x_t)
            else:
                h_t = h2

            spatial_features.append(h_t)

        # Stack over 12 timesteps: [B, 12, 207, 32]
        h_spatial = torch.stack(spatial_features, dim=1)

        # Step 2: Reshape for LSTM: [B * 207, 12, 32]
        # Permute to [B, 207, 12, 32] then flatten batch & node dimensions
        h_seq = h_spatial.permute(0, 2, 1, 3).contiguous().view(batch_size * num_nodes, seq_len, self.spatial_dim)

        # Step 3: Pass into LSTM
        lstm_out, (h_n, c_n) = self.lstm(h_seq)  # h_n shape: [1, B * 207, 64]
        h_final = h_n[-1]  # [B * 207, 64]

        # Step 4: Output projection: [B * 207, 4]
        out_pred = self.fc_out(h_final)

        # Step 5: Reshape to canonical format [B, 4, 207, 1]
        out_pred = out_pred.view(batch_size, num_nodes, self.output_horizons)  # [B, 207, 4]
        out_canonical = out_pred.permute(0, 2, 1).unsqueeze(-1)  # [B, 4, 207, 1]

        return out_canonical
