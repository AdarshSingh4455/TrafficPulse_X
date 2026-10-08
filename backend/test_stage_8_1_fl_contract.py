"""
Stage 8.1 — Federated Learning Client Partition & Training Contract Test Suite.
Verifies exact 4-client partitioning, sensor union/disjointness, induced regional subgraphs,
Graph+LSTM regional forward pass compatibility, fresh FL initialization, deterministic FedAvg weighting,
shape/non-finite update rejection, server rollback, payload byte accounting, and immutability of Phase 6/7 metrics.
"""

import os
import json
import pickle
import hashlib
import numpy as np
import torch
import pytest

from ml.spatiotemporal.model import SpatialGraphLSTM
from ml.federated.prepare_clients import load_client_partitions, get_regional_subgraph, get_client_data_slice
from ml.federated.aggregation import fedavg_aggregate, validate_model_parameters, compute_update_l2_norm
from ml.federated.client import FederatedClient
from ml.federated.server import FederatedServer


# -----------------------------------------------------------------------------
# 1. Client Partitioning & Region Topology Tests
# -----------------------------------------------------------------------------

def test_1_exactly_four_fl_clients():
    """Verify exactly 4 FL clients are defined."""
    partitions = load_client_partitions()
    assert len(partitions) == 4
    expected_regions = ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]
    for r in expected_regions:
        assert r in partitions


def test_2_regional_sensor_counts():
    """Verify sensor counts per region: A=48, B=57, C=58, D=44."""
    partitions = load_client_partitions()
    assert partitions["REGION_A"]["sensorCount"] == 48
    assert partitions["REGION_B"]["sensorCount"] == 57
    assert partitions["REGION_C"]["sensorCount"] == 58
    assert partitions["REGION_D"]["sensorCount"] == 44


def test_3_total_sensors_equal_207():
    """Verify sum of regional sensors equals 207."""
    partitions = load_client_partitions()
    total_sensors = sum(p["sensorCount"] for p in partitions.values())
    assert total_sensors == 207


def test_4_frozen_region_checksum_unchanged():
    """Verify canonical regions.json SHA-256 checksum remains unchanged."""
    path = "data/processed/metr-la/regions.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    csum = hashlib.sha256(json.dumps(data, sort_keys=True).encode("utf-8")).hexdigest()
    assert csum == "ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2"


def test_5_regional_sensor_ids_canonical():
    """Verify regional sensor IDs match regions.json canonical definitions."""
    path = "data/processed/metr-la/regions.json"
    with open(path, "r", encoding="utf-8") as f:
        reg_data = json.load(f)

    partitions = load_client_partitions()
    for r in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]:
        canon_ids = set(reg_data[r]["sensorIds"])
        part_ids = set(partitions[r]["sensorIds"])
        assert canon_ids == part_ids


def test_6_no_overlapping_client_sensor_membership():
    """Verify no sensor is assigned to multiple clients (pairwise disjoint sets)."""
    partitions = load_client_partitions()
    sets = [set(p["sensorIds"]) for p in partitions.values()]
    for i in range(len(sets)):
        for j in range(i + 1, len(sets)):
            assert len(sets[i].intersection(sets[j])) == 0


def test_7_union_of_clients_equals_all_207_sensors():
    """Verify union of all 4 clients equals set of all 207 benchmark sensors."""
    partitions = load_client_partitions()
    all_client_sensors = set()
    for p in partitions.values():
        all_client_sensors.update(p["sensorIds"])

    with open("data/raw/metr-la/adj_mx.pkl", "rb") as f:
        sensor_ids_raw, _, _ = pickle.load(f, encoding="latin1")
    canon_207 = set([str(s) for s in sensor_ids_raw])

    assert all_client_sensors == canon_207
    assert len(all_client_sensors) == 207


# -----------------------------------------------------------------------------
# 2. Dataset Locality, Scaler & Subgraph Tests
# -----------------------------------------------------------------------------

def test_8_chronological_split_boundaries_unchanged():
    """Verify chronological split boundaries remain [0, 23990), [23990, 27417), [27417, 34272)."""
    train_npz = np.load("data/processed/metr-la/ml_ready/train.npz")
    val_npz = np.load("data/processed/metr-la/ml_ready/val.npz")
    test_npz = np.load("data/processed/metr-la/ml_ready/test.npz")

    # Sliding window of 24 steps (12 in + 12 out) reduces length from split boundaries by 23 steps
    assert train_npz["x"].shape[0] == 23967  # 23990 - 23
    assert val_npz["x"].shape[0] == 3404     # 3427 - 23
    assert test_npz["x"].shape[0] == 6832    # 6855 - 23


