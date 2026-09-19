import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShieldAlert, Bug, Camera, BookOpen } from "lucide-react";
import FloatingLines from "../visuals/FloatingLines";

const navigation = [
  { name: "Landing", href: "/", icon: LayoutDashboard },
  { name: "Console", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proctor Vision", href: "/proctor", icon: Camera },
  { name: "UPI Guard", href: "/upi", icon: ShieldAlert },
  { name: "Scam Scanner", href: "/scam-scanner", icon: Bug },
  { name: "Scam Lists", href: "/scam-lists", icon: BookOpen },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="relative isolate flex h-screen overflow-hidden bg-slate-950">
      {location.pathname === "/" && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <FloatingLines
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={[8, 12, 16]}
            lineDistance={[8, 6, 4]}
            linesGradient={["#22d3ee", "#818cf8", "#fb7185"]}
            bendRadius={5}
            bendStrength={-0.5}
            interactive={false}
            parallax={false}
            animationSpeed={0.8}
          />
        </div>
      )}
      {/* Sidebar */}
      <aside className="relative z-10 w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/85">
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <ShieldAlert className="w-8 h-8 text-indigo-500 mr-2" />
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">VeriSure</h1>
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
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
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
        <div className="h-16 flex items-center px-8 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-200 capitalize">
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
