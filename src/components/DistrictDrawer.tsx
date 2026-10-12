import React from "react";
import { X, Building2, Users, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { DistrictProperties } from "../types";
import { formatNumber, formatRatio, formatPct } from "../lib/utils";

interface DistrictDrawerProps {
  district: DistrictProperties | null;
  onClose: () => void;
}

export const DistrictDrawer: React.FC<DistrictDrawerProps> = ({ district, onClose }) => {
  if (!district) return null;

  const whoTarget = 2.0;
  const ratioDiff = district.beds_per_1k - whoTarget;

  return (
    <div className="absolute top-4 left-4 z-20 w-80 max-h-[360px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 text-xs">
      {/* Pinned Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-800/50 flex items-center justify-between flex-shrink-0">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 uppercase tracking-wider">
              {district.state}
            </span>
            <span className="text-[10px] text-slate-400">ADM2 District</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight truncate">
            {district.district}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body (cut in half height with smooth scroll) */}
      <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
        {/* Healthcare Equity Metric */}
        <div
          className="p-3 rounded-xl border"
          style={{
            borderColor: `${district.color_code}40`,
            backgroundColor: `${district.color_code}10`,
          }}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-medium text-slate-300">Healthcare Equity Metric</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded truncate"
              style={{
                color: district.color_code,
                backgroundColor: `${district.color_code}20`,
              }}
            >
              {district.equity_category}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-extrabold text-white font-mono">
              {formatRatio(district.beds_per_1k)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">beds / 1,000 residents</span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px]">
            {ratioDiff >= 0 ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-emerald-400">+{ratioDiff.toFixed(2)}</strong> above WHO guideline (2.0)
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-slate-300">
                  <strong className="text-amber-400">{Math.abs(ratioDiff).toFixed(2)}</strong> below WHO guideline (2.0)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-0.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Total Beds</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {formatNumber(district.total_beds)}
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-0.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Population</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {formatNumber(district.population)}
            </div>
          </div>
        </div>

        {/* Capacity Breakdown */}
        <div className="bg-slate-800/30 border border-slate-800 p-3 rounded-xl space-y-2.5">
          <h3 className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
            Bed Capacity Breakdown
          </h3>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                MoH Public (KKM)
              </span>
              <span className="font-semibold text-white font-mono">
                {formatNumber(district.moh_beds)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Non-MoH (Private/Uni)
              </span>
              <span className="font-semibold text-white font-mono">
                {formatNumber(district.non_moh_beds)}
              </span>
            </div>

            {district.special_beds > 0 && (
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Special Institutions
                </span>
                <span className="font-semibold text-white font-mono">
                  {formatNumber(district.special_beds)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-1.5 border-t border-slate-800/60">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Public vs Private Split</span>
              <span>{formatPct(district.moh_share_pct)} Public</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-cyan-500 h-full transition-all"
                style={{ width: `${district.moh_share_pct}%` }}
              />
              <div
                className="bg-purple-500 h-full transition-all"
                style={{ width: `${100 - district.moh_share_pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Policy Observation */}
        <div className="bg-slate-800/20 border border-slate-800/80 p-3 rounded-xl text-[11px] text-slate-300 space-y-1">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Policy Observation:</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            {district.total_beds === 0
              ? `${district.district} has no gazetted inpatient beds. Residents rely completely on referral hospitals in adjacent districts.`
              : district.beds_per_1k < 1.5
              ? `${district.district} exhibits severe bed deficit (${district.beds_per_1k.toFixed(2)}), falling significantly below the national benchmark. High risk of patient congestion.`
              : district.beds_per_1k < 2.5
              ? `${district.district} maintains moderate capacity (${district.beds_per_1k.toFixed(2)}), meeting baseline primary access standards.`
              : `${district.district} serves as a regional healthcare center with ${district.beds_per_1k.toFixed(2)} beds per 1k residents.`}
          </p>
        </div>
      </div>
    </div>
  );
};
