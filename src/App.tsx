import { Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import GuidedOnboarding from './pages/onboarding/GuidedOnboarding';
import FreeTextOnboarding from './pages/onboarding/FreeTextOnboarding';
import UploadOnboarding from './pages/onboarding/UploadOnboarding';
import AnalyzingScreen from './pages/onboarding/AnalyzingScreen';
import ResultsScreen from './pages/onboarding/ResultsScreen';
import AppLayout from './layouts/AppLayout';
import AgentsTab from './pages/app/AgentsTab';
import BusinessTab from './pages/app/BusinessTab';
import CommunityTab from './pages/app/CommunityTab';
import DashboardTab from './pages/app/DashboardTab';

function App() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="/welcome" element={<Welcome />} />

      {/* Onboarding */}
      <Route path="/onboarding/guided" element={<GuidedOnboarding />} />
      <Route path="/onboarding/freetext" element={<FreeTextOnboarding />} />
      <Route path="/onboarding/upload" element={<UploadOnboarding />} />
      <Route path="/onboarding/analyzing" element={<AnalyzingScreen />} />
      <Route path="/onboarding/results" element={<ResultsScreen />} />

      {/* Main App */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="agents" replace />} />
        <Route path="agents" element={<AgentsTab />} />
        <Route path="business" element={<BusinessTab />} />
        <Route path="community" element={<CommunityTab />} />
        <Route path="dashboard" element={<DashboardTab />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default App;
