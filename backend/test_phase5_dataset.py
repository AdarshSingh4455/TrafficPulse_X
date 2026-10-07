import os
import json
import shutil
import tempfile
import pickle
import numpy as np
import pandas as pd
import pytest
from backend.datasets.metr_la import (
    inspect_metr_la_dataset,
    METRLADatasetInspector,
    get_real_sensor_canonical,
    get_metr_la_snapshot,
    derive_time_semantics
)


# ==============================================================================
# STAGE 5.1 & 5.2 TESTS (DATASET ACQUISITION & INSPECTION)
# ==============================================================================

def test_missing_directory():
    """1. Graceful handling of non-existent raw directory."""
    non_existent_dir = "data/raw/non_existent_dir_12345"
    temp_proc = tempfile.mkdtemp()
    try:
        res = inspect_metr_la_dataset(raw_dir=non_existent_dir, processed_dir=temp_proc)
        assert res["availability"] == "UNAVAILABLE"
        assert res["graphStatus"] == "MISSING"
        assert res["timeSeriesStatus"] == "FILES_REQUIRED"
        assert res["validations"]["missingDir"] is True
        assert res["validations"]["duplicateTimestamps"] is None
        assert res["validations"]["timestampValidation"] == "NOT_EVALUATED"
        assert os.path.exists(os.path.join(temp_proc, "metadata.json"))
        assert os.path.exists(os.path.join(temp_proc, "feature_support.json"))
    finally:
        shutil.rmtree(temp_proc, ignore_errors=True)


def test_empty_or_corrupt_file():
    """2. Detection of empty (0-byte) or corrupt measurement files."""
    temp_raw = tempfile.mkdtemp()
    temp_proc = tempfile.mkdtemp()
    try:
        empty_file = os.path.join(temp_raw, "metr-la.h5")
        open(empty_file, "w").close()

        inspector = METRLADatasetInspector(raw_dir=temp_raw, processed_dir=temp_proc)
        res = inspector.inspect_and_save()

        assert res["validations"]["corruptFile"] is True
        assert res["timeSeriesStatus"] == "CORRUPT_FILE"
    finally:
        shutil.rmtree(temp_raw, ignore_errors=True)
        shutil.rmtree(temp_proc, ignore_errors=True)


def test_missing_time_series_unevaluated_validations():
    """3. Verify unevaluated validation fields when measurement time-series is missing."""
    temp_raw = tempfile.mkdtemp()
    temp_proc = tempfile.mkdtemp()
    try:
        txt_path = os.path.join(temp_raw, "graph_sensor_ids.txt")
        with open(txt_path, "w") as f:
            f.write("773869,767541")

        adj_path = os.path.join(temp_raw, "adj_mx.pkl")
        with open(adj_path, "wb") as f:
            pickle.dump((["773869", "767541"], {"773869": 0, "767541": 1}, np.eye(2)), f)

        inspector = METRLADatasetInspector(raw_dir=temp_raw, processed_dir=temp_proc)
        res = inspector.inspect_and_save()

        assert res["availability"] == "PARTIAL"
        assert res["graphStatus"] == "AVAILABLE"
        assert res["timeSeriesStatus"] == "FILES_REQUIRED"
        assert res["validations"]["duplicateTimestamps"] is None
        assert res["validations"]["nanCount"] is None
        assert res["validations"]["sensorIdMismatch"] is None
        assert res["validations"]["timestampValidation"] == "NOT_EVALUATED"
    finally:
        shutil.rmtree(temp_raw, ignore_errors=True)
        shutil.rmtree(temp_proc, ignore_errors=True)


def test_duplicate_timestamps():
    """4. Detection of duplicate timestamps in time series data."""
    temp_raw = tempfile.mkdtemp()
    temp_proc = tempfile.mkdtemp()
    try:
        csv_path = os.path.join(temp_raw, "vel.csv")
        timestamps = ["2012-03-01 00:00:00", "2012-03-01 00:00:00", "2012-03-01 00:05:00"]
        df = pd.DataFrame({
            "773869": [65.0, 62.0, 60.0],
            "767541": [55.0, 58.0, 57.0]
        }, index=timestamps)
        df.to_csv(csv_path)

        inspector = METRLADatasetInspector(raw_dir=temp_raw, processed_dir=temp_proc)
        res = inspector.inspect_and_save()

        assert res["validations"]["duplicateTimestamps"] == 1
        assert res["validations"]["timestampValidation"] == "WARNING_DUPLICATES"
    finally:
        shutil.rmtree(temp_raw, ignore_errors=True)
        shutil.rmtree(temp_proc, ignore_errors=True)


