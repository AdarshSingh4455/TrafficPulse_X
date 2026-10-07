"""
TrafficPulse-X Phase 6 Stage 6.3: Unified GRU & LSTM Training Runner.
Trains global shared temporal models on TRAIN split, validates on VAL split with early stopping.
Saves model checkpoints, configs, and epoch histories to data/processed/metr-la/models/temporal/.
"""

import os
import time
import json
import random
import argparse
import numpy as np
import torch
import torch.optim as optim

from ml.temporal.models import TemporalGRU, TemporalLSTM, MaskedMAELoss, count_parameters
from ml.temporal.dataset import create_dataloader


def set_seed(seed: int = 42) -> None:
    """Sets deterministic seeds for Python, NumPy, and PyTorch."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False


def train_model(
    model_type: str = "gru",
    processed_dir: str = "data/processed/metr-la",
    output_dir: str = "data/processed/metr-la/models/temporal",
    seed: int = 42,
    hidden_size: int = 64,
    num_layers: int = 1,
    batch_size: int = 64,
    learning_rate: float = 1e-3,
    max_epochs: int = 30,
    patience: int = 5
) -> dict:
    set_seed(seed)
    os.makedirs(output_dir, exist_ok=True)

    # Load scaler statistics
    scaler_path = os.path.join(processed_dir, "scaler.json")
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler = json.load(f)
    mean, std = scaler["mean"], scaler["std"]

    # Detect device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Data paths
    train_npz = os.path.join(processed_dir, "ml_ready/train.npz")
    val_npz = os.path.join(processed_dir, "ml_ready/val.npz")

    train_loader = create_dataloader(train_npz, batch_size=batch_size, shuffle=True)
    val_loader = create_dataloader(val_npz, batch_size=batch_size, shuffle=False)

    # Instantiate model
    model_type = model_type.lower()
    if model_type == "gru":
        model = TemporalGRU(input_size=2, hidden_size=hidden_size, num_layers=num_layers, output_horizons=4)
    elif model_type == "lstm":
        model = TemporalLSTM(input_size=2, hidden_size=hidden_size, num_layers=num_layers, output_horizons=4)
    else:
        raise ValueError(f"Unknown model_type: {model_type}. Choose 'gru' or 'lstm'.")

    model.to(device)
    param_count = count_parameters(model)

    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    criterion = MaskedMAELoss()

    best_val_loss = float("inf")
    best_epoch = 0
    patience_counter = 0
    checkpoint_path = os.path.join(output_dir, f"{model_type}_best.pt")

    history = {
        "modelType": model_type.upper(),
        "trainLossHistory": [],
        "valLossHistory": [],
        "bestEpoch": 0,
        "bestValLoss": float("inf"),
        "earlyStopEpoch": 0,
        "epochsCompleted": 0,
        "totalTrainingDurationSec": 0.0
    }

    start_time = time.time()

    for epoch in range(1, max_epochs + 1):
        epoch_start = time.time()

        # Training phase
        model.train()
        train_loss_sum = 0.0
        train_batches = 0

        for x_batch, y_batch, mask_batch in train_loader:
            x_batch = x_batch.to(device)
            y_batch = y_batch.to(device)
            mask_batch = mask_batch.to(device)

            optimizer.zero_grad()
            # Forward pass -> outputs normalized speed
            pred_norm = model(x_batch)
            # Inverse scale to raw MPH
            pred_raw = pred_norm * std + mean

            loss = criterion(pred_raw, y_batch, mask_batch)
            loss.backward()
            optimizer.step()

            train_loss_sum += loss.item()
            train_batches += 1

        avg_train_loss = round(train_loss_sum / max(1, train_batches), 4)

        # Validation phase
        model.eval()
        val_loss_sum = 0.0
        val_batches = 0

        with torch.no_grad():
            for x_batch, y_batch, mask_batch in val_loader:
                x_batch = x_batch.to(device)
                y_batch = y_batch.to(device)
                mask_batch = mask_batch.to(device)

                pred_norm = model(x_batch)
                pred_raw = pred_norm * std + mean

                loss = criterion(pred_raw, y_batch, mask_batch)
                val_loss_sum += loss.item()
                val_batches += 1

        avg_val_loss = round(val_loss_sum / max(1, val_batches), 4)
        epoch_duration = round(time.time() - epoch_start, 2)

        history["trainLossHistory"].append(avg_train_loss)
        history["valLossHistory"].append(avg_val_loss)
        history["epochsCompleted"] = epoch

        print(f"[{model_type.upper()}] Epoch {epoch:02d}/{max_epochs:02d} | Train MAE: {avg_train_loss:.4f} mph | Val MAE: {avg_val_loss:.4f} mph | Time: {epoch_duration}s")

        # Early stopping & checkpoint selection
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            best_epoch = epoch
            patience_counter = 0
            # Save best checkpoint
            torch.save(model.state_dict(), checkpoint_path)
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"[{model_type.upper()}] Early stopping triggered at epoch {epoch}. Best epoch was {best_epoch} with Val MAE: {best_val_loss:.4f} mph.")
                history["earlyStopEpoch"] = epoch
                break

    total_duration = round(time.time() - start_time, 2)
    history["bestEpoch"] = best_epoch
    history["bestValLoss"] = best_val_loss
    history["totalTrainingDurationSec"] = total_duration

    # Save Config
    config = {
        "modelType": model_type.upper(),
        "inputSize": 2,
        "hiddenSize": hidden_size,
        "numLayers": num_layers,
        "outputHorizons": 4,
        "parameterCount": param_count,
        "seed": seed,
        "batchSize": batch_size,
        "learningRate": learning_rate,
        "maxEpochs": max_epochs,
        "patience": patience,
        "scalerMean": mean,
        "scalerStd": std,
        "deviceUsed": str(device),
        "pytorchVersion": torch.__version__
    }

    with open(os.path.join(output_dir, f"{model_type}_config.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    with open(os.path.join(output_dir, f"{model_type}_history.json"), "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    checkpoint_size_bytes = os.path.getsize(checkpoint_path) if os.path.exists(checkpoint_path) else 0

    print(f"[{model_type.upper()}] Training complete. Best Val MAE: {best_val_loss:.4f} mph at epoch {best_epoch}. Checkpoint size: {checkpoint_size_bytes:,} bytes.")

    return {
        "config": config,
        "history": history,
        "checkpointPath": checkpoint_path,
        "checkpointSizeBytes": checkpoint_size_bytes
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train TrafficPulse-X Stage 6.3 GRU/LSTM Models")
    parser.add_argument("--model", type=str, default="all", choices=["gru", "lstm", "all"], help="Model to train")
    parser.add_argument("--epochs", type=int, default=30, help="Max epochs")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    args = parser.parse_args()

    if args.model in ["gru", "all"]:
        train_model("gru", max_epochs=args.epochs, batch_size=args.batch_size, learning_rate=args.lr)
    if args.model in ["lstm", "all"]:
        train_model("lstm", max_epochs=args.epochs, batch_size=args.batch_size, learning_rate=args.lr)
