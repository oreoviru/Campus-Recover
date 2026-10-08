/**
 * Campus Recover — Interactive Campus Map Page (Phase 10)
 *
 * Comprehensive Leaflet & OpenStreetMap geospatial hub with:
 * - Campus buildings and facilities visualization
 * - Lost & Found item pins with interactive detail popups
 * - Hotspot density clustering and analytical rankings
 * - Interactive proximity radar with exact distance calculation
 * - Privacy Shield for sensitive/valuable item protection
 * - Multi-criteria layer, category, and building filtering
 */

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Building2,
  PackageCheck,
  HelpCircle,
  Navigation,
  Radar,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { locationsApi } from "@/api/locations";
import {
  MapItemMarker,
  CampusLocation,
  CampusHotspot,
  NearbyItem,
  ItemType,
  ItemCategory,
} from "@/types";
import { CampusMap, DEFAULT_CAMPUS_CENTER } from "@/components/map/CampusMap";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: ItemCategory.ELECTRONICS, label: "Electronics & Tech" },
  { value: ItemCategory.CLOTHING, label: "Clothing & Apparel" },
  { value: ItemCategory.ACCESSORIES, label: "Accessories & Jewelry" },
  { value: ItemCategory.DOCUMENTS, label: "Documents & Cards" },
  { value: ItemCategory.KEYS, label: "Keys & Access Cards" },
  { value: ItemCategory.BAGS, label: "Bags & Backpacks" },
  { value: ItemCategory.BOOKS, label: "Books & Notebooks" },
  { value: ItemCategory.SPORTS, label: "Sports Equipment" },
  { value: ItemCategory.OTHER, label: "Other" },
];

