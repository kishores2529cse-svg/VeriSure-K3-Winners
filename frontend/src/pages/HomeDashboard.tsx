export default function HomeDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-medium text-slate-200 mb-2">Global Metrics Overview</h3>
        <p className="text-slate-400">Welcome to the VeriSure Multi-Domain Platform.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Placeholders for global metrics */}
          <div className="bg-slate-950 rounded-lg p-5 border border-slate-800/50">
            <p className="text-sm text-slate-400 font-medium">Total Anomalies Today</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">1,204</p>
          </div>
          <div className="bg-slate-950 rounded-lg p-5 border border-slate-800/50">
            <p className="text-sm text-slate-400 font-medium">Active Scans</p>
            <p className="text-3xl font-bold text-slate-100 mt-2">86</p>
          </div>
          <div className="bg-slate-950 rounded-lg p-5 border border-slate-800/50">
            <p className="text-sm text-slate-400 font-medium">System Health</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">99.9%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
