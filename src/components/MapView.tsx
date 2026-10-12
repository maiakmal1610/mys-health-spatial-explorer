import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Layers, Check } from "lucide-react";
import { DistrictProperties, HealthcareGeoJSON, MetricViewMode } from "../types";

interface BasemapOption {
  id: string;
  name: string;
  category: "Google" | "Satellite" | "Vector / Clean";
  url: string;
  options: L.TileLayerOptions;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: "google_streets",
    name: "Google Streets",
    category: "Google",
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en",
    options: {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  {
    id: "google_hybrid",
    name: "Google Hybrid",
    category: "Google",
    url: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&hl=en",
    options: {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  {
    id: "google_terrain",
    name: "Google Terrain",
    category: "Google",
    url: "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&hl=en",
    options: {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "&copy; Google Maps",
    },
  },
  {
    id: "esri_imagery",
    name: "Esri World Imagery",
    category: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      attribution: "&copy; Esri &copy; Earthstar Geographics",
    },
  },
  {
    id: "waze",
    name: "Waze Map",
    category: "Vector / Clean",
    url: "https://worldtiles1.waze.com/tiles/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "&copy; Waze Mobile",
    },
  },
  {
    id: "osm_de",
    name: "OpenStreetMap",
    category: "Vector / Clean",
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  {
    id: "carto_dark",
    name: "Carto Dark Matter",
    category: "Vector / Clean",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
    options: {
      subdomains: ["a", "b", "c", "d"],
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
  },
];

interface MapViewProps {
  geoData: HealthcareGeoJSON | null;
  selectedDistrictId: string | null;
  selectedState: string;
  onSelectDistrict: (props: DistrictProperties | null) => void;
  metricMode: MetricViewMode;
}

export const MapView: React.FC<MapViewProps> = ({
  geoData,
  selectedDistrictId,
  selectedState,
  onSelectDistrict,
  metricMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const prevDistrictIdRef = useRef<string | null>(null);

  const [activeBasemapId, setActiveBasemapId] = useState<string>("google_streets");
  const [showBasemapMenu, setShowBasemapMenu] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [4.2105, 101.9758],
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false,
    });

    const initialConfig = BASEMAP_OPTIONS[0];
    const initialTile = L.tileLayer(initialConfig.url, initialConfig.options).addTo(map);
    currentTileLayerRef.current = initialTile;

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tile Layer dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const config = BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId);
    if (!config) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const newTile = L.tileLayer(config.url, config.options).addTo(map);
    newTile.bringToBack();
    currentTileLayerRef.current = newTile;
  }, [activeBasemapId]);

  // Determine fill color by metric mode
  const getFeatureColor = (props: DistrictProperties): string => {
    if (metricMode === "ratio") {
      if (props.total_beds === 0) return "#64748b"; // Slate
      if (props.beds_per_1k < 1.5) return "#ef4444"; // Red
      if (props.beds_per_1k < 2.5) return "#f59e0b"; // Amber
      return "#10b981"; // Emerald
    }

    if (metricMode === "total_beds") {
      if (props.total_beds === 0) return "#64748b";
      if (props.total_beds < 200) return "#38bdf8";
      if (props.total_beds < 600) return "#0284c7";
      if (props.total_beds < 1500) return "#2563eb";
      return "#4f46e5";
    }

    // moh_share
    if (props.total_beds === 0) return "#64748b";
    if (props.moh_share_pct < 60) return "#ec4899"; // High private
    if (props.moh_share_pct < 90) return "#8b5cf6"; // Mixed
    return "#06b6d4"; // 100% MoH public
  };

  // Render or Update GeoJSON Layer with State & District Focus/Dimming
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoData) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const isSatellite =
      activeBasemapId === "google_hybrid" || activeBasemapId === "esri_imagery";

    let selectedLayerRef: L.Path | null = null;
    const stateBounds = L.latLngBounds([]);

    const layer = L.geoJSON(geoData as any, {
      style: (feature) => {
        const props = feature?.properties as DistrictProperties;
        const color = getFeatureColor(props);
        const isDistrictSelected = props?.district_id === selectedDistrictId;
        const isInSelectedState =
          selectedState === "All States" || props?.state === selectedState;

        // SCENARIO 1: A specific district is chosen
        if (selectedDistrictId) {
          if (isDistrictSelected) {
            return {
              fillColor: color,
              weight: 3.5,
              opacity: 1,
              color: "#38bdf8",
              fillOpacity: 0.60,
            };
          } else {
            // Lower opacity for rest of districts
            return {
              fillColor: color,
              weight: 0.5,
              opacity: 0.25,
              color: isSatellite ? "#94a3b8" : "#334155",
              fillOpacity: 0.12,
            };
          }
        }

        // SCENARIO 2: A state is chosen from filter dropdown
        if (selectedState !== "All States") {
          if (isInSelectedState) {
            // Highlight this state's districts
            return {
              fillColor: color,
              weight: 2,
              opacity: 1,
              color: "#38bdf8",
              fillOpacity: 0.85,
            };
          } else {
            // Dim districts outside of this state
            return {
              fillColor: color,
              weight: 0.5,
              opacity: 0.2,
              color: isSatellite ? "#94a3b8" : "#334155",
              fillOpacity: 0.1,
            };
          }
        }

        // SCENARIO 3: Default view (All States, no district selected)
        return {
          fillColor: color,
          weight: isSatellite ? 1.5 : 1,
          opacity: 1,
          color: isSatellite ? "#ffffff" : "#1e293b",
          fillOpacity: isSatellite ? 0.6 : 0.7,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature.properties as DistrictProperties;

        // Keep track of state bounds
        if (selectedState !== "All States" && props.state === selectedState) {
          const b = (featureLayer as any).getBounds?.();
          if (b && b.isValid()) {
            stateBounds.extend(b);
          }
        }

        // Keep track of selected district layer
        if (props.district_id === selectedDistrictId) {
          selectedLayerRef = featureLayer as L.Path;
        }

        // Disable popup on hover whenever a state or district is actively selected
        const isSelectionActive = Boolean(selectedDistrictId || selectedState !== "All States");

        if (!isSelectionActive) {
          featureLayer.bindTooltip(
            `
            <div class="p-2 text-xs font-sans">
              <div class="font-bold text-slate-100 text-sm">${props.district}</div>
              <div class="text-slate-400 font-medium mb-1.5">${props.state}</div>
              <div class="space-y-0.5 text-slate-300">
                <div class="flex justify-between gap-3">
                  <span class="text-slate-400">Total Beds:</span>
                  <span class="font-semibold text-slate-100">${props.total_beds.toLocaleString()}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-slate-400">Population:</span>
                  <span class="font-semibold text-slate-100">${props.population.toLocaleString()}</span>
                </div>
                <div class="flex justify-between gap-3 pt-1 border-t border-slate-700">
                  <span class="text-slate-400">Bed Ratio:</span>
                  <span class="font-bold text-cyan-400 font-mono">${props.beds_per_1k.toFixed(2)}</span>
                </div>
              </div>
            </div>
            `,
            {
              className:
                "leaflet-custom-tooltip bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-slate-100",
              sticky: true,
            }
          );
        }

        featureLayer.on({
          mouseover: (e) => {
            const target = e.target;
            // If a district is chosen, freeze spotlight and avoid hover disturbance
            if (selectedDistrictId) return;
            // If a state is chosen, do not highlight dimmed districts outside that state
            if (selectedState !== "All States" && props.state !== selectedState) return;

            target.setStyle({
              weight: 2.5,
              color: "#38bdf8",
              fillOpacity: 0.85,
            });
            target.bringToFront();
          },
          mouseout: (e) => {
            const target = e.target;
            if (!selectedDistrictId) {
              layer.resetStyle(target);
            }
          },
          click: () => {
            onSelectDistrict(props);
            const bounds = (featureLayer as any).getBounds?.();
            if (bounds && bounds.isValid()) {
              map.flyToBounds(bounds, { maxZoom: 9, padding: [60, 60], duration: 1.0 });
            }
          },
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = layer;

    // Bring selected district to absolute top of render stack and pan directly to it
    if (selectedLayerRef) {
      (selectedLayerRef as any).bringToFront();
      const bounds = (selectedLayerRef as any).getBounds?.();
      if (bounds && bounds.isValid()) {
        map.flyToBounds(bounds, { maxZoom: 9, padding: [60, 60], duration: 1.0 });
      }
    } else if (prevDistrictIdRef.current && !selectedDistrictId) {
      // User clicked 'X' on the card -> smoothly zoom back out
      if (selectedState !== "All States" && stateBounds.isValid()) {
        map.flyToBounds(stateBounds, { padding: [50, 50], maxZoom: 9, duration: 1.0 });
      } else {
        map.flyToBounds(
          [
            [0.8, 99.5],
            [7.5, 119.5],
          ],
          { padding: [20, 20], duration: 1.0 }
        );
      }
    } else if (!selectedDistrictId && selectedState !== "All States" && stateBounds.isValid()) {
      // Auto-fit bounds if a state is selected from dropdown
      map.fitBounds(stateBounds, { padding: [50, 50], maxZoom: 9 });
    }

    prevDistrictIdRef.current = selectedDistrictId;
  }, [geoData, metricMode, selectedDistrictId, selectedState, activeBasemapId]);

  const handleZoom = (bounds: [[number, number], [number, number]]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  const activeBasemap =
    BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId) || BASEMAP_OPTIONS[0];

  return (
    <div className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Top Bar Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Basemap Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowBasemapMenu(!showBasemapMenu)}
            className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Basemap: {activeBasemap.name}</span>
          </button>

          {showBasemapMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1.5 z-30 divide-y divide-slate-800/60">
              <div className="p-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Base Layer
              </div>
              <div className="py-1 space-y-0.5">
                {BASEMAP_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setActiveBasemapId(opt.id);
                      setShowBasemapMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeBasemapId === opt.id
                        ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{opt.name}</span>
                    {activeBasemapId === opt.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Region Quick-Jump Controls */}
        <div className="flex gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
          <button
            onClick={() =>
              handleZoom([
                [0.8, 99.5],
                [7.5, 119.5],
              ])
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            All Malaysia
          </button>
          <button
            onClick={() =>
              handleZoom([
                [1.2, 99.8],
                [6.8, 104.6],
              ])
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Peninsular
          </button>
          <button
            onClick={() =>
              handleZoom([
                [0.8, 109.5],
                [7.4, 119.3],
              ])
            }
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Sabah & Sarawak
          </button>
        </div>
      </div>

      {/* Floating Interactive Legend */}
      <div className="absolute bottom-6 right-6 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-2xl w-64 text-xs">
        <div className="font-semibold text-slate-200 mb-2 flex items-center justify-between">
          <span>
            {metricMode === "ratio" && "Hospital Bed Ratio"}
            {metricMode === "total_beds" && "Total Bed Capacity"}
            {metricMode === "moh_share" && "MoH Public Hospital %"}
          </span>
          <span className="text-[10px] text-slate-500 font-normal">2024</span>
        </div>

        {metricMode === "ratio" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-sm shadow-emerald-500/20" />
              <span className="text-slate-300 font-medium">≥ 2.5 (Well-Served)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 shadow-sm shadow-amber-500/20" />
              <span className="text-slate-300 font-medium">1.5 - 2.5 (Moderate Access)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded bg-red-500 shadow-sm shadow-red-500/20" />
              <span className="text-slate-300 font-medium">&lt; 1.5 (Critical Deficit)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-500 shadow-sm" />
              <span className="text-slate-400">0 Beds Recorded</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span className="text-amber-400 font-semibold">Note:</span> WHO target recommendation is typically 2.0+ beds / 1k population.
            </div>
          </div>
        )}

        {metricMode === "total_beds" && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-indigo-600" />
              <span className="text-slate-300">1,500+ Beds (Major Hub)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600" />
              <span className="text-slate-300">600 - 1,500 Beds</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-sky-600" />
              <span className="text-slate-300">200 - 600 Beds</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-sky-400" />
              <span className="text-slate-300">&lt; 200 Beds</span>
            </div>
          </div>
        )}

        {metricMode === "moh_share" && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-500" />
              <span className="text-slate-300">&gt; 90% Public (MoH Only)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-slate-300">60% - 90% Public / Private Mixed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-pink-500" />
              <span className="text-slate-300">&lt; 60% High Private Presence</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
