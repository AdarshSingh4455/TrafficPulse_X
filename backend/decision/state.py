# Dynamic communication & telemetry state tracker for sensors

import time
from typing import Dict, Any, List

class SensorStateManager:
    def __init__(self, initial_sensors: List[Dict[str, Any]]):
        self.initial_sensors = initial_sensors
        self.states: Dict[str, Dict[str, Any]] = {}
        self.recent_decisions: List[Dict[str, Any]] = []
        self.reset()

    def reset(self):
        current_time = time.time()
        self.states = {}
        for s in self.initial_sensors:
            sid = s["id"]
            is_active = s.get("active", True)
            flow = s.get("flow", 0)
            
            # Baseline state
            self.states[sid] = {
                "id": sid,
                "active": is_active,
                "commState": "NORMAL" if is_active else "INACTIVE",
                "flow": flow,
                "speed": s.get("speed", 0),
                "occupancy": s.get("occupancy", 0),
                "health": s.get("health", 0.95),
                "lastHeartbeatAt": current_time - 15,
                "lastDetailedQueryAt": current_time - (60 if sid in ["S05", "S08"] else 300),
                "consecutiveSkipCount": 0 if sid in ["S05", "S08"] else 2,
                "recentFlows": [max(50, flow - 60), max(50, flow - 30), max(50, flow - 10), flow],
                "wakeUpReason": None
            }
        self.recent_decisions = []

    def get_state(self, sensor_id: str) -> Dict[str, Any]:
        return self.states.get(sensor_id, {})

    def record_heartbeat(self, sensor_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        st = self.states.get(sensor_id)
        if not st or not st["active"]:
            return {}

        now = time.time()
        st["lastHeartbeatAt"] = now

        if "flow" in payload:
            st["flow"] = payload["flow"]
            st["recentFlows"].append(payload["flow"])
            if len(st["recentFlows"]) > 8:
                st["recentFlows"].pop(0)

        if "speed" in payload:
            st["speed"] = payload["speed"]
        if "occupancy" in payload:
            st["occupancy"] = payload["occupancy"]
        if "health" in payload:
            st["health"] = payload["health"]

        return st

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
        if not st or not st["active"]:
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
