"""
Deterministic entry point script to preprocess the raw METR-LA benchmark dataset
into ML-ready tensor arrays and metadata for TrafficPulse-X.
"""

import sys
import os

# Ensure workspace root is in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.datasets.metr_la import METRLADatasetInspector


def main():
    print("=" * 70)
    print("TrafficPulse-X — METR-LA ML-Ready Data Preprocessing Pipeline")
    print("=" * 70)

    inspector = METRLADatasetInspector(
        raw_dir="data/raw/metr-la",
        processed_dir="data/processed/metr-la"
    )

    print("Running dataset inspection and region partitioning...")
    metadata = inspector.inspect_and_save()
    print(f"Dataset availability: {metadata.get('availability')}")
    print(f"Graph Status: {metadata.get('graphStatus')}")
    print(f"Time Series Status: {metadata.get('timeSeriesStatus')}")

    print("\nGenerating ML-Ready Tensors (70/10/20 Chronological Split)...")
    summary = inspector.prepare_ml_ready_dataset(
        ml_ready_dir="data/processed/metr-la/ml_ready",
        input_steps=12,
        target_horizons=[1, 3, 6, 12],
        train_ratio=0.70,
        val_ratio=0.10,
        test_ratio=0.20
    )

    if summary.get("status") == "READY":
        print("\n[SUCCESS] Preprocessing completed successfully.")
        print(f"Scaler Mean: {summary['scaler']['mean']} mph | Std: {summary['scaler']['std']} mph")
        print(f"Train Windows: {summary['splits']['train']['numWindows']} (shape: {summary['splits']['train']['xShape']})")
        print(f"Val Windows:   {summary['splits']['val']['numWindows']} (shape: {summary['splits']['val']['xShape']})")
        print(f"Test Windows:  {summary['splits']['test']['numWindows']} (shape: {summary['splits']['test']['xShape']})")
        print("Outputs written to: data/processed/metr-la/ and data/processed/metr-la/ml_ready/")
    else:
        print(f"\n[ERROR] Preprocessing failed: {summary.get('error')}")


if __name__ == "__main__":
    main()
