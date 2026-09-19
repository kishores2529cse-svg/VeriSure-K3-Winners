import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShieldAlert, Bug, Camera } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "UPI Guard", href: "/upi", icon: ShieldAlert },
  { name: "Scam Scanner", href: "/scam-scanner", icon: Bug },
  { name: "Proctor Vision", href: "/proctor", icon: Camera },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900">
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
      <main className="flex-1 overflow-y-auto">
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
