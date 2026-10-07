# Dynamic communication & telemetry state tracker for METR-LA sensors

import time
from typing import Dict, Any, List, Optional


class SensorStateManager:
    """
    Tracks dynamic communication state, query freshness, information debt,
    and historical speed replay windows for real METR-LA sensors.
    """
    def __init__(self, initial_sensors: Optional[List[Dict[str, Any]]] = None):
        self.states: Dict[str, Dict[str, Any]] = {}
        self.recent_decisions: List[Dict[str, Any]] = []
        if initial_sensors:
            self.init_from_sensors(initial_sensors)

    def init_from_sensors(self, sensors: List[Dict[str, Any]]):
        current_time = time.time()
        self.states = {}
        for s in sensors:
            sid = s.get("sensorId", s.get("id"))
            if not sid:
                continue

            speed_val = s.get("measurements", {}).get("speed") if "measurements" in s else s.get("speed")
            valid = s.get("validity", {}).get("speedValid", True) if "validity" in s else s.get("speedValid", True)

            self.states[sid] = {
                "id": sid,
                "sensorId": sid,
                "active": True,
                "commState": "NORMAL",
                "speed": speed_val,
                "speedValid": valid,
                "dataQuality": s.get("dataQuality", 0.98),
                "lastDetailedQueryAt": current_time - (60 if sid in ["773869", "767541"] else 300),
                "consecutiveSkipCount": 0 if sid in ["773869", "767541"] else 2,
                "recentSpeeds": [speed_val] if speed_val is not None else [],
                "wakeUpReason": None
            }
        self.recent_decisions = []

    def update_sensor_telemetry(self, sensor_id: str, speed: Optional[float], valid: bool):
        if sensor_id not in self.states:
            return

        st = self.states[sensor_id]
        st["speed"] = speed
        st["speedValid"] = valid
        if speed is not None and speed > 0.0:
            st["recentSpeeds"].append(speed)
            if len(st["recentSpeeds"]) > 8:
                st["recentSpeeds"].pop(0)

    def get_state(self, sensor_id: str) -> Dict[str, Any]:
        return self.states.get(sensor_id, {})

    def record_query(self, sensor_id: str, reason: str, benefit: float, bytes_used: int) -> Dict[str, Any]:
        st = self.states.get(sensor_id)
        if not st:
            return {}

        now = time.time()
        prev_state = st["commState"]
        st["commState"] = "QUERIED"
        st["lastDetailedQueryAt"] = now
        st["consecutiveSkipCount"] = 0
        st["wakeUpReason"] = None

        receipt = {
            "sensorId": sensor_id,
            "timestamp": time.strftime("%H:%M:%S", time.localtime(now)),
            "bytesUsed": f"{bytes_used / 1024:.1f} KB" if bytes_used >= 1024 else f"{bytes_used} B",
            "reason": reason,
            "benefitPercent": f"{benefit * 100:.1f}%",
            "previousState": prev_state,
            "newState": "QUERIED"
        }

        self.recent_decisions.insert(0, {
            "id": f"DEC-{len(self.recent_decisions) + 1:02d}",
            "time": receipt["timestamp"],
            "sensor": sensor_id,
            "decision": "QUERY",
            "benefit": receipt["benefitPercent"],
            "reason": reason
        })
        if len(self.recent_decisions) > 15:
            self.recent_decisions.pop()

        return receipt

    def record_skip(self, sensor_id: str, reason: str):
        st = self.states.get(sensor_id)
        if not st:
            return

        st["consecutiveSkipCount"] += 1
        now = time.time()
        self.recent_decisions.insert(0, {
            "id": f"DEC-{len(self.recent_decisions) + 1:02d}",
            "time": time.strftime("%H:%M:%S", time.localtime(now)),
            "sensor": sensor_id,
            "decision": "SKIP",
            "benefit": "0%",
            "reason": reason
        })
        if len(self.recent_decisions) > 15:
            self.recent_decisions.pop()

    def reset(self):
        current_time = time.time()
        for sid, st in self.states.items():
            st["commState"] = "NORMAL"
            st["lastDetailedQueryAt"] = current_time - 300
            st["consecutiveSkipCount"] = 2
            st["wakeUpReason"] = None
        self.recent_decisions = []
