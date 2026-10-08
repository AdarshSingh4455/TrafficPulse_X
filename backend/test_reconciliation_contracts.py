"""
TrafficPulse-X Forensic Reconciliation & Contract Protection Test Suite.
Validates dataset bounds, scaler immutability, model metrics provenance,
Level-1/Level-2 communication payload accounting, frontend contract safety,
and immutability of Phase 6/7/8 checkpoints and region checksums.
"""

import os
import json
import hashlib
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.data_source import DataSourceManager
from backend.datasets.metr_la import inspect_metr_la_dataset

client = TestClient(app)
data_mgr = DataSourceManager()


def test_1_no_78_2_savings_in_production_frontend():
    """Verifies that no hardcoded '78.2%' bandwidth savings string exists in production frontend src/ pages."""
    frontend_dir = "src"
    savings_string = "78.2%"
    
    found_occurrences = []
    for root, _, files in os.walk(frontend_dir):
        for f in files:
            if f.endswith((".jsx", ".js", ".tsx", ".ts")):
                fpath = os.path.join(root, f)
                with open(fpath, "r", encoding="utf-8") as file:
                    content = file.read()
                    if savings_string in content:
                        found_occurrences.append(fpath)
                        
    assert len(found_occurrences) == 0, f"Found hardcoded '78.2%' savings in production frontend files: {found_occurrences}"


def test_2_communication_page_wired_to_baseline_api():
    """Verifies that Communication.jsx uses fetchFederatedCommunication and displays baseline payload accounting."""
    comm_page_path = "src/pages/Communication/Communication.jsx"
    assert os.path.exists(comm_page_path)
    with open(comm_page_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    assert "fetchFederatedCommunication" in content, "Communication.jsx must call fetchFederatedCommunication API gateway helper"
    assert "Baseline Communication Accounting" in content, "Communication.jsx must render baseline accounting header"
    assert "78.2%" not in content, "Communication.jsx must not contain fake savings percentages"


def test_3_dataset_date_range_and_telemetry_availability():
    """Verifies exact raw METR-LA dataset timestamp bounds and telemetry availability flags."""
    status = inspect_metr_la_dataset()
    
    assert status["sensorCount"] == 207
    ts_stats = status["timeSeriesStats"]
    assert ts_stats["timeSteps"] == 34272
    assert ts_stats["startTime"] == "2012-03-01T00:00:00"
    assert ts_stats["endTime"] == "2012-06-27T23:55:00"
    
    avail = ts_stats["featuresFound"]
    assert avail["speed"]["available"] is True
    assert avail["flow"]["available"] is False
    assert avail["occupancy"]["available"] is False


def test_4_scaler_parameters_immutable():
    """Verifies exact frozen StandardScaler parameters fitted on train_valid_only."""
    scaler_path = "data/processed/metr-la/scaler.json"
    assert os.path.exists(scaler_path)
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler_data = json.load(f)
        
    assert scaler_data["scalerType"] == "StandardScaler"
    assert scaler_data["mean"] == 58.584258
    assert scaler_data["std"] == 12.822883
    assert scaler_data["fittedOn"] == "train_valid_only"


def test_5_model_metrics_provenance_and_horizon_winners():
    """Verifies authoritative 7-model prediction summary and +60 min Historical Average horizon winner."""
    summary_path = "data/processed/metr-la/models/final_prediction_summary.json"
    assert os.path.exists(summary_path)
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
        
    models = summary["sevenModelComparativeBenchmark"]["modelsOverall"]
    assert models["Graph+LSTM"]["mae"] == 3.4378
    assert models["Graph+LSTM"]["rmse"] == 6.8873
    assert models["Graph+LSTM"]["mape"] == 9.57
    
    assert models["Historical Average"]["mae"] == 4.1930
    assert models["Historical Average"]["rmse"] == 7.8618
    assert models["Historical Average"]["mape"] == 13.06
    
    # Verify +60 min winner is Historical Average
    h60_winner = summary["sevenModelComparativeBenchmark"]["horizonWinners"]["+60 min"]["winner"]
    assert h60_winner == "Historical Average"
    assert summary["sevenModelComparativeBenchmark"]["horizonWinners"]["+60 min"]["winnerMae"] == 4.1934


def test_6_need_score_classification_derived():
    """Verifies that Need Score is a composite DERIVED calculation and uses data quality for sensor health factor."""
    res = client.get("/api/decision/sensors/773869/need-score")
    assert res.status_code == 200
    data = res.json()
    
    assert "needScore" in data
    assert 0.05 <= data["needScore"] <= 1.0
    factors = data["factors"]
    assert "uncertaintyProxy" in factors
    assert "sensorHealth" in factors  # Internal legacy factor key
    assert isinstance(factors["sensorHealth"], float)
    assert 0.0 <= factors["sensorHealth"] <= 1.0


def test_7_coverage_certificate_no_cryptographic_signature():
    """Verifies that Coverage Certificate returns validation status without claiming fake cryptographic keys."""
    res = client.get("/api/decision/certificate/REGION_A")
    assert res.status_code == 200
    cert = res.json()
    
    assert cert["region"] == "REGION_A"
    assert "contractSatisfied" in cert
    assert "status" in cert
    assert "signature" not in cert
    assert "cryptoKey" not in cert


def test_8_regional_fl_client_partitions_and_fedavg_weights():
    """Verifies 4 regional FL client partitions, Set A valid target weights, and sum == 1.0."""
    res = client.get("/api/federated/clients")
    assert res.status_code == 200
    clients_list = res.json()
    
    assert len(clients_list) == 4
    total_weight = sum(c["aggregationWeight"] for c in clients_list)
    assert abs(total_weight - 1.0) < 1e-5
    
    client_a = next(c for c in clients_list if c["clientId"] == "CLIENT_A")
    assert client_a["sensorCount"] == 48
    assert client_a["trainValidTargets"] == 4221681


def test_9_level_2_communication_totals():
    """Verifies exact Stage 8.2 baseline communication payload accounting totals."""
    res = client.get("/api/federated/communication")
    assert res.status_code == 200
    comm = res.json()
    
    assert comm["rawBytesPerModel"] == 106384
    assert comm["serializedBytesPerModel"] == 110271
    assert comm["serializedTotalBytes"] == 11468184


def test_10_checkpoints_and_region_checksum_immutable():
    """Verifies that centralized and federated PyTorch model checkpoints and regional partition checksum remain 100% frozen."""
    # 1. Centralized Graph+LSTM checkpoint
    c_path = "data/processed/metr-la/models/spatiotemporal/graph_lstm_best.pt"
    assert os.path.exists(c_path)
    with open(c_path, "rb") as f:
        c_sha = hashlib.sha256(f.read()).hexdigest()
    assert c_sha == "702cb2bb9406aa36ec25639121377bf939acdb1906370997ccd792f70cf1f384"
    
    # 2. Federated Global Best checkpoint
    fl_path = "data/processed/metr-la/federated/checkpoints/global_best.pt"
    assert os.path.exists(fl_path)
    with open(fl_path, "rb") as f:
        fl_sha = hashlib.sha256(f.read()).hexdigest()
    assert fl_sha == "24710dae0fe0554ca8111ad21e05de03b69a282f0b8d8868a1433ba6fd9c2930"
    
    # 3. Region checksum
    reg_path = "data/processed/metr-la/regions.json"
    assert os.path.exists(reg_path)
    with open(reg_path, "rb") as f:
        reg_sha = hashlib.sha256(f.read()).hexdigest()
    assert reg_sha == "3af9827ff16eea2c8469dcfd3f712e7a9074d1ab10ef61c9ee78f99e9b5463b3"