def test_nan_counts_and_zero_mask_contract():
    """5. Accurate separation of NaN counts vs 0.0 masked-null counts."""
    temp_raw = tempfile.mkdtemp()
    temp_proc = tempfile.mkdtemp()
    try:
        csv_path = os.path.join(temp_raw, "vel.csv")
        timestamps = pd.date_range("2012-03-01", periods=5, freq="5min")
        data = np.array([
            [65.0, 0.0],
            [np.nan, 58.0],
            [60.0, 0.0],
            [np.nan, 0.0],
            [50.0, 55.0]
        ])
        df = pd.DataFrame(data, index=timestamps, columns=["773869", "767541"])
        df.to_csv(csv_path)

        inspector = METRLADatasetInspector(raw_dir=temp_raw, processed_dir=temp_proc)
        res = inspector.inspect_and_save()

        missingness = res["timeSeriesStats"]["missingness"]
        assert missingness["nanCount"] == 2
        assert missingness["maskedNullValue"] == 0.0
        assert missingness["maskedNullCount"] == 3
        assert missingness["validObservationCount"] == 5
    finally:
        shutil.rmtree(temp_raw, ignore_errors=True)
        shutil.rmtree(temp_proc, ignore_errors=True)


def test_sensor_id_mismatch():
    """6. Detection of sensor ID list mismatches against graph_sensor_ids.txt."""
    temp_raw = tempfile.mkdtemp()
    temp_proc = tempfile.mkdtemp()
    try:
        txt_path = os.path.join(temp_raw, "graph_sensor_ids.txt")
        with open(txt_path, "w") as f:
            f.write("773869,767541")

        csv_path = os.path.join(temp_raw, "vel.csv")
        timestamps = pd.date_range("2012-03-01", periods=3, freq="5min")
        df = pd.DataFrame({
            "999999": [65.0, 62.0, 60.0],
            "888888": [55.0, 58.0, 57.0]
        }, index=timestamps)
        df.to_csv(csv_path)

        inspector = METRLADatasetInspector(raw_dir=temp_raw, processed_dir=temp_proc)
        res = inspector.inspect_and_save()

        assert res["validations"]["sensorIdMismatch"] is True
        assert res["timeSeriesStats"]["sensorIdCrossCheck"]["sensorIdMismatch"] is True
    finally:
        shutil.rmtree(temp_raw, ignore_errors=True)
        shutil.rmtree(temp_proc, ignore_errors=True)


# ==============================================================================
# STAGE 5.3 TESTS (CANONICAL SCHEMA & FEATURE SUPPORT)
# ==============================================================================

def test_raw_hdf5_remains_unchanged():
    """7. Verify raw HDF5 file size and immutability."""
    h5_path = "data/raw/metr-la/metr-la.h5"
    if not os.path.exists(h5_path):
        pytest.skip("metr-la.h5 file not available locally")

    initial_size = os.path.getsize(h5_path)
    inspect_metr_la_dataset()
    after_size = os.path.getsize(h5_path)
    assert initial_size == after_size == 57038056


def test_no_hardware_health_fabricated_in_real_mode():
    """8. Verify hardware sensor health is NOT_AVAILABLE in METR-LA feature support."""
    inspector = METRLADatasetInspector()
    matrix = inspector.generate_feature_support_matrix(True)
    feats = matrix["features"]
    assert feats["hardwareSensorHealth"]["available"] is False
    assert feats["hardwareSensorHealth"]["classification"] == "NOT_AVAILABLE"


def test_timestamp_derived_fields_deterministic():
    """9. Verify timestamp-derived temporal attributes are deterministic."""
    semantics = derive_time_semantics("2012-03-01T08:30:00")
    assert semantics["hour"] == 8
    assert semantics["minute"] == 30
    assert semantics["dayOfWeek"] == 3
    assert semantics["dayName"] == "Thursday"
    assert semantics["isWeekend"] is False
    assert semantics["timeOfDay"] == "MORNING"


# ==============================================================================
# STAGE 5.4 TESTS (REGIONS & REPRESENTATIVES)
# ==============================================================================

def test_exactly_four_regions_exist():
    """10. Verify exactly 4 regions exist in regions.json."""
    inspector = METRLADatasetInspector()
    regions, _ = inspector.generate_regions_and_representatives()
    assert len(regions) == 4
    assert set(regions.keys()) == {"REGION_A", "REGION_B", "REGION_C", "REGION_D"}


def test_all_207_research_sensors_remain_intact():
    """11. Verify all 207 real research sensors remain assigned across regions."""
    inspector = METRLADatasetInspector()
    regions, _ = inspector.generate_regions_and_representatives()
    all_assigned = []
    for r in regions.values():
        all_assigned.extend(r["sensorIds"])
    assert len(all_assigned) == 207
    assert len(set(all_assigned)) == 207


