# TrafficPulse-X: Sensor Network Graph Structure G = (V, E, W)

from collections import deque
from typing import Dict, List, Any, Optional

class SensorGraph:
    def __init__(self, sensors: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
        self.sensors = {s["id"]: s for s in sensors}
        self.adj: Dict[str, List[Dict[str, Any]]] = {s["id"]: [] for s in sensors}
        self.rev_adj: Dict[str, List[Dict[str, Any]]] = {s["id"]: [] for s in sensors}
        self.edges = edges

        for e in edges:
            u, v = e["from"], e["to"]
            if u in self.adj and v in self.adj:
                self.adj[u].append(e)
                self.rev_adj[v].append(e)

    def get_neighbors(self, sensor_id: str, k_hops: int = 1) -> List[str]:
        if sensor_id not in self.sensors:
            return []
        
        visited = {sensor_id}
        queue = deque([(sensor_id, 0)])
        result = []

        while queue:
            curr, depth = queue.popleft()
            if depth < k_hops:
                # Outgoing and incoming neighbors
                out_neighbors = [e["to"] for e in self.adj.get(curr, [])]
                in_neighbors = [e["from"] for e in self.rev_adj.get(curr, [])]
                for nbr in out_neighbors + in_neighbors:
                    if nbr not in visited and nbr in self.sensors:
                        visited.add(nbr)
                        queue.append((nbr, depth + 1))
                        result.append(nbr)
        return result

    def get_flow_conservation(self, from_id: str, to_id: str) -> Optional[Dict[str, Any]]:
        # Find connecting edge
        for e in self.adj.get(from_id, []):
            if e["to"] == to_id:
                from_s = self.sensors.get(from_id, {})
                to_s = self.sensors.get(to_id, {})
                in_flow = from_s.get("flow", 0)
                obs_flow = to_s.get("flow", 0)
                trans_prob = e.get("transitionProb", 0.7)
                expected = int(in_flow * trans_prob)
                diff = abs(expected - obs_flow)

                return {
                    "fromSensor": from_id,
                    "toSensor": to_id,
                    "incomingFlow": in_flow,
                    "expectedFlow": expected,
                    "observedFlow": obs_flow,
                    "transitionProbability": trans_prob,
                    "unexplainedDifference": diff,
                    "isMismatch": diff > 200,
                    "severity": "high" if diff > 200 else "normal"
                }
        return None

    def get_topology_summary(self) -> Dict[str, Any]:
        return {
            "nodeCount": len(self.sensors),
            "edgeCount": len(self.edges),
            "nodes": list(self.sensors.values()),
            "edges": self.edges,
            "density": round(len(self.edges) / (len(self.sensors) * (len(self.sensors) - 1)), 4) if len(self.sensors) > 1 else 0
        }
