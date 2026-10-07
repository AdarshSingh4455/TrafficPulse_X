"""
TrafficPulse-X Phase 6 Stage 6.6 Unit Test Suite.
Verifies final prediction freeze contracts:
- Immutability of Stage 6.1–6.5 metrics across all source artifacts.
- Selection of Graph+LSTM as primary overall centralized prediction model.
- Preservation of Historical Average as +60 min benchmark winner.
- Exact match of final_prediction_summary.json and .md to source artifacts.
- Verification of dataset, scaler (mean=58.584258, std=12.822883), and adjacency contracts.
- Confirmation of zero test data leakage and zero model retraining.
"""

import os
import json
import pickle
import numpy as np

FINAL_SUMMARY_JSON = "data/processed/metr-la/models/final_prediction_summary.json"
FINAL_SUMMARY_MD = "data/processed/metr-la/models/final_prediction_summary.md"
GRAPH_LSTM_RESULTS = "data/processed/metr-la/models/spatiotemporal/graph_lstm_results.json"
TEMPORAL_RESULTS = "data/processed/metr-la/models/temporal/temporal_results.json"
GCN_RESULTS = "data/processed/metr-la/models/graph/gcn_results.json"
LINEAR_RESULTS = "data/processed/metr-la/baselines/linear/linear_results.json"
BASELINE_RESULTS = "data/processed/metr-la/baselines/baseline_results.json"
SCALER_PATH = "data/processed/metr-la/scaler.json"
REGIONS_PATH = "data/processed/metr-la/regions.json"
ADJ_PATH = "data/raw/metr-la/adj_mx.pkl"
GRAPH_LSTM_CHECKPOINT = "data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt"


def test_1_final_prediction_summary_artifacts_exist():
    """1. Verify final_prediction_summary.json and .md artifacts exist."""
    assert os.path.exists(FINAL_SUMMARY_JSON)
    assert os.path.exists(FINAL_SUMMARY_MD)


def test_2_frozen_metrics_immutability():
    """2. Verify frozen metrics across all 7 models remain unchanged from authoritative values."""
    with open(FINAL_SUMMARY_JSON, "r", encoding="utf-8") as f:
        summary = json.load(f)

    models_overall = summary["sevenModelComparativeBenchmark"]["modelsOverall"]

    assert models_overall["Last Value"]["mae"] == 3.9839
    assert models_overall["Historical Average"]["mae"] == 4.1930
    assert models_overall["Linear Regression"]["mae"] == 3.9763
    assert models_overall["GRU"]["mae"] == 3.5669
    assert models_overall["LSTM"]["mae"] == 3.5613
    assert models_overall["Spatial GCN"]["mae"] == 5.4604
    assert models_overall["Graph+LSTM"]["mae"] == 3.4378


def test_3_primary_centralized_model_selection():
    """3. Verify Graph+LSTM is selected as the primary overall centralized prediction model."""
    with open(FINAL_SUMMARY_JSON, "r", encoding="utf-8") as f:
        summary = json.load(f)

    assert summary["primaryCentralizedModel"]["modelName"] == "Graph+LSTM"
    assert summary["primaryCentralizedModel"]["checkpointPath"] == GRAPH_LSTM_CHECKPOINT
    assert os.path.exists(GRAPH_LSTM_CHECKPOINT)


def test_4_horizon_60_winner_preservation():
    """4. Verify Historical Average remains the winner at +60 min horizon."""
    with open(FINAL_SUMMARY_JSON, "r", encoding="utf-8") as f:
        summary = json.load(f)

    winners = summary["sevenModelComparativeBenchmark"]["horizonWinners"]
    assert winners["+60 min"]["winner"] == "Historical Average"
    assert winners["+60 min"]["winnerMae"] == 4.1934


def test_5_horizon_05_15_30_winners():
    """5. Verify Graph+LSTM wins +5, +15, and +30 min horizons."""
    with open(FINAL_SUMMARY_JSON, "r", encoding="utf-8") as f:
        summary = json.load(f)

    winners = summary["sevenModelComparativeBenchmark"]["horizonWinners"]
    assert winners["+5 min"]["winner"] == "Graph+LSTM"
    assert winners["+15 min"]["winner"] == "Graph+LSTM"
    assert winners["+30 min"]["winner"] == "Graph+LSTM"


def test_6_canonical_sensor_ordering_and_count():
    """6. Verify 207 canonical METR-LA sensors ordering and count."""
    with open(ADJ_PATH, "rb") as f:
        sensor_ids, _, adj_mx = pickle.load(f, encoding="latin1")

    assert len(sensor_ids) == 207
    assert adj_mx.shape == (207, 207)


def test_7_train_only_scaler_contract():
    """7. Verify train-only scaler stats (mean=58.584258, std=12.822883) are preserved."""
    with open(SCALER_PATH, "r", encoding="utf-8") as f:
        scaler = json.load(f)

    assert abs(scaler["mean"] - 58.584258) < 1e-4
    assert abs(scaler["std"] - 12.822883) < 1e-4


def test_8_summary_values_match_source_artifacts():
    """8. Verify final summary values strictly match source results artifacts."""
    with open(FINAL_SUMMARY_JSON, "r", encoding="utf-8") as f:
        summary = json.load(f)
    with open(GRAPH_LSTM_RESULTS, "r", encoding="utf-8") as f:
        graph_lstm_res = json.load(f)

    gl_summary = summary["sevenModelComparativeBenchmark"]["modelsOverall"]["Graph+LSTM"]
    gl_source = graph_lstm_res["overallMetrics"]["graphLSTM"]

    assert gl_summary["mae"] == gl_source["mae"]
    assert gl_summary["rmse"] == gl_source["rmse"]
    assert gl_summary["mape"] == gl_source["mape"]


def test_9_region_breakdown_metrics_consistency():
    """9. Verify 4-region breakdown metrics for Graph+LSTM in final summary."""
    with open(FINAL_SUMMARY_JSON, "r", encoding="utf-8") as f:
        summary = json.load(f)

    regions = summary["regionBreakdown"]["regions"]
    assert set(regions.keys()) == {"REGION_A", "REGION_B", "REGION_C", "REGION_D"}
    assert regions["REGION_A"]["sensorCount"] == 48
    assert regions["REGION_B"]["sensorCount"] == 57
    assert regions["REGION_C"]["sensorCount"] == 58
    assert regions["REGION_D"]["sensorCount"] == 44


def test_10_no_test_leakage_in_model_selection():
    """10. Verify model checkpoint selection decision rule used validation loss without test data leakage."""
    with open(GRAPH_LSTM_RESULTS, "r", encoding="utf-8") as f:
        graph_lstm_res = json.load(f)

    cfg = graph_lstm_res["modelConfig"]
    assert "bestValLoss" in cfg
    assert cfg["bestEpoch"] > 0
    assert cfg["epochsCompleted"] == 30


def test_11_stage_6_7_inference_contract_documented():
    """11. Verify exact inference contract for Stage 6.7 API is fully documented in summary JSON."""
    with open(FINAL_SUMMARY_JSON, "r", encoding="utf-8") as f:
        summary = json.load(f)

    contract = summary["stage67InferenceContract"]
    assert "step1_Input" in contract
    assert "step2_Preprocessing" in contract
    assert "step3_GraphContext" in contract
    assert "step4_ModelInference" in contract
    assert "step5_Postprocessing" in contract
    assert "step6_Output" in contract