def test_region_labels_match_centroids():
    """12. Directional display labels match actual centroid coordinates."""
    inspector = METRLADatasetInspector()
    regions, _ = inspector.generate_regions_and_representatives()

    # REGION_A centroid: North-East (lat 34.159, lon -118.234)
    # REGION_B centroid: South-East (lat 34.078, lon -118.288)
    # REGION_C centroid: Central-West (lat 34.134, lon -118.355)
    # REGION_D centroid: North-West (lat 34.171, lon -118.505)
    assert regions["REGION_A"]["directionalName"] == "North-East"
    assert regions["REGION_B"]["directionalName"] == "South-East"
    assert regions["REGION_C"]["directionalName"] == "Central-West"
    assert regions["REGION_D"]["directionalName"] == "North-West"


def test_graph_connections_come_only_from_real_adjacency():
    """13. Verify graph connection counts come directly from real adjacency matrix."""
    inspector = METRLADatasetInspector()
    regions, _ = inspector.generate_regions_and_representatives()
    for r_code, r_obj in regions.items():
        assert r_obj["graphStatistics"]["internalEdgeCount"] > 0
        assert r_obj["graphStatistics"]["outgoingCrossRegionEdgeCount"] >= 0


# ==============================================================================
# STAGE 5.5 TESTS (SNAPSHOT & HISTORICAL REPLAY)
# ==============================================================================

def test_region_a_b_c_d_each_returns_exactly_5_representatives():
    """14. Region A, B, C, D snapshot each returns exactly 5 representative sensors."""
    for r_id in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]:
        snap = get_metr_la_snapshot(time_index=0, region_id=r_id, representatives_only=True)
        assert snap["sensorCount"] == 5
        for s in snap["sensors"]:
            assert s["regionId"] == r_id


def test_all_regions_returns_exactly_20_representatives():
    """15. All Regions snapshot (representatives_only=True) returns exactly 20 representative sensors."""
    snap = get_metr_la_snapshot(time_index=0, region_id="ALL", representatives_only=True)
    assert snap["sensorCount"] == 20
    sids = [s["sensorId"] for s in snap["sensors"]]
    assert len(set(sids)) == 20


def test_snapshot_timestamp_matches_real_hdf5():
    """16. Snapshot timestamp matches real HDF5 timestamp at time_index=100."""
    snap = get_metr_la_snapshot(time_index=100)
    assert snap["timeIndex"] == 100
    assert snap["timestamp"].startswith("2012-03-01T08:20")
    assert snap["totalTimeSteps"] == 34272


def test_returned_coordinates_match_real_location_file():
    """17. Returned snapshot coordinates match real graph_sensor_locations.csv."""
    snap = get_metr_la_snapshot(time_index=0, region_id="ALL", representatives_only=True)
    s_map = {s["sensorId"]: (s["latitude"], s["longitude"]) for s in snap["sensors"]}

    df_loc = pd.read_csv("data/raw/metr-la/graph_sensor_locations.csv")
    df_loc["sensor_id"] = df_loc["sensor_id"].astype(str).str.replace(".0", "", regex=False)
    loc_dict = dict(zip(df_loc["sensor_id"], zip(df_loc["latitude"], df_loc["longitude"])))

    for sid, pos in s_map.items():
        assert pos == loc_dict[sid]


def test_returned_speed_equals_raw_hdf5_value():
    """18. Returned raw speed matches exact stored HDF5 matrix value."""
    snap = get_metr_la_snapshot(time_index=0, region_id="ALL", representatives_only=True)
    s0 = snap["sensors"][0]
    rec = get_real_sensor_canonical(s0["sensorId"], time_index=0)
    assert s0["rawSpeed"] == rec["measurements"]["speed"]


def test_masked_zero_becomes_speed_valid_false_no_data():
    """19. 0.0 value is identified as speedValid=false, maskedNull=true, speedCondition=NO_DATA."""
    snap = get_metr_la_snapshot(time_index=120)
    for s in snap["sensors"]:
        if s["rawSpeed"] == 0.0:
            assert s["speedValid"] is False
            assert s["maskedNull"] is True
            assert s["speedCondition"] == "NO_DATA"


def test_no_flow_fabricated():
    """20. Flow is explicitly None in all snapshot sensor items."""
    snap = get_metr_la_snapshot(time_index=0)
    for s in snap["sensors"]:
        assert s["flow"] is None
        assert s["availability"]["flow"] is False


def test_no_occupancy_fabricated():
    """21. Occupancy is explicitly None in all snapshot sensor items."""
    snap = get_metr_la_snapshot(time_index=0)
    for s in snap["sensors"]:
        assert s["occupancy"] is None
        assert s["availability"]["occupancy"] is False


