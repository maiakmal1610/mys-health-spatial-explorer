import React from "react";
import { Activity, ShieldCheck, Database, Layers } from "lucide-react";

interface HeaderProps {
  totalBeds: number;
  totalPopulation: number;
  avgRatio: number;
  districtsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalBeds,
  totalPopulation,
  avgRatio,
  districtsCount,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 z-20 sticky top-0 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
          <Activity className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Malaysia Healthcare Equity Spatial Exploration
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
              OpenDOSM & MoH
            </span>
          </div>
          <p className="text-xs text-slate-400">
            District-Level Hospital Bed Capacity & Demographic Accessibility (2024)
          </p>
        </div>
      </div>

      {/* National KPI Quick Counters */}
      <div className="flex items-center gap-5 text-xs">
        <div className="bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-400 font-medium">Districts Analyzed</div>
            <div className="font-semibold text-slate-200">{districtsCount} Administrative Units</div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-2.5">
          <Database className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400 font-medium">National Operational Beds</div>
            <div className="font-semibold text-slate-200">{totalBeds.toLocaleString()} Beds</div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400 font-medium">National Average Ratio</div>
            <div className="font-semibold text-slate-200 font-mono">
              {avgRatio.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
