"""
TrafficPulse-X Prediction Intelligence Package.
Exposes frozen Graph+LSTM spatio-temporal inference service and FastAPI schemas.
"""

from backend.prediction.service import PredictionService, get_prediction_service

__all__ = ["PredictionService", "get_prediction_service"]