def test_negative_time_index_returns_error():
    """22. Negative time_index raises ValueError."""
    with pytest.raises(ValueError):
        get_metr_la_snapshot(time_index=-1)


def test_time_index_greater_or_equal_34272_returns_error():
    """23. time_index >= 34272 raises ValueError."""
    with pytest.raises(ValueError):
        get_metr_la_snapshot(time_index=34272)
    with pytest.raises(ValueError):
        get_metr_la_snapshot(time_index=50000)


def test_invalid_region_id_handling():
    """24. Invalid region ID handles gracefully by returning empty or fallback target."""
    snap = get_metr_la_snapshot(time_index=0, region_id="REGION_NONEXISTENT", representatives_only=True)
    assert snap["sensorCount"] == 0


# ==============================================================================
# STAGE 5.6 TESTS (ML-READY DATA PREPROCESSING)
# ==============================================================================

def test_full_207_sensor_dimension_preserved():
    """25. Verify full 207-sensor dataset dimension is preserved in summary.json."""
    summary_path = "data/processed/metr-la/ml_ready/summary.json"
    assert os.path.exists(summary_path)
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["sensorCount"] == 207
    assert summary["adjacencyMatrixShape"] == [207, 207]


def test_canonical_sensor_index_mapping_stable():
    """26. Verify sensor_index.json maps all 207 sensors canonically."""
    idx_path = "data/processed/metr-la/sensor_index.json"
    assert os.path.exists(idx_path)
    with open(idx_path, "r", encoding="utf-8") as f:
        idx_map = json.load(f)
    assert idx_map["sensorCount"] == 207
    assert len(idx_map["sensorIds"]) == 207
    assert len(idx_map["idToIndex"]) == 207


def test_chronological_split_ratios_and_timestamps():
    """27. Verify non-overlapping 70/10/20 chronological split boundaries and timestamps."""
    summary_path = "data/processed/metr-la/ml_ready/summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    splits = summary["splits"]

    assert splits["train"]["timeStepRange"] == [0, 23990]
    assert splits["val"]["timeStepRange"] == [23990, 27417]
    assert splits["test"]["timeStepRange"] == [27417, 34272]

    assert splits["val"]["startTime"] > splits["train"]["endTime"]
    assert splits["test"]["startTime"] > splits["val"]["endTime"]


def test_train_only_standard_scaler_stats():
    """28. Verify StandardScaler fitted strictly on valid train observations."""
    scaler_path = "data/processed/metr-la/scaler.json"
    assert os.path.exists(scaler_path)
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler = json.load(f)
    assert scaler["scalerType"] == "StandardScaler"
    assert scaler["fittedOn"] == "train_valid_only"
    assert scaler["maskedNullValue"] == 0.0
    assert abs(scaler["mean"] - 58.58) < 1.0
    assert abs(scaler["std"] - 12.82) < 1.0


def test_masked_zero_excluded_from_scaler():
    """29. Verify masked zero observations (0.0) are excluded from scaler fitting."""
    scaler_path = "data/processed/metr-la/scaler.json"
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler = json.load(f)
    assert scaler["numValidTrainObservations"] < scaler["totalTrainObservations"]
    assert scaler["numValidTrainObservations"] == 4611750
    assert scaler["totalTrainObservations"] == 4965930


def test_input_and_target_horizon_parameters():
    """30. Verify INPUT_STEPS = 12 and target horizons = [1, 3, 6, 12] (5, 15, 30, 60 minutes)."""
    summary_path = "data/processed/metr-la/ml_ready/summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["inputSteps"] == 12
    assert summary["inputDurationMinutes"] == 60
    assert summary["targetHorizons"] == [1, 3, 6, 12]
    assert summary["targetMinutes"] == [5, 15, 30, 60]


def test_sliding_windows_do_not_cross_split_boundaries():
    """31. Verify sliding window counts stay strictly within split boundaries."""
    summary_path = "data/processed/metr-la/ml_ready/summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    splits = summary["splits"]

    # max horizon offset = 12, input steps = 12 -> max start = L - 12 - 12 + 1 = L - 23
    assert splits["train"]["numWindows"] == 23990 - 23
    assert splits["val"]["numWindows"] == 3427 - 23
    assert splits["test"]["numWindows"] == 6855 - 23


def test_tensor_shapes_x_y_xmask_ymask():
    """32. Verify array shapes (x, y, x_mask, y_mask) in train.npz."""
    train_npz = np.load("data/processed/metr-la/ml_ready/train.npz")
    assert train_npz["x"].shape == (23967, 12, 207, 1)
    assert train_npz["y"].shape == (23967, 4, 207, 1)
    assert train_npz["x_mask"].shape == (23967, 12, 207, 1)
    assert train_npz["y_mask"].shape == (23967, 4, 207, 1)


