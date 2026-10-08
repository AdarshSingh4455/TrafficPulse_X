"""
TrafficPulse-X Federated Learning Simulation Package (Phase 8).
Provides regional data partitioning, local client training contracts,
deterministic FedAvg aggregation, and server round versioning.
"""

from ml.federated.prepare_clients import (
    load_client_partitions,
    get_regional_subgraph,
    get_client_data_slice
)
from ml.federated.aggregation import (
    fedavg_aggregate,
    validate_model_parameters,
    compute_update_l2_norm
)
from ml.federated.client import FederatedClient
from ml.federated.server import FederatedServer

__all__ = [
    "load_client_partitions",
    "get_regional_subgraph",
    "get_client_data_slice",
    "fedavg_aggregate",
    "validate_model_parameters",
    "compute_update_l2_norm",
    "FederatedClient",
    "FederatedServer"
]
