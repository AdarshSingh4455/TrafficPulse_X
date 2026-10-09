"""
TrafficPulse-X Phase 6 Stage 6.4: Spatial GCN Model Training Script.
Trains plain PyTorch SpatialGCN model on train.npz and selects best checkpoint based on val.npz loss.
"""

import os
import json
import time
import pickle
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, Any

from ml.graph.model import SpatialGCN, calculate_normalized_adjacency, count_parameters
from ml.temporal.dataset import create_dataloader

EPSILON = 1e-5


def masked_mae_loss(pred_raw: torch.Tensor, target_raw: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
    """
    Computes Masked MAE loss in raw MPH space.
    Excludes invalid targets (mask == False or target == 0.0).
    """
    mask_bool = mask.bool()
    if not mask_bool.any():
        return torch.tensor(0.0, device=pred_raw.device, requires_grad=True)

    err = torch.abs(pred_raw[mask_bool] - target_raw[mask_bool])
    return torch.mean(err)


def train_spatial_gcn(
    processed_dir: str = "data/processed/metr-la",
    raw_dir: str = "data/raw/metr-la",
    model_dir: str = "data/processed/metr-la/models/graph",
    seed: int = 42,
    batch_size: int = 64,
    learning_rate: float = 1e-3,
    max_epochs: int = 30,
    patience: int = 5
) -> Dict[str, Any]:
    # Set seed for reproducibility
    torch.manual_seed(seed)
    np.random.seed(seed)

    os.makedirs(model_dir, exist_ok=True)

    train_path = os.path.join(processed_dir, "ml_ready/train.npz")
    val_path = os.path.join(processed_dir, "ml_ready/val.npz")
    scaler_path = os.path.join(processed_dir, "scaler.json")
    adj_path = os.path.join(raw_dir, "adj_mx.pkl")

    # Load frozen scaler parameters
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler = json.load(f)
    mean, std = scaler["mean"], scaler["std"]

    # Load adjacency matrix
    with open(adj_path, "rb") as f:
        _, _, adj_mx = pickle.load(f, encoding="latin1")

    a_norm_np = calculate_normalized_adjacency(adj_mx, is_identity=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    a_norm = torch.tensor(a_norm_np, dtype=torch.float32, device=device)

    train_loader = create_dataloader(train_path, batch_size=batch_size, shuffle=True)
    val_loader = create_dataloader(val_path, batch_size=batch_size, shuffle=False)

    model = SpatialGCN(in_features=2, hidden_dim=64, output_horizons=4, dropout=0.1).to(device)
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)

    best_val_loss = float("inf")
    best_epoch = -1
    no_improve_count = 0
    history = []

    start_time = time.time()

    for epoch in range(1, max_epochs + 1):
        model.train()
        train_loss_sum = 0.0
        train_batches = 0

        for x_b, y_b, y_mask_b in train_loader:
            x_b = x_b.to(device)
            y_b = y_b.to(device)
            y_mask_b = y_mask_b.to(device)

            optimizer.zero_grad()
            pred_norm = model(x_b, a_norm)
            pred_raw = pred_norm * std + mean

            loss = masked_mae_loss(pred_raw, y_b, y_mask_b)
            loss.backward()
            optimizer.step()

            train_loss_sum += loss.item()
            train_batches += 1

        avg_train_loss = train_loss_sum / max(1, train_batches)

        # Validation
        model.eval()
        val_loss_sum = 0.0
        val_batches = 0

        with torch.no_grad():
            for x_b, y_b, y_mask_b in val_loader:
                x_b = x_b.to(device)
                y_b = y_b.to(device)
                y_mask_b = y_mask_b.to(device)

                pred_norm = model(x_b, a_norm)
                pred_raw = pred_norm * std + mean

                loss = masked_mae_loss(pred_raw, y_b, y_mask_b)
                val_loss_sum += loss.item()
                val_batches += 1

        avg_val_loss = val_loss_sum / max(1, val_batches)

        history.append({
            "epoch": epoch,
            "trainLoss": round(avg_train_loss, 4),
            "valLoss": round(avg_val_loss, 4)
        })

        print(f"Epoch {epoch:02d}/{max_epochs:02d} | Train MAE: {avg_train_loss:.4f} mph | Val MAE: {avg_val_loss:.4f} mph")

        # Checkpoint selection based on val loss
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            best_epoch = epoch
            no_improve_count = 0
            torch.save(model.state_dict(), os.path.join(model_dir, "gcn_best.pt"))
        else:
            no_improve_count += 1
            if no_improve_count >= patience:
                print(f"Early stopping triggered at epoch {epoch}. Best epoch: {best_epoch} (Val MAE: {best_val_loss:.4f} mph)")
                break

    training_duration = round(time.time() - start_time, 2)
    param_count = count_parameters(model)
    checkpoint_size_bytes = os.path.getsize(os.path.join(model_dir, "gcn_best.pt"))

    config = {
        "modelType": "SpatialGCN",
        "spatialOnly": True,
        "temporalRecurrence": False,
        "inputFeatures": 2,
        "hiddenDim": 64,
        "outputHorizons": 4,
        "dropout": 0.1,
        "seed": seed,
        "batchSize": batch_size,
        "learningRate": learning_rate,
        "maxEpochs": max_epochs,
        "epochsCompleted": len(history),
        "bestEpoch": best_epoch,
        "bestValLoss": round(best_val_loss, 4),
        "trainingDurationSeconds": training_duration,
        "parameterCount": param_count,
        "checkpointSizeBytes": checkpoint_size_bytes,
        "device": str(device)
    }

    with open(os.path.join(model_dir, "gcn_config.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    with open(os.path.join(model_dir, "gcn_history.json"), "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    print(f"\nSaved Stage 6.4 GCN Model Checkpoint: gcn_best.pt ({checkpoint_size_bytes / 1024:.2f} KB)")
    return config


if __name__ == "__main__":
    train_spatial_gcn()