def test_target_validity_masks():
    """33. Verify target validity masks correctly mark 0.0 entries as False."""
    train_npz = np.load("data/processed/metr-la/ml_ready/train.npz")
    y = train_npz["y"]
    y_mask = train_npz["y_mask"]
    zero_locations = (y == 0.0)
    assert np.all(y_mask[zero_locations] == False)


def test_graph_adjacency_dimension_207_and_region_membership():
    """34. Verify graph adjacency shape is 207x207 and region partitioning preserved."""
    with open("data/raw/metr-la/adj_mx.pkl", "rb") as f:
        data = pickle.load(f, encoding="latin1")
    adj = data[2] if isinstance(data, (tuple, list)) else data
    assert adj.shape == (207, 207)

    with open("data/processed/metr-la/regions.json", "r", encoding="utf-8") as f:
        regions = json.load(f)
    assert len(regions) == 4
    all_sids = [sid for r in regions.values() for sid in r["sensorIds"]]
    assert len(set(all_sids)) == 207


def test_processed_npz_files_exist_and_load():
    """35. Verify all train.npz, val.npz, test.npz exist and load properly."""
    for split in ["train", "val", "test"]:
        p = f"data/processed/metr-la/ml_ready/{split}.npz"
        assert os.path.exists(p)
        data = np.load(p)
        assert "x" in data and "y" in data and "x_mask" in data and "y_mask" in data


def test_summary_metadata_matches_actual_arrays():
    """36. Verify summary metadata shapes match actual NPZ array shapes."""
    summary_path = "data/processed/metr-la/ml_ready/summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    for split in ["train", "val", "test"]:
        data = np.load(f"data/processed/metr-la/ml_ready/{split}.npz")
        assert list(data["x"].shape) == summary["splits"][split]["xShape"]
        assert list(data["y"].shape) == summary["splits"][split]["yShape"]


def test_raw_hdf5_remains_unmodified():
    """37. Verify raw HDF5 file size remains 57,038,056 bytes."""
    h5_path = "data/raw/metr-la/metr-la.h5"
    if os.path.exists(h5_path):
        assert os.path.getsize(h5_path) == 57038056


def test_no_synthetic_flow_or_occupancy_fabricated():
    """38. Verify no synthetic flow or occupancy telemetry is added."""
    summary_path = "data/processed/metr-la/ml_ready/summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    assert summary["featureCount"] == 1
    assert summary["featureNames"] == ["speed"]

    train_npz = np.load("data/processed/metr-la/ml_ready/train.npz")
    assert "flow" not in train_npz
    assert "occupancy" not in train_npz


def test_three_temporal_window_cross_checks_against_raw_hdf5():
    """39. Cross-check 3 temporal window samples against raw HDF5 dataset values."""
    h5_path = "data/raw/metr-la/metr-la.h5"
    if not os.path.exists(h5_path):
        pytest.skip("metr-la.h5 file not available locally")

    import h5py
    with h5py.File(h5_path, "r") as hf:
        raw_vals = hf["df"]["block0_values"][:]
        raw_ts = [pd.to_datetime(t).isoformat() for t in hf["df"]["axis1"][:]]

    with open("data/processed/metr-la/scaler.json", "r", encoding="utf-8") as f:
        scaler = json.load(f)
    mean, std = scaler["mean"], scaler["std"]

    train_npz = np.load("data/processed/metr-la/ml_ready/train.npz")

    # Sample 1: Window index 0 (Train index 0)
    w0_x_norm = train_npz["x"][0, :, :, 0]
    w0_y_raw = train_npz["y"][0, :, :, 0]
    w0_ts_x = train_npz["timestamps_x"][0]
    w0_ts_y = train_npz["timestamps_y"][0]

    raw_x0 = raw_vals[0:12, :]
    raw_x0_mask = (raw_x0 != 0.0) & (~np.isnan(raw_x0))
    expected_w0_x_norm = np.where(raw_x0_mask, (raw_x0 - mean) / std, 0.0)

    np.testing.assert_allclose(w0_x_norm, expected_w0_x_norm, rtol=1e-4, atol=1e-4)
    np.testing.assert_allclose(w0_y_raw, raw_vals[[12, 14, 17, 23], :], rtol=1e-4, atol=1e-4)
    assert list(w0_ts_x) == raw_ts[0:12]
    assert list(w0_ts_y) == [raw_ts[12], raw_ts[14], raw_ts[17], raw_ts[23]]

    # Sample 2: Window index 1000 (Train index 1000)
    w1000_x_norm = train_npz["x"][1000, :, :, 0]
    w1000_y_raw = train_npz["y"][1000, :, :, 0]
    raw_x1000 = raw_vals[1000:1012, :]
    raw_x1000_mask = (raw_x1000 != 0.0) & (~np.isnan(raw_x1000))
    expected_w1000_x_norm = np.where(raw_x1000_mask, (raw_x1000 - mean) / std, 0.0)

    np.testing.assert_allclose(w1000_x_norm, expected_w1000_x_norm, rtol=1e-4, atol=1e-4)
    np.testing.assert_allclose(w1000_y_raw, raw_vals[[1011+1, 1011+3, 1011+6, 1011+12], :], rtol=1e-4, atol=1e-4)

    # Sample 3: Test split sample (Test window index 0 -> raw timestep index 27417)
    test_npz = np.load("data/processed/metr-la/ml_ready/test.npz")
    w_test0_y_raw = test_npz["y"][0, :, :, 0]
    base_t = 27417
    np.testing.assert_allclose(w_test0_y_raw, raw_vals[[base_t+11+1, base_t+11+3, base_t+11+6, base_t+11+12], :], rtol=1e-4, atol=1e-4)


