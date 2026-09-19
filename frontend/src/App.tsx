import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import HomeDashboard from "./pages/HomeDashboard";
import ScamScanner from "./pages/ScamScanner";
import ProctorVision from "./pages/ProctorVision";
import ScamLists from "./pages/ScamLists";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<HomeDashboard />} />
          <Route path="scam-scanner" element={<ScamScanner />} />
          <Route path="proctor" element={<ProctorVision />} />
          <Route path="scam-lists" element={<ScamLists />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