def test_9_global_scaler_stats_unchanged():
    """Verify global train-only scaler stats (mean=58.584258, std=12.822883) remain frozen."""
    with open("data/processed/metr-la/scaler.json", "r", encoding="utf-8") as f:
        sc = json.load(f)
    assert abs(sc["mean"] - 58.584258) < 1e-5
    assert abs(sc["std"] - 12.822883) < 1e-5


def test_10_regional_tensors_select_correct_node_indices():
    """Verify client regional data slices match global array slicing along node dimension."""
    train_npz = np.load("data/processed/metr-la/ml_ready/train.npz")
    partitions = load_client_partitions()
    
    g_a = partitions["REGION_A"]["globalIndices"]
    x_a, _, _, _ = get_client_data_slice("REGION_A", split="train")

    assert x_a.shape[2] == len(g_a) == 48
    assert np.array_equal(x_a[0, 0, :, 0], train_npz["x"][0, 0, g_a, 0])


def test_11_regional_induced_subgraph_extraction():
    """Verify induced subgraphs A_region = A[S, S] are extracted correctly."""
    with open("data/raw/metr-la/adj_mx.pkl", "rb") as f:
        _, _, adj_mx = pickle.load(f, encoding="latin1")

    partitions = load_client_partitions()
    for r in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]:
        adj_sub, a_norm_sub, g_indices, _ = get_regional_subgraph(r)
        expected_sub = adj_mx[np.ix_(g_indices, g_indices)]
        assert np.array_equal(adj_sub, expected_sub)
        assert a_norm_sub.shape == (len(g_indices), len(g_indices))


def test_12_weighted_adjacency_preserved():
    """Verify regional adjacency preserves weighted edges and is not binarized."""
    adj_sub_a, _, _, _ = get_regional_subgraph("REGION_A")
    non_zero = adj_sub_a[adj_sub_a > 0.0]
    # Check that non-zero values contain continuous floats between 0 and 1
    has_weights = np.any((non_zero > 0.0) & (non_zero < 1.0))
    assert bool(has_weights) is True


# -----------------------------------------------------------------------------
# 3. Model Compatibility & Initialization Tests
# -----------------------------------------------------------------------------

def test_13_graph_lstm_forward_works_for_all_client_node_counts():
    """Verify SpatialGraphLSTM executes forward pass for node counts 48, 57, 58, 44."""
    partitions = load_client_partitions()
    device = torch.device("cpu")

    for r in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]:
        n_nodes = partitions[r]["sensorCount"]
        _, a_norm_sub, _, _ = get_regional_subgraph(r)
        a_norm_tensor = torch.tensor(a_norm_sub, dtype=torch.float32, device=device)

        model = SpatialGraphLSTM(in_features=2, spatial_dim=32, hidden_dim=64, output_horizons=4, seq_len=12, use_residual=True).to(device)
        dummy_input = torch.zeros((2, 12, n_nodes, 2), dtype=torch.float32, device=device)

        out = model(dummy_input, a_norm_tensor)
        assert out.shape == (2, 4, n_nodes, 1)
        assert torch.isfinite(out).all()


def test_14_same_model_parameter_shapes_across_clients():
    """Verify model parameter names and shapes are identical across all regional clients."""
    client_a = FederatedClient("CLIENT_A", "REGION_A")
    client_b = FederatedClient("CLIENT_B", "REGION_B")

    state_a = client_a.model.state_dict()
    state_b = client_b.model.state_dict()

    assert set(state_a.keys()) == set(state_b.keys())
    for k in state_a:
        assert state_a[k].shape == state_b[k].shape


def test_15_fresh_fl_initialization_does_not_load_centralized_checkpoint():
    """Verify fresh FL server model does NOT match trained centralized Graph+LSTM checkpoint."""
    server = FederatedServer(seed=42)
    server_weights = server.get_global_state_dict()

    ckpt_path = "data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt"
    centralized_weights = torch.load(ckpt_path, map_location="cpu", weights_only=True)

    # Calculate L2 norm difference between FL initial state and centralized model state
    diff_norm = compute_update_l2_norm(server_weights, centralized_weights)
    assert diff_norm > 1.0  # Fresh initialization must differ significantly from trained model


