"""
Calibrated Residual Uncertainty & Prediction Confidence Module.
Derives forecast uncertainty from frozen validation residual statistics on val.npz
across horizons (+5, +15, +30, +60 min) and regions (REGION_A, B, C, D).
"""

from typing import Dict, Any, Tuple

# Calibrated residual MAE statistics (mph) derived strictly from val.npz validation set
VAL_HORIZON_RESIDUALS_MAE = {
    5: 2.1868,
    15: 2.7245,
    30: 3.2822,
    60: 4.1364
}

VAL_REGION_SCALES = {
    "REGION_A": 0.70,  # 2.4094 / 3.4378
    "REGION_B": 1.14,  # 3.9294 / 3.4378
    "REGION_C": 0.99,  # 3.3897 / 3.4378
    "REGION_D": 1.17   # 4.0069 / 3.4378
}


def calculate_prediction_uncertainty(horizon_minutes: int = 5, region_id: str = "REGION_C") -> float:
    """
    Returns empirical calibrated residual uncertainty (in mph) for a given horizon and region.
    Uses frozen validation residual statistics without test set leakage.
    """
    base_unc = VAL_HORIZON_RESIDUALS_MAE.get(horizon_minutes, 3.2822)
    reg_scale = VAL_REGION_SCALES.get(region_id.upper() if region_id else "REGION_C", 1.0)
    uncertainty_mph = round(base_unc * reg_scale, 2)
    return uncertainty_mph


def derive_confidence_level(uncertainty_mph: float) -> str:
    """
    Derives interpretable confidence level label from numeric uncertainty based on validation residual quantiles.
    Quantile Thresholds:
    - uncertainty <= 2.50 mph: HIGH (within +5 min validation P75 quantile)
    - 2.50 mph < uncertainty <= 3.81 mph: MEDIUM (within +60 min validation P75 quantile)
    - uncertainty > 3.81 mph: LOW
    """
    if uncertainty_mph <= 2.50:
        return "HIGH"
    elif uncertainty_mph <= 3.81:
        return "MEDIUM"
    else:
        return "LOW"


def get_prediction_confidence_contract(
    predicted_speed_mph: float,
    horizon_minutes: int = 5,
    region_id: str = "REGION_C"
) -> Dict[str, Any]:
    """
    Constructs the prediction confidence contract dictionary.
    """
    unc_mph = calculate_prediction_uncertainty(horizon_minutes=horizon_minutes, region_id=region_id)
    conf_level = derive_confidence_level(unc_mph)

    return {
        "horizonMinutes": horizon_minutes,
        "predictedSpeedMph": round(predicted_speed_mph, 2),
        "uncertaintyMph": unc_mph,
        "confidenceLevel": conf_level,
        "uncertaintyNormalized": round(min(1.0, unc_mph / 6.0), 2),
        "calibrationSource": "val.npz validation residual distribution"
    }
