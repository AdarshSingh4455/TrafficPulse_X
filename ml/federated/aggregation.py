"""
Deterministic FedAvg Aggregation & Parameter Validation Module.
Implements weighted floating-point state_dict aggregation, finite parameter checks,
L2 norm computation, and update mismatch rejection safeguards.
"""

import math
import torch
from typing import Dict, Any, List, Optional


def validate_model_parameters(state_dict: Dict[str, torch.Tensor]) -> bool:
    """
    Verifies that all tensors in state_dict contain finite numbers (no NaN or Inf).
    """
    if not state_dict or not isinstance(state_dict, dict):
        return False

    for key, tensor in state_dict.items():
        if not isinstance(tensor, torch.Tensor):
            return False
        if not torch.isfinite(tensor).all():
            return False
    return True


def compute_update_l2_norm(
    initial_state: Dict[str, torch.Tensor],
    updated_state: Dict[str, torch.Tensor]
) -> float:
    """
    Computes L2 norm of model parameter difference: ||w_updated - w_initial||_2.
    """
    total_sq = 0.0
    for key in initial_state:
        if key in updated_state:
            diff = (updated_state[key].float() - initial_state[key].float())
            total_sq += torch.sum(diff * diff).item()
    return float(math.sqrt(total_sq))


def fedavg_aggregate(
    client_states: List[Dict[str, torch.Tensor]],
    weights: List[float]
) -> Dict[str, torch.Tensor]:
    """
    Performs deterministic FedAvg weighted aggregation over client state_dicts:
    w_global = sum_i(weight_i * w_i) / sum_i(weight_i)

    Enforces:
    - Same parameter keys across clients
    - Same tensor shapes
    - Rejects NaN/Inf client updates
    - Rejects invalid or negative weights
    """
    if not client_states or not weights:
        raise ValueError("FedAvg aggregation requires non-empty client_states and weights.")

    if len(client_states) != len(weights):
        raise ValueError(f"Mismatch between client count ({len(client_states)}) and weights count ({len(weights)}).")

    sum_weights = sum(weights)
    if sum_weights <= 0.0 or not math.isfinite(sum_weights):
        raise ValueError(f"Invalid sum of aggregation weights: {sum_weights}")

    # Normalize weights so they sum to 1.0
    norm_weights = [w / sum_weights for w in weights]

    # Validate finite parameters for all clients
    for idx, (state, w) in enumerate(zip(client_states, weights)):
        if w < 0.0:
            raise ValueError(f"Client {idx} has negative aggregation weight: {w}")
        if not validate_model_parameters(state):
            raise ValueError(f"Client {idx} state_dict contains non-finite values (NaN/Inf). Update rejected.")

    # Reference schema from first client
    ref_keys = list(client_states[0].keys())
    ref_shapes = {k: client_states[0][k].shape for k in ref_keys}

    # Verify key and shape consistency across all clients
    for idx, state in enumerate(client_states[1:], start=1):
        if set(state.keys()) != set(ref_keys):
            raise KeyError(f"Client {idx} parameter keys mismatch reference keys.")
        for k in ref_keys:
            if state[k].shape != ref_shapes[k]:
                raise ValueError(f"Client {idx} shape mismatch for key '{k}': expected {ref_shapes[k]}, got {state[k].shape}")

    # Compute weighted average
    aggregated_state: Dict[str, torch.Tensor] = {}

    for k in ref_keys:
        acc = torch.zeros_like(client_states[0][k], dtype=torch.float32)
        for state, w in zip(client_states, norm_weights):
            acc += state[k].float() * w
        
        # Cast back to original dtype
        aggregated_state[k] = acc.to(dtype=client_states[0][k].dtype)

    if not validate_model_parameters(aggregated_state):
        raise RuntimeError("Aggregated global state_dict produced non-finite values.")

    return aggregated_state
