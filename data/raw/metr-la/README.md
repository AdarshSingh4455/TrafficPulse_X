# METR-LA Raw Dataset Instructions

This directory contains raw dataset files for the **METR-LA** (Los Angeles County Highway Traffic Benchmark Dataset).

## Dataset Overview
- **Location**: Los Angeles County Highway System loop detectors
- **Sensors**: 207 spatial traffic sensors
- **Timeframe**: March 1, 2012 to June 30, 2012 (4 months)
- **Frequency**: 5-minute intervals (34,272 time steps)
- **Features**: Traffic speed (mph) measurements

## Files Included in Repository
- `adj_mx.pkl`: Pickled tuple containing `(sensor_ids, sensor_id_to_ind, adj_mx)` representing the 207x207 spatial graph adjacency matrix.
- `graph_sensor_ids.txt`: Comma-separated list of 207 sensor IDs matching the adjacency matrix order.

## Instructions to Add Measurement File (`metr-la.h5`)
If `metr-la.h5` is not automatically present, download or place the time-series measurement file into this folder with any of the following accepted names:
1. `metr-la.h5` or `METR-LA.h5` (HDF5 format containing dataset key `df` or matrix shape `(34272, 207)`)
2. `metr-la.npz` (NumPy archive containing array `x` or `data` of shape `(34272, 207)`)
3. `metr-la.pkl` (Pandas DataFrame or NumPy array)
4. `vel.csv` or `metr-la.csv` (CSV file with timestamp index and 207 sensor ID columns)

## Download Sources
You can acquire `metr-la.h5` from:
- DCRNN GitHub repository dataset releases: [https://github.com/Li-Yaguang/DCRNN](https://github.com/Li-Yaguang/DCRNN)
- Zenodo dataset repository: [https://zenodo.org/record/4269677](https://zenodo.org/record/4269677)
- STGCN / Graph WaveNet dataset repositories

Once placed in `data/raw/metr-la/`, restart or trigger dataset inspection (`GET /api/datasets/metr-la/summary`) to update `data/processed/metr-la/metadata.json` to `READY` status.
