"""
TrafficPulse-X Phase 6 Stage 6.4: Plain PyTorch Spatial GCN Model Definition.
Implements spatial-only graph convolution over METR-LA 207-node topology without temporal recurrence.
"""

import math
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


def calculate_normalized_adjacency(adj_matrix: np.ndarray, is_identity: bool = False) -> np.ndarray:
    """
    Computes normalized symmetric adjacency matrix:
    A_hat = A + I
    D_hat[i, i] = sum_j A_hat[i, j]
    A_norm = D_hat^(-1/2) * A_hat * D_hat^(-1/2)
    
    If is_identity is True, returns identity matrix I_N for graph ablation.
    """
    num_nodes = adj_matrix.shape[0]
    if is_identity:
        return np.eye(num_nodes, dtype=np.float32)

    a_hat = adj_matrix.astype(np.float32) + np.eye(num_nodes, dtype=np.float32)
    d_hat = np.sum(a_hat, axis=1)
    d_hat_inv_sqrt = np.zeros_like(d_hat, dtype=np.float32)
    mask = d_hat > 0
    d_hat_inv_sqrt[mask] = np.power(d_hat[mask], -0.5)
    d_mat = np.diag(d_hat_inv_sqrt)
    a_norm = d_mat @ a_hat @ d_mat
    return a_norm.astype(np.float32)


class GraphConv(nn.Module):
    """
    Plain PyTorch Graph Convolution Layer: H_next = A_norm @ H @ W + b
    """
    def __init__(self, in_features: int, out_features: int):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.weight = nn.Parameter(torch.FloatTensor(in_features, out_features))
        self.bias = nn.Parameter(torch.FloatTensor(out_features))
        self.reset_parameters()

    def reset_parameters(self):
        nn.init.kaiming_uniform_(self.weight, a=math.sqrt(5))
        fan_in, _ = nn.init._calculate_fan_in_and_fan_out(self.weight)
        bound = 1.0 / math.sqrt(fan_in) if fan_in > 0 else 0
        nn.init.uniform_(self.bias, -bound, bound)

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> torch.Tensor:
        # x shape: [B, N, in_features]
        # adj_norm shape: [N, N]
        support = torch.matmul(x, self.weight)  # [B, N, out_features]
        out = torch.matmul(adj_norm, support) + self.bias  # [B, N, out_features]
        return out


class SpatialGCN(nn.Module):
    """
    Spatial-only Graph Convolutional Network (GCN) Baseline.
    Input: [B, 207, 2] (most recent normalized speed step + validity mask)
    Layers:
      - GraphConv: 2 -> 64, ReLU
      - GraphConv: 64 -> 64, ReLU
      - Dropout: 0.1
      - Linear: 64 -> 4
    Output: [B, 4, 207, 1]
    """
    def __init__(self, in_features: int = 2, hidden_dim: int = 64, output_horizons: int = 4, dropout: float = 0.1):
        super().__init__()
        self.in_features = in_features
        self.hidden_dim = hidden_dim
        self.output_horizons = output_horizons

        self.gc1 = GraphConv(in_features, hidden_dim)
        self.gc2 = GraphConv(hidden_dim, hidden_dim)
        self.dropout = nn.Dropout(dropout)
        self.fc_out = nn.Linear(hidden_dim, output_horizons)

    def forward(self, x: torch.Tensor, adj_norm: torch.Tensor) -> torch.Tensor:
        # x shape can be:
        # [B, 12, 207, 2] or [B, 207, 2]
        if x.dim() == 4:
            # Extract most recent historical step (-1)
            x_node = x[:, -1, :, :]  # [B, 207, 2]
        else:
            x_node = x  # [B, 207, 2]

        h1 = F.relu(self.gc1(x_node, adj_norm))  # [B, 207, 64]
        h2 = F.relu(self.gc2(h1, adj_norm))       # [B, 207, 64]
        h2 = self.dropout(h2)
        out = self.fc_out(h2)                    # [B, 207, 4]

        # Reshape to canonical target shape [B, 4, 207, 1]
        out = out.permute(0, 2, 1).unsqueeze(-1)  # [B, 4, 207, 1]
        return out


def count_parameters(model: nn.Module) -> int:
    """Returns total trainable parameter count."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