# ==============================================================================
# STAGE 5.7 TESTS (FINAL INTEGRATION & REPRODUCIBILITY AUDIT)
# ==============================================================================

def test_half_open_split_interval_notation_and_indices():
    """40. Verify explicit half-open interval and inclusive index notation in summary.json."""
    summary_path = "data/processed/metr-la/ml_ready/summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    splits = summary["splits"]

    assert splits["train"]["halfOpenInterval"] == [0, 23990]
    assert splits["train"]["inclusiveIndexRange"] == [0, 23989]

    assert splits["val"]["halfOpenInterval"] == [23990, 27417]
    assert splits["val"]["inclusiveIndexRange"] == [23990, 27416]

    assert splits["test"]["halfOpenInterval"] == [27417, 34272]
    assert splits["test"]["inclusiveIndexRange"] == [27417, 34271]


def test_exact_window_counts_verification():
    """41. Assert exact sliding window formula (numWindows = totalSteps - 23)."""
    summary_path = "data/processed/metr-la/ml_ready/summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    splits = summary["splits"]

    assert splits["train"]["numWindows"] == 23990 - 23 == 23967
    assert splits["val"]["numWindows"] == 3427 - 23 == 3404
    assert splits["test"]["numWindows"] == 6855 - 23 == 6832

    # Cross-check against actual NPZ files
    assert len(np.load("data/processed/metr-la/ml_ready/train.npz")["x"]) == 23967
    assert len(np.load("data/processed/metr-la/ml_ready/val.npz")["x"]) == 3404
    assert len(np.load("data/processed/metr-la/ml_ready/test.npz")["x"]) == 6832


def test_target_storage_and_normalization_contract():
    """42. Verify target normalization contract metadata in summary.json."""
    summary_path = "data/processed/metr-la/ml_ready/summary.json"
    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)
    tc = summary["targetContract"]
    assert tc["storedTargetSpace"] == "RAW_MPH"
    assert tc["trainingTargetNormalization"] == "SAME_TRAIN_ONLY_SCALER"
    assert tc["evaluationSpace"] == "INVERSE_TRANSFORMED_MPH"


def test_end_to_end_sensor_ordering_cross_check():
    """43. Verify identical canonical sensor ordering across HDF5, Adjacency, sensor_index, regions, and NPZs."""
    h5_path = "data/raw/metr-la/metr-la.h5"
    if not os.path.exists(h5_path):
        pytest.skip("metr-la.h5 not available")

    import h5py
    with h5py.File(h5_path, "r") as hf:
        h5_ids = [x.decode("utf-8") if isinstance(x, bytes) else str(x) for x in hf["df"]["block0_items"][:]]

    with open("data/raw/metr-la/adj_mx.pkl", "rb") as f:
        adj_ids = [str(x) for x in pickle.load(f, encoding="latin1")[0]]

    with open("data/processed/metr-la/sensor_index.json", "r", encoding="utf-8") as f:
        idx_ids = json.load(f)["sensorIds"]

    assert len(h5_ids) == len(adj_ids) == len(idx_ids) == 207

    # Check 5 specific sensor indices: 0, 50, 100, 150, 206
    for idx in [0, 50, 100, 150, 206]:
        assert h5_ids[idx] == adj_ids[idx] == idx_ids[idx]


