import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import HomeDashboard from "./pages/HomeDashboard";
import UpiGuard from "./pages/UpiGuard";
import ScamScanner from "./pages/ScamScanner";
import ProctorVision from "./pages/ProctorVision";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<HomeDashboard />} />
          <Route path="upi" element={<UpiGuard />} />
          <Route path="scam-scanner" element={<ScamScanner />} />
          <Route path="proctor" element={<ProctorVision />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
