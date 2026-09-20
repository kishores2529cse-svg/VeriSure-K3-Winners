import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import HomeDashboard from "./pages/HomeDashboard";
import ScamScanner from "./pages/ScamScanner";
import ProctorVision from "./pages/ProctorVision";
import ScamLists from "./pages/ScamLists";
import LandingPage from "./pages/Landing/LandingPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page as default root */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage />} />

        {/* Console / Login redirects to Dashboard */}
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard and Core Subsystems */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<HomeDashboard />} />

        </Route>

        <Route path="/scam-scanner" element={<DashboardLayout />}>
          <Route index element={<ScamScanner />} />
        </Route>
        <Route path="/scam-lists" element={<DashboardLayout />}>
          <Route index element={<ScamLists />} />
        </Route>
        <Route path="/proctor" element={<DashboardLayout />}>
          <Route index element={<ProctorVision />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
