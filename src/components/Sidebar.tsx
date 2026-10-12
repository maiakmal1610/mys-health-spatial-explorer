import React, { useMemo } from "react";
import { Search, Filter, ArrowUpDown, ChevronRight } from "lucide-react";
import { DistrictProperties, MetricViewMode } from "../types";
import { formatNumber, formatRatio, formatPct } from "../lib/utils";

interface SidebarProps {
  districts: DistrictProperties[];
  selectedDistrictId: string | null;
  onSelectDistrict: (district: DistrictProperties) => void;
  selectedState: string;
  onSelectState: (state: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  metricMode: MetricViewMode;
  onMetricModeChange: (mode: MetricViewMode) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  districts,
  selectedDistrictId,
  onSelectDistrict,
  selectedState,
  onSelectState,
  searchQuery,
  onSearchChange,
  metricMode,
  onMetricModeChange,
  sortBy,
  onSortByChange,
}) => {
  // Extract unique states
  const states = useMemo(() => {
    const list = Array.from(new Set(districts.map((d) => d.state))).sort();
    return ["All States", ...list];
  }, [districts]);

  // Filtered and sorted districts
  const filteredDistricts = useMemo(() => {
    let result = districts.filter((d) => {
      const matchesState =
        selectedState === "All States" || d.state === selectedState;
      const matchesSearch =
        d.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.state.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesState && matchesSearch;
    });

    result.sort((a, b) => {
      if (sortBy === "ratio_desc") return b.beds_per_1k - a.beds_per_1k;
      if (sortBy === "ratio_asc") return a.beds_per_1k - b.beds_per_1k;
      if (sortBy === "beds_desc") return b.total_beds - a.total_beds;
      if (sortBy === "pop_desc") return b.population - a.population;
      return a.district.localeCompare(b.district);
    });

    return result;
  }, [districts, selectedState, searchQuery, sortBy]);

  return (
    <aside className="w-80 h-[calc(100vh-65px)] bg-slate-900 border-r border-slate-800 flex flex-col z-10 flex-shrink-0">
      {/* Control Panel */}
      <div className="p-4 border-b border-slate-800 space-y-3.5 bg-slate-900/60">
        {/* Metric Mode Switcher */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Active Spatial Layer
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onMetricModeChange("ratio")}
              className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                metricMode === "ratio"
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bed Ratio
            </button>
            <button
              onClick={() => onMetricModeChange("total_beds")}
              className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                metricMode === "total_beds"
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Total Beds
            </button>
            <button
              onClick={() => onMetricModeChange("moh_share")}
              className={`py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                metricMode === "moh_share"
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Public %
            </button>
          </div>
        </div>

        {/* Search District */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search district or state..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* State Filter & Sorting Row */}
        <div className="flex gap-2">
          {/* State Select */}
          <div className="flex-1 relative">
            <select
              value={selectedState}
              onChange={(e) => onSelectState(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
            >
              {states.map((st) => (
                <option key={st} value={st} className="bg-slate-900">
                  {st}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Select */}
          <div className="w-28 relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
            >
              <option value="ratio_desc" className="bg-slate-900">Highest Ratio</option>
              <option value="ratio_asc" className="bg-slate-900">Lowest Ratio</option>
              <option value="beds_desc" className="bg-slate-900">Most Beds</option>
              <option value="pop_desc" className="bg-slate-900">Highest Pop</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* District List Results Counter */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex justify-between items-center text-[11px] text-slate-400">
        <span>Showing {filteredDistricts.length} Districts</span>
        <span>Ranked by {sortBy === "ratio_desc" ? "Equity Ratio" : sortBy}</span>
      </div>

      {/* Scrollable District Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filteredDistricts.map((d) => {
          const isSelected = d.district_id === selectedDistrictId;
          return (
            <button
              key={d.district_id}
              onClick={() => onSelectDistrict(d)}
              className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition-colors ${
                isSelected
                  ? "bg-cyan-500/10 border-l-4 border-cyan-400"
                  : "hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.color_code }}
                />
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {d.district}
                  </div>
                  <div className="text-[10px] text-slate-400">{d.state}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-100 font-mono">
                    {metricMode === "ratio" && formatRatio(d.beds_per_1k)}
                    {metricMode === "total_beds" && `${formatNumber(d.total_beds)} beds`}
                    {metricMode === "moh_share" && `${formatPct(d.moh_share_pct)} MoH`}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {d.population > 0 ? formatNumber(d.population) : "No data"}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </button>
          );
        })}

        {filteredDistricts.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No districts found matching your filters.
          </div>
        )}
      </div>
    </aside>
  );
};