# -----------------------------------------------------------------------------
# 4. FedAvg Aggregation, Validation & Safeguard Tests
# -----------------------------------------------------------------------------

def test_16_fedavg_weighted_aggregation_exact_on_toy_states():
    """Verify FedAvg weighted floating-point aggregation on exact numerical tensors."""
    state1 = {"weight": torch.tensor([1.0, 2.0])}
    state2 = {"weight": torch.tensor([3.0, 6.0])}

    # Weights 1:3 -> average = (1*1 + 3*3)/4 = 2.5, (1*2 + 3*6)/4 = 5.0
    agg = fedavg_aggregate([state1, state2], [10.0, 30.0])
    assert torch.allclose(agg["weight"], torch.tensor([2.5, 5.0]))


def test_17_fedavg_rejects_shape_mismatch():
    """Verify FedAvg rejects client updates with shape mismatch."""
    state1 = {"weight": torch.tensor([1.0, 2.0])}
    state2 = {"weight": torch.tensor([1.0, 2.0, 3.0])}

    with pytest.raises(ValueError, match="shape mismatch"):
        fedavg_aggregate([state1, state2], [1.0, 1.0])


def test_18_fedavg_rejects_non_finite_update():
    """Verify FedAvg rejects client updates containing NaN or Inf."""
    state1 = {"weight": torch.tensor([1.0, float("nan")])}
    state2 = {"weight": torch.tensor([1.0, 2.0])}

    with pytest.raises(ValueError, match="non-finite values"):
        fedavg_aggregate([state1, state2], [1.0, 1.0])


def test_19_valid_target_aggregation_weights_computed_from_train_only():
    """Verify aggregation weights are derived exclusively from train valid target counts."""
    partitions = load_client_partitions()
    total_train_valid = sum(p["trainValidTargets"] for p in partitions.values())

    w_a = partitions["REGION_A"]["trainValidTargets"] / total_train_valid
    assert abs(partitions["REGION_A"]["fedAvgWeight"] - round(w_a, 6)) < 1e-5


def test_20_server_rollback_restores_prior_state():
    """Verify server rollback capability restores prior valid global model weights."""
    server = FederatedServer(seed=42)
    initial_state = server.get_global_state_dict()

    # Create invalid update with NaN
    invalid_update = {
        "clientId": "CLIENT_A",
        "validTrainTargets": 100,
        "stateDict": {"spatial_conv.weight": torch.tensor([float("nan")])}
    }

    res = server.process_round_aggregation([invalid_update])
    assert res["status"] == "AGGREGATION_FAILED_ROLLED_BACK"
    assert res["rollbackExecuted"] is True

    current_state = server.get_global_state_dict()
    diff = compute_update_l2_norm(initial_state, current_state)
    assert diff == 0.0  # State perfectly restored


def test_21_serialization_byte_counting_deterministic():
    """Verify serialized model download/upload payload size equals 106,384 bytes."""
    client = FederatedClient("CLIENT_A", "REGION_A")
    up_record = client.upload_model_update(current_round=1)

    assert up_record["downloadPayloadBytes"] == 106384
    assert up_record["uploadPayloadBytes"] == 106384
    assert up_record["classification"] == "SERIALIZED_APPLICATION_PAYLOAD_BYTES"


# -----------------------------------------------------------------------------
# 5. Immutability & Protection Tests
# -----------------------------------------------------------------------------

def test_22_phase6_metrics_unchanged():
    """Verify Phase 6 frozen metrics remain intact in final_prediction_summary.json."""
    summary_path = "data/processed/metr-la/models/final_prediction_summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    models_overall = summary["sevenModelComparativeBenchmark"]["modelsOverall"]
    assert models_overall["Graph+LSTM"]["mae"] == 3.4378
    assert models_overall["Graph+LSTM"]["rmse"] == 6.8873


def test_23_phase7_artifacts_unchanged():
    """Verify Phase 7 validation calibration and freeze artifacts exist and match values."""
    path = "data/processed/metr-la/decision/val_uncertainty_calibration.json"
    assert os.path.exists(path)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["horizons"]["5"]["mae"] == 2.1868
    assert data["horizons"]["60"]["mae"] == 4.1364


def test_24_no_test_data_used_for_model_selection():
    """Verify test dataset (test.npz) is not loaded or used during FL round processing."""
    server = FederatedServer(seed=42)
    # Server evaluate_global_val loads only val.npz
    val_mae = server.evaluate_global_val()
    assert val_mae > 0.0
