import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShieldAlert, Bug, Camera, BookOpen } from "lucide-react";
import LightRays from "../visuals/LightRays";
import Dock from "../navigation/Dock";

const navigation = [
  { name: "Landing", href: "/", icon: LayoutDashboard },
  { name: "Console", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proctor Vision", href: "/proctor", icon: Camera },
  { name: "Scam Scanner", href: "/scam-scanner", icon: Bug },
  { name: "Scam Lists", href: "/scam-lists", icon: BookOpen },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const dockItems = navigation.map(item => ({
    icon: <item.icon className="w-5 h-5" />,
    label: item.name,
    onClick: () => navigate(item.href),
    className: location.pathname === item.href ? 'active' : ''
  }));

  const activePageName = navigation.find((n) => n.href === location.pathname)?.name || "Dashboard";

  return (
    <div className="relative isolate flex h-screen overflow-hidden bg-[#090909]">
      <LightRays
        raysOrigin="top-center"
        raysColor="#7CFF4D"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1.2}
        followMouse
        mouseInfluence={0.1}
        noiseAmount={0.1}
        distortion={0.05}
      />
      
      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto flex flex-col">
        {/* Top Header */}
        <div className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-neutral-800/70 bg-[#090909]/75 px-8 backdrop-blur-md">
          {/* Left: Logo & Title */}
          <div className="flex items-center space-x-6 z-10">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-6 w-6 text-[#7CFF4D]" />
              <h1 className="text-lg font-bold tracking-tight text-white hidden sm:block">
                VeriSure<span className="text-[#7CFF4D]">.AI</span>
              </h1>
            </div>
            <div className="h-6 w-px bg-neutral-800 hidden sm:block"></div>
            <h2 className="text-sm font-semibold text-neutral-300 capitalize">
              {activePageName}
            </h2>
          </div>

          {/* Center: Dock Navigation */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full">
            <Dock 
              items={dockItems} 
              panelHeight={64} 
              baseItemSize={44} 
              magnification={60}
              dockHeight={70} 
            />
          </div>

          {/* Right: Empty space to balance layout */}
          <div className="w-32 hidden lg:block z-10"></div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1 p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