export const CampusMapPage: React.FC = () => {
  // Data State
  const [items, setItems] = useState<MapItemMarker[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [hotspots, setHotspots] = useState<CampusHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map Navigation State
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CAMPUS_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(16);

  // Layer Toggles
  const [showLost, setShowLost] = useState(true);
  const [showFound, setShowFound] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");

  // Active Tab: 'explore' | 'hotspots' | 'nearby'
  const [activeTab, setActiveTab] = useState<"explore" | "hotspots" | "nearby">("explore");

  // Proximity Inspection State
  const [inspectPoint, setInspectPoint] = useState<[number, number] | null>(null);
  const [inspectRadius, setInspectRadius] = useState<number>(250);
  const [nearbyItems, setNearbyItems] = useState<NearbyItem[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Load Initial Map Data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, locsRes, hotspotsRes] = await Promise.all([
        locationsApi.getMapItems(),
        locationsApi.getLocations(),
        locationsApi.getHotspots(),
      ]);

      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data);
      }
      if (locsRes.success && locsRes.data) {
        setLocations(locsRes.data);
      }
      if (hotspotsRes.success && hotspotsRes.data) {
        setHotspots(hotspotsRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load map data", err);
      setError("Failed to load campus geospatial records. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter Items client-side for ultra-fast responsiveness
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (selectedBuildingId && item.campus_location_id !== selectedBuildingId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesLoc = (item.location_name || "").toLowerCase().includes(q);
        const matchesBldg = (item.campus_location_name || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesBldg) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedBuildingId, searchQuery]);

  // Compute stats
  const lostCount = filteredItems.filter((i) => i.type === ItemType.LOST).length;
  const foundCount = filteredItems.filter((i) => i.type === ItemType.FOUND).length;
  const generalizedCount = filteredItems.filter((i) => i.is_generalized_location).length;

  // Jump to specific building
  const handleSelectBuilding = (bldgId: string) => {
    setSelectedBuildingId(bldgId);
    if (!bldgId) {
      setMapCenter(DEFAULT_CAMPUS_CENTER);
      setMapZoom(16);
      return;
    }
    const bldg = locations.find((l) => l.id === bldgId);
    if (bldg) {
      setMapCenter([bldg.latitude, bldg.longitude]);
      setMapZoom(18);
    }
  };

  // Inspect nearby items at target coords
  const handleInspectCoordinates = async (lat: number, lon: number, radius = inspectRadius) => {
    setInspectPoint([lat, lon]);
    setLoadingNearby(true);
    setActiveTab("nearby");

    try {
      const res = await locationsApi.getNearbyItems({
        latitude: lat,
        longitude: lon,
        radius_meters: radius,
      });
      if (res.success && res.data) {
        setNearbyItems(res.data);
      }
    } catch (err) {
      console.error("Failed to query nearby items", err);
    } finally {
      setLoadingNearby(false);
    }
  };

  // Map Click handler to drop an inspection probe
  const handleMapClick = (lat: number, lon: number) => {
    handleInspectCoordinates(lat, lon);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Hero Header & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-surface-900 via-surface-900/90 to-surface-950 border border-surface-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-primary-400 font-semibold">
              Rishihood University Geospatial Explorer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Rishihood University Campus Map & Hotspots
          </h1>
          <p className="text-sm text-surface-300 max-w-2xl">
            Explore lost & found reports across Rishihood University facilities (Ashok Singhal Library, Academic Blocks, Student Centre, Sports Arena, and Hostels). Drop pins, detect recovery hotspots, and find items nearby with privacy-preserving coordinate shielding.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/report-lost">
            <Button variant="secondary" size="sm">
              <HelpCircle className="w-4 h-4 mr-1.5 text-rose-400" />
              Report Lost
            </Button>
          </Link>
          <Link to="/report-found">
            <Button variant="primary" size="sm" className="shadow-glow">
              <PackageCheck className="w-4 h-4 mr-1.5" />
              Report Found
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            title="Refresh map telemetry"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger-500/10 border border-danger-500/20 text-danger-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-danger-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-surface-900/70 border border-surface-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-surface-400 font-medium block">Lost Items Active</span>
            <span className="text-lg font-bold text-rose-400 mt-0.5 block">{lostCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-900/70 border border-surface-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-surface-400 font-medium block">Found Items Active</span>
            <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{foundCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-900/70 border border-surface-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-surface-400 font-medium block">Campus Facilities</span>
            <span className="text-lg font-bold text-blue-400 mt-0.5 block">{locations.length}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-900/70 border border-surface-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-surface-400 font-medium block">Privacy Shielded</span>
            <span className="text-lg font-bold text-amber-400 mt-0.5 block">{generalizedCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Controls & Insights / Interactive Leaflet Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex rounded-2xl bg-surface-900/90 border border-surface-800 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("explore")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "explore"
                  ? "bg-primary-600 text-white shadow-glow"
                  : "text-surface-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Explorer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("hotspots")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "hotspots"
                  ? "bg-primary-600 text-white shadow-glow"
                  : "text-surface-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hotspots ({hotspots.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("nearby")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "nearby"
                  ? "bg-primary-600 text-white shadow-glow"
                  : "text-surface-400 hover:text-white"
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Radar</span>
            </button>
          </div>

          {/* TAB 1: Filter & Explorer Controls */}
          {activeTab === "explore" && (
            <Card className="p-5 bg-surface-900/80 border-surface-800 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-primary-400" />
                  Search Item or Location
                </label>
                <Input
                  placeholder="e.g. MacBook, Library, Keys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Building Quick Jump Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Jump to Building Landmark
                </label>
                <Select
                  value={selectedBuildingId}
                  onChange={(e) => handleSelectBuilding(e.target.value)}
                  options={[
                    { value: "", label: "All Campus Buildings" },
                    ...locations.map((loc) => ({
                      value: loc.id,
                      label: `${loc.name} (${loc.building || "Campus"})`,
                    })),
                  ]}
                />
              </div>

              {/* Category Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-accent-400" />
                  Filter by Category
                </label>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={CATEGORY_OPTIONS}
                />
              </div>

              {/* Layer Toggles Checkboxes */}
              <div className="pt-3 border-t border-surface-850 space-y-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-surface-400 block">
                  Map Layer Overlays
                </span>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-surface-950/60 hover:bg-surface-950 border border-surface-850">
                    <span className="flex items-center gap-2 text-surface-200">
                      <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm"></span>
                      Lost Items Pins
                    </span>
                    <input
                      type="checkbox"
                      checked={showLost}
                      onChange={(e) => setShowLost(e.target.checked)}
                      className="rounded text-primary-600 bg-surface-800 border-surface-700"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-surface-950/60 hover:bg-surface-950 border border-surface-850">
                    <span className="flex items-center gap-2 text-surface-200">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                      Found Items Pins
                    </span>
                    <input
                      type="checkbox"
                      checked={showFound}
                      onChange={(e) => setShowFound(e.target.checked)}
                      className="rounded text-primary-600 bg-surface-800 border-surface-700"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-surface-950/60 hover:bg-surface-950 border border-surface-850">
                    <span className="flex items-center gap-2 text-surface-200">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm"></span>
                      Campus Buildings
                    </span>
                    <input
                      type="checkbox"
                      checked={showBuildings}
                      onChange={(e) => setShowBuildings(e.target.checked)}
                      className="rounded text-primary-600 bg-surface-800 border-surface-700"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-surface-950/60 hover:bg-surface-950 border border-surface-850">
                    <span className="flex items-center gap-2 text-surface-200">
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
                      Density Hotspots Rings
                    </span>
                    <input
                      type="checkbox"
                      checked={showHotspots}
                      onChange={(e) => setShowHotspots(e.target.checked)}
                      className="rounded text-primary-600 bg-surface-800 border-surface-700"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Campus Center */}
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setMapCenter(DEFAULT_CAMPUS_CENTER);
                  setMapZoom(17);
                  setSelectedBuildingId("");
                  setSearchQuery("");
                  setSelectedCategory("");
                }}
              >
                <Navigation className="w-3.5 h-3.5 mr-1.5" />
                Reset Rishihood View
              </Button>
            </Card>
          )}

          {/* TAB 2: Hotspot Analysis Ranking */}
          {activeTab === "hotspots" && (
            <Card className="p-5 bg-surface-900/80 border-surface-800 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Lost & Found Hotspot Rankings
                </h3>
                <p className="text-[11px] text-surface-400 mt-1">
                  High-activity zones based on report density. Click any location to zoom and inspect.
                </p>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-hide pr-1">
                {hotspots.length === 0 ? (
                  <p className="text-xs text-surface-500 text-center py-6">
                    No active hotspots recorded yet.
                  </p>
                ) : (
                  hotspots.map((h, idx) => (
                    <div
                      key={h.id}
                      onClick={() => {
                        setMapCenter([h.latitude, h.longitude]);
                        setMapZoom(18);
                        setShowHotspots(true);
                      }}
                      className="p-3 rounded-xl bg-surface-950/70 border border-surface-850 hover:border-surface-700 cursor-pointer transition space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-surface-800 text-[10px] font-mono font-bold text-surface-300 flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-white group-hover:text-primary-300 transition">
                            {h.name}
                          </span>
                        </div>
                        <Badge
                          size="sm"
                          variant={
                            h.density_score > 0.6
                              ? "danger"
                              : h.density_score > 0.3
                              ? "warning"
                              : "primary"
                          }
                        >
                          {Math.round(h.density_score * 100)}% Density
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[11px] text-surface-400 pt-1 border-t border-surface-900">
                        <div>
                          <span>Total:</span>{" "}
                          <strong className="text-white">{h.total_count}</strong>
                        </div>
                        <div>
                          <span>Lost:</span>{" "}
                          <strong className="text-rose-400">{h.lost_count}</strong>
                        </div>
                        <div>
                          <span>Found:</span>{" "}
                          <strong className="text-emerald-400">{h.found_count}</strong>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* TAB 3: Proximity Radar & Distance Calculator */}
          {activeTab === "nearby" && (
            <Card className="p-5 bg-surface-900/80 border-surface-800 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Radar className="w-4 h-4 text-indigo-400" />
                  Proximity Radar Discovery
                </h3>
                <p className="text-[11px] text-surface-400 mt-1">
                  Click anywhere on the map to drop an inspection probe and calculate exact distances.
                </p>
              </div>

              {/* Radius Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-300 font-medium">Scan Radius:</span>
                  <span className="font-mono text-primary-400 font-bold">{inspectRadius}m</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={inspectRadius}
                  onChange={(e) => {
                    const newRadius = Number(e.target.value);
                    setInspectRadius(newRadius);
                    if (inspectPoint) {
                      handleInspectCoordinates(inspectPoint[0], inspectPoint[1], newRadius);
                    }
                  }}
                  className="w-full accent-primary-500 bg-surface-800 cursor-pointer"
                />
              </div>

              {/* Quick Scan Center Button */}
              {!inspectPoint && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs shadow-glow"
                  onClick={() =>
                    handleInspectCoordinates(
                      DEFAULT_CAMPUS_CENTER[0],
                      DEFAULT_CAMPUS_CENTER[1]
                    )
                  }
                >
                  <Radar className="w-3.5 h-3.5 mr-1.5" />
                  Scan Campus Center (250m)
                </Button>
              )}

              {/* Proximity Results */}
              <div className="space-y-2 pt-2 border-t border-surface-850">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-400 font-medium">Nearby Items Found:</span>
                  <span className="font-bold text-white font-mono">{nearbyItems.length}</span>
                </div>

                {loadingNearby ? (
                  <div className="p-6 text-center text-xs text-surface-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary-400" />
                    <span>Calculating Haversine distances...</span>
                  </div>
                ) : nearbyItems.length === 0 ? (
                  <p className="text-xs text-surface-500 text-center py-6">
                    {inspectPoint
                      ? "No lost or found reports within this radius."
                      : "Click the map canvas to scan for nearby reports."}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-hide pr-1">
                    {nearbyItems.map((n) => (
                      <Link
                        key={n.item.id}
                        to={`/items/${n.item.id}`}
                        className="block p-3 rounded-xl bg-surface-950/70 border border-surface-850 hover:border-surface-700 transition group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase text-white ${
                                  n.item.type === ItemType.LOST ? "bg-rose-600" : "bg-emerald-600"
                                }`}
                              >
                                {n.item.type}
                              </span>
                              <span className="text-[10px] text-surface-400 font-mono">
                                {n.item.category}
                              </span>
                            </div>
                            <h5 className="text-xs font-semibold text-white group-hover:text-primary-300 transition line-clamp-1">
                              {n.item.title}
                            </h5>
                          </div>

                          {/* Calculated distance badge */}
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {n.distance_display || (n.distance_meters < 1000
                                ? `${n.distance_meters}m`
                                : `${(n.distance_meters / 1000).toFixed(1)}km`)}
                            </span>
                          </div>
                        </div>

                        {n.item.is_generalized_location && (
                          <div className="mt-1 text-[10px] text-amber-400 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Generalized distance</span>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Privacy Requirement Notice Card */}
          <div className="p-4 rounded-2xl bg-surface-950/60 border border-surface-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Security Privacy Shield</span>
            </div>
            <p className="text-surface-400 leading-relaxed text-[11px]">
              Exact coordinates and sensitive room details for high-value items (laptops, phones, wallets, IDs, keys) are automatically generalized to campus facility centers to protect owner safety. Authorized claim verification is required for retrieval.
            </p>
          </div>
        </div>

        {/* Right Map Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <CampusMap
            items={filteredItems}
            locations={locations}
            hotspots={hotspots}
            selectedCenter={mapCenter}
            selectedZoom={mapZoom}
            showLostItems={showLost}
            showFoundItems={showFound}
            showBuildings={showBuildings}
            showHotspots={showHotspots}
            inspectionPoint={inspectPoint}
            inspectionRadius={inspectRadius}
            onSelectInspectPoint={(lat, lon) => handleInspectCoordinates(lat, lon)}
            onMapClick={handleMapClick}
            className="h-[680px] w-full rounded-3xl"
          />

          <div className="flex flex-wrap items-center justify-between text-xs text-surface-400 px-2">
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-primary-400" />
              Tip: Click any marker to view report details, or click empty campus grounds to run proximity scan.
            </span>
            <span className="font-mono text-[11px] text-surface-500">
              OpenStreetMap • Live GIS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusMapPage;
