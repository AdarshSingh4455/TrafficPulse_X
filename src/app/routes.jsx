import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Overview from '../pages/Overview/Overview';
import TrafficNetwork from '../pages/TrafficNetwork/TrafficNetwork';
import DecisionIntelligence from '../pages/DecisionIntelligence/DecisionIntelligence';
import Prediction from '../pages/Prediction/Prediction';
import Communication from '../pages/Communication/Communication';
import FederatedLearning from '../pages/FederatedLearning/FederatedLearning';
import Alerts from '../pages/Alerts/Alerts';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/overview" element={<Overview />} />
      <Route path="/network" element={<TrafficNetwork />} />
      <Route path="/decision" element={<DecisionIntelligence />} />
      <Route path="/predictions" element={<Prediction />} />
      <Route path="/communication" element={<Communication />} />
      <Route path="/federated" element={<FederatedLearning />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
