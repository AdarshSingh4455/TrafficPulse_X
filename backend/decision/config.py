# TrafficPulse-X Centralized Decision Engine Configuration

NEED_WEIGHTS = {
    "spatialInfluence": 0.15,
    "uncertaintyProxy": 0.20,
    "spatialSpeedDisagreement": 0.20,
    "trafficDrift": 0.15,
    "freshness": 0.10,
    "informationDebt": 0.10,
    "coverageNeed": 0.10,
    "sensorHealth": 0.05,
    "redundancyPenalty": 0.05
}

DRIFT_THRESHOLD = 0.35
SPATIAL_DISAGREEMENT_THRESHOLD = 0.30
WAKE_UP_THRESHOLD = 0.65
MIN_QUERY_BENEFIT = 0.05
CONFIDENCE_THRESHOLD = 0.85
UNCERTAINTY_THRESHOLD = 0.15
MAX_EVIDENCE_QUERIES = 4
