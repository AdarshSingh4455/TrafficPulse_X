# TrafficPulse-X: Real Sensor Network Graph Structure G = (V, E, W)

from collections import deque
from typing import Dict, List, Any, Optional, Set


class SensorGraph:
    """
    Sensor Graph Representation for real METR-LA benchmark network.
    Supports adjacency lookups, k-hop neighbor searches, spatial speed consistency evaluation,
    and network topology summaries.
    """
    def __init__(self, sensors: List[Dict[str, Any]], edges: Optional[List[Dict[str, Any]]] = None, neighbors_map: Optional[Dict[str, List[str]]] = None):
        self.sensors = {s["sensorId"] if "sensorId" in s else s["id"]: s for s in sensors}
        self.adj: Dict[str, List[str]] = {sid: [] for sid in self.sensors}
        self.edges = edges or []

        if neighbors_map:
            for sid, nbrs in neighbors_map.items():
                if sid in self.adj:
                    self.adj[sid] = [n for n in nbrs if n in self.sensors]
        elif edges:
            for e in edges:
                u, v = e["from"], e["to"]
                if u in self.adj and v in self.sensors:
                    if v not in self.adj[u]:
                        self.adj[u].append(v)
                if v in self.adj and u in self.sensors:
                    if u not in self.adj[v]:
                        self.adj[v].append(u)

    def get_neighbors(self, sensor_id: str, k_hops: int = 1) -> List[str]:
        if sensor_id not in self.sensors:
            return []

        visited: Set[str] = {sensor_id}
        queue = deque([(sensor_id, 0)])
        result: List[str] = []

        while queue:
            curr, depth = queue.popleft()
            if depth < k_hops:
                nbrs = self.adj.get(curr, [])
                for nbr in nbrs:
                    if nbr not in visited and nbr in self.sensors:
                        visited.add(nbr)
                        queue.append((nbr, depth + 1))
                        result.append(nbr)
        return result

    def get_spatial_speed_consistency(self, from_id: str, to_id: str) -> Optional[Dict[str, Any]]:
        """
        Evaluates spatial speed consistency between adjacent real sensors.
        Identifies spatial speed anomalies (e.g. sharp speed drops across adjacent road segments).
        """
        if from_id not in self.sensors or to_id not in self.sensors:
            return None

        from_s = self.sensors[from_id]
        to_s = self.sensors[to_id]

        from_speed = from_s.get("measurements", {}).get("speed") if "measurements" in from_s else from_s.get("speed")
        to_speed = to_s.get("measurements", {}).get("speed") if "measurements" in to_s else to_s.get("speed")

        if from_speed is None or to_speed is None:
            return {
                "fromSensor": from_id,
                "toSensor": to_id,
                "fromSpeedMph": from_speed,
                "toSpeedMph": to_speed,
                "speedDifferenceMph": None,
                "consistencyScore": 100.0,
                "isDisagreement": False,
                "severity": "normal",
                "note": "One or both sensors have masked/null telemetry"
            }

        diff = round(abs(float(from_speed) - float(to_speed)), 2)
        is_disagreement = diff > 15.0
        consistency_score = round(max(0.0, 100.0 - (diff * 2.5)), 1)
        severity = "high" if diff > 20.0 else ("moderate" if diff > 15.0 else "normal")

        return {
            "fromSensor": from_id,
            "toSensor": to_id,
            "fromSpeedMph": float(from_speed),
            "toSpeedMph": float(to_speed),
            "speedDifferenceMph": diff,
            "consistencyScore": consistency_score,
            "isDisagreement": is_disagreement,
            "severity": severity,
            "note": f"Spatial speed variation is {diff} mph across adjacent segment"
        }

    def get_topology_summary(self) -> Dict[str, Any]:
        total_edges = sum(len(nbrs) for nbrs in self.adj.values())
        return {
            "nodeCount": len(self.sensors),
            "edgeCount": total_edges,
            "density": round(total_edges / (len(self.sensors) * (len(self.sensors) - 1)), 4) if len(self.sensors) > 1 else 0.0
        }
