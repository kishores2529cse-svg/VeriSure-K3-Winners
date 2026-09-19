import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShieldAlert, Bug, Camera, BookOpen } from "lucide-react";
import LightRays from "../visuals/LightRays";

const navigation = [
  { name: "Landing", href: "/", icon: LayoutDashboard },
  { name: "Console", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proctor Vision", href: "/proctor", icon: Camera },
  { name: "Scam Scanner", href: "/scam-scanner", icon: Bug },
  { name: "Scam Lists", href: "/scam-lists", icon: BookOpen },
];

export default function DashboardLayout() {
  const location = useLocation();

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
      {/* Sidebar */}
      <aside className="relative z-10 w-64 flex-shrink-0 border-r border-neutral-800/80 bg-[#090909]/90">
        <div className="flex h-16 items-center border-b border-neutral-800 px-6">
          <ShieldAlert className="mr-2 h-8 w-8 text-[#7CFF4D]" />
          <h1 className="text-xl font-bold tracking-tight text-white">VeriSure<span className="text-[#7CFF4D]">.AI</span></h1>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#7CFF4D]/10 text-[#7CFF4D]"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex h-16 items-center border-b border-neutral-800/70 bg-[#090909]/75 px-8 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-white capitalize">
            {navigation.find((n) => n.href === location.pathname)?.name || "Dashboard"}
          </h2>
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