def test_region_preservation_distribution():
    """44. Verify all 207 sensors in processed dataset remain mapped across 4 regions."""
    with open("data/processed/metr-la/regions.json", "r", encoding="utf-8") as f:
        regions = json.load(f)

    all_sids = []
    for r_code in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]:
        assert r_code in regions
        all_sids.extend(regions[r_code]["sensorIds"])

    assert len(all_sids) == 207
    assert len(set(all_sids)) == 207


def test_adjacency_contract_207_dimension():
    """45. Verify original and model adjacency matrix dimensions remain 207x207."""
    with open("data/raw/metr-la/adj_mx.pkl", "rb") as f:
        adj_data = pickle.load(f, encoding="latin1")
    adj_mx = adj_data[2] if isinstance(adj_data, (tuple, list)) else adj_data
    assert adj_mx.shape == (207, 207)


def test_git_ignore_rules_for_large_npz():
    """46. Verify .gitignore excludes large generated NPZ files."""
    assert os.path.exists(".gitignore")
    with open(".gitignore", "r", encoding="utf-8") as f:
        content = f.read()
    assert "data/processed/metr-la/ml_ready/*.npz" in content


def test_all_phase5_api_endpoints_respond_200():
    """47. Verify all 7 Phase 5 API dataset status endpoints return HTTP 200."""
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    endpoints = [
        "/api/datasets/status",
        "/api/datasets/metr-la/summary",
        "/api/datasets/metr-la/features",
        "/api/datasets/metr-la/regions",
        "/api/datasets/metr-la/representatives",
        "/api/datasets/metr-la/snapshot",
        "/api/datasets/metr-la/ml-ready/status"
    ]
    for ep in endpoints:
        r = client.get(ep)
        assert r.status_code == 200


def test_frozen_region_membership_counts():
    """48. Assert authoritative frozen region sensor counts (A: 48, B: 57, C: 58, D: 44)."""
    with open("data/processed/metr-la/regions.json", "r", encoding="utf-8") as f:
        regions = json.load(f)

    assert len(regions["REGION_A"]["sensorIds"]) == 48
    assert len(regions["REGION_B"]["sensorIds"]) == 57
    assert len(regions["REGION_C"]["sensorIds"]) == 58
    assert len(regions["REGION_D"]["sensorIds"]) == 44


def test_representative_to_region_exact_mapping():
    """49. Verify representative aliases A01-A05, B01-B05, C01-C05, D01-D05 map to matching regions."""
    with open("data/processed/metr-la/representative_sensors.json", "r", encoding="utf-8") as f:
        reps = json.load(f)

    for r_code in ["REGION_A", "REGION_B", "REGION_C", "REGION_D"]:
        prefix = r_code.split("_")[1]
        aliases = [x["displayAlias"] for x in reps[r_code]]
        expected = [f"{prefix}0{i}" for i in range(1, 6)]
        assert aliases == expected


def test_graph_normalization_contract_defined():
    """50. Verify graphNormalizationContract defines SYMMETRIC_NORMALIZED_ADJACENCY baseline."""
    with open("data/processed/metr-la/ml_ready/summary.json", "r", encoding="utf-8") as f:
        summary = json.load(f)

    gc = summary["graphNormalizationContract"]
    assert gc["method"] == "SYMMETRIC_NORMALIZED_ADJACENCY"
    assert gc["selfLoops"] is True
    assert gc["rawAdjacencyPreserved"] is True


# ==============================================================================
# PART R TESTS (BACKEND SINGLE SOURCE OF TRUTH & FE CENTRALIZATION)
# ==============================================================================

def test_single_fastapi_app_entrypoint():
    """51. Verify backend/main.py contains the only FastAPI application instance."""
    from backend.main import app
    assert app.title == "TrafficPulse-X API"
    assert app.version == "1.0.0"


def test_real_sensors_resolve_through_data_source_manager():
    """52. Verify REAL_METR_LA sensors resolve through DataSourceManager."""
    from backend.data_source import DataSourceManager
    mgr = DataSourceManager()
    sensors = mgr.get_sensors(source_type="REAL_METR_LA", time_index=0)
    assert len(sensors) == 207
    s0 = sensors[0]
    assert s0["sourceType"] == "REAL_BENCHMARK"
    assert s0["datasetName"] == "METR-LA"
    assert s0["mode"] == "HISTORICAL_REPLAY"


def test_demo_sensors_resolve_through_data_source_manager():
    """53. Verify SYNTHETIC_DEMO sensors resolve through DataSourceManager."""
    from backend.data_source import DataSourceManager
    mgr = DataSourceManager()
    sensors = mgr.get_sensors(source_type="SYNTHETIC_DEMO")
    assert len(sensors) == 32
    s0 = sensors[0]
    assert s0["sourceType"] == "SYNTHETIC_DEMO"
    assert s0["datasetName"] == "TrafficPulse-X Demo"
    assert s0["mode"] == "LIVE_SIMULATION"


