"""
Federated Client Partition & Regional Subgraph Preparation Module.
Extracts regional sensor subsets, induced subgraphs, normalized adjacency matrices,
and data slices for the 4 regional FL clients without modifying frozen Phase 5/6 data.
"""

import os
import json
import pickle
import numpy as np
import torch
from typing import Dict, Any, List, Tuple

from ml.graph.model import calculate_normalized_adjacency


def load_client_partitions(processed_dir: str = "data/processed/metr-la") -> Dict[str, Any]:
    """
    Loads canonical client partitions metadata from JSON artifact.
    """
    path = os.path.join(processed_dir, "federated/client_partitions.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Client partitions artifact missing: '{path}'")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_regional_subgraph(
    region_id: str,
    raw_dir: str = "data/raw/metr-la",
    processed_dir: str = "data/processed/metr-la"
) -> Tuple[np.ndarray, np.ndarray, List[int], List[str]]:
    """
    Extracts induced regional subgraph A_region = A[S, S] and computes normalized adjacency.
    Returns (adj_sub, a_norm_sub, global_indices, sensor_ids).
    """
    partitions = load_client_partitions(processed_dir)
    if region_id not in partitions:
        raise KeyError(f"Invalid regionId '{region_id}'. Valid regions: {list(partitions.keys())}")

    p_info = partitions[region_id]
    g_indices = p_info["globalIndices"]
    s_ids = p_info["sensorIds"]

    adj_path = os.path.join(raw_dir, "adj_mx.pkl")
    with open(adj_path, "rb") as f:
        _, _, adj_mx = pickle.load(f, encoding="latin1")

    # Induced subgraph
    adj_sub = adj_mx[np.ix_(g_indices, g_indices)]
    a_norm_sub = calculate_normalized_adjacency(adj_sub, is_identity=False)

    return adj_sub, a_norm_sub, g_indices, s_ids


def get_client_data_slice(
    region_id: str,
    split: str = "train",
    processed_dir: str = "data/processed/metr-la"
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Loads regional data slice for specified split ('train', 'val', 'test') without altering chronological windows.
    Returns (x_sub, y_sub, x_mask_sub, y_mask_sub).
    """
    partitions = load_client_partitions(processed_dir)
    if region_id not in partitions:
        raise KeyError(f"Invalid regionId '{region_id}'. Valid regions: {list(partitions.keys())}")

    g_indices = partitions[region_id]["globalIndices"]

    npz_path = os.path.join(processed_dir, f"ml_ready/{split}.npz")
    if not os.path.exists(npz_path):
        raise FileNotFoundError(f"Dataset split file missing: '{npz_path}'")

    data = np.load(npz_path)
    x_sub = data["x"][:, :, g_indices, :]        # [B, 12, N_region, 1]
    y_sub = data["y"][:, :, g_indices, :]        # [B, 4, N_region, 1]
    x_mask_sub = data["x_mask"][:, :, g_indices, :]
    y_mask_sub = data["y_mask"][:, :, g_indices, :]

    return x_sub, y_sub, x_mask_sub, y_mask_sub
