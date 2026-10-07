"""
FastAPI Pydantic Response Schemas for Prediction Intelligence API.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class PredictionStatusResponse(BaseModel):
    modelName: str = "Graph+LSTM"
    modelType: str = "SpatialGraphLSTM"
    checkpointReady: bool = True
    checkpointPath: str
    device: str
    horizons: List[str] = ["+5 min", "+15 min", "+30 min", "+60 min"]
    parameterCount: int
    modelVersion: str = "1.0.0"
    scalerMean: float = 58.584258
    scalerStd: float = 12.822883


class HorizonForecast(BaseModel):
    horizonMinutes: int
    horizonLabel: str
    predictedSpeedMph: float
    actualSpeedMph: Optional[float] = None
    absoluteErrorMph: Optional[float] = None


class SensorForecastItem(BaseModel):
    sensorId: str
    regionId: str
    latitude: float
    longitude: float
    currentSpeedMph: Optional[float] = None
    predictions: List[HorizonForecast]


class ForecastResponse(BaseModel):
    source: str = "REAL_METR_LA"
    mode: str = "HISTORICAL_REPLAY"
    model: str = "Graph+LSTM"
    timeIndex: int
    inputEndTimestamp: str
    sensorCount: int = 207
    sensor: Optional[SensorForecastItem] = None
    regionId: Optional[str] = None
    representativeForecasts: Optional[List[SensorForecastItem]] = None


class PredictionMetricsResponse(BaseModel):
    stage: str = "6.6"
    primaryModel: str = "Graph+LSTM"
    overallMetrics: Dict[str, Any]
    byHorizon: Dict[str, Any]
    byRegion: Dict[str, Any]
    scientificClaims: Dict[str, str]


class PredictionModelsResponse(BaseModel):
    stage: str = "6.6"
    overallWinner: str = "Graph+LSTM"
    horizon60Winner: str = "Historical Average"
    modelsOverall: Dict[str, Any]
    horizonWinners: Dict[str, Any]