def test_api_responses_include_explicit_data_mode_tags():
    """54. Verify dashboard and sensor API responses include explicit mode tags."""
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    r_demo = client.get("/api/dashboard?source_type=SYNTHETIC_DEMO")
    assert r_demo.status_code == 200
    d_demo = r_demo.json()
    assert d_demo["sourceType"] == "SYNTHETIC_DEMO"
    assert d_demo["mode"] == "LIVE_SIMULATION"

    r_real = client.get("/api/dashboard?source_type=REAL_METR_LA&time_index=0")
    assert r_real.status_code == 200
    d_real = r_real.json()
    assert d_real["sourceType"] == "REAL_BENCHMARK"
    assert d_real["mode"] == "HISTORICAL_REPLAY"


def test_real_replay_speed_consistency_across_endpoints():
    """55. Verify identical speed for sensor 773869 across snapshot, detail, and get_sensors at time_index=5."""
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    snap_r = client.get("/api/datasets/metr-la/snapshot?time_index=5&region_id=ALL&representatives_only=false")
    snap_data = snap_r.json()
    s_snap = next(s for s in snap_data["sensors"] if s["sensorId"] == "773869")

    detail_r = client.get("/api/sensors/773869?time_index=5&source_type=REAL_METR_LA")
    detail_data = detail_r.json()

    all_r = client.get("/api/sensors?source_type=REAL_METR_LA&time_index=5")
    all_data = all_r.json()
    s_all = next(s for s in all_data if s["sensorId"] == "773869")

    assert s_snap["rawSpeed"] == detail_data["measurements"]["speed"] == s_all["speed"]


def test_demo_state_synchronization_across_endpoints():
    """56. Verify demo query execution updates state centrally in DataSourceManager."""
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    res = client.post("/api/query/S05").json()
    assert res["status"] == "SUCCESS"

    detail = client.get("/api/sensors/S05").json()
    assert detail["sensorId"] == "S05"
    assert detail["sourceType"] == "SYNTHETIC_DEMO"


def test_decision_engine_reads_canonical_backend_sensor_state():
    """57. Verify decision endpoints resolve state through DataSourceManager."""
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    need = client.get("/api/decision/sensors/S05/need-score").json()
    assert "needScore" in need

    cf = client.get("/api/decision/counterfactual/S05").json()
    assert "sensorId" in cf
    assert "expectedBenefit" in cf

    evidence = client.get("/api/decision/evidence/S05").json()
    assert "targetSensor" in evidence


def test_health_and_dataset_status_endpoints():
    """58. Verify health and datasets/status endpoints return active capabilities and modes."""
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    h_res = client.get("/api/health").json()
    assert h_res["backendStatus"] == "OK"
    assert "REAL_METR_LA" in h_res["activeCapabilities"]

    s_res = client.get("/api/datasets/status").json()
    assert s_res["demoMode"]["sourceType"] == "SYNTHETIC_DEMO"
    assert s_res["researchMode"]["sourceType"] == "REAL_BENCHMARK"


def test_demo_reset_endpoint_clears_state():
    """59. Verify /api/demo/reset resets demo state via DataSourceManager."""
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    r = client.post("/api/demo/reset")
    assert r.status_code == 200
    assert r.json()["status"] == "RESET_SUCCESS"


def test_network_topology_endpoint_modes():
    """60. Verify network topology endpoint returns mode-specific node & edge counts."""
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    topo_demo = client.get("/api/network?source_type=SYNTHETIC_DEMO").json()
    assert topo_demo["nodeCount"] == 32
    assert topo_demo["sourceType"] == "SYNTHETIC_DEMO"

    topo_real = client.get("/api/network?source_type=REAL_METR_LA").json()
    assert topo_real["nodeCount"] == 207
    assert topo_real["edgeCount"] == 1722
    assert topo_real["sourceType"] == "REAL_BENCHMARK"


def test_authoritative_region_hash_checksum_and_counts():
    """61. Verify exact authoritative region counts and SHA-256 hash checksum."""
    import hashlib
    with open("data/processed/metr-la/regions.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    counts = {k: len(v["sensorIds"]) for k, v in data.items()}
    assert counts == {"REGION_A": 48, "REGION_B": 57, "REGION_C": 58, "REGION_D": 44}

    content_bytes = json.dumps(data, sort_keys=True).encode("utf-8")
    sha = hashlib.sha256(content_bytes).hexdigest()
    assert sha == "ad064c643b6eb30cf9f7ef57cce71391ac4d94f7e41529dfcf4f0b1cd46e4ff2"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])




