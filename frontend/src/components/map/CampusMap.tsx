/**
 * Campus Recover — Interactive Leaflet & OpenStreetMap Canvas (Phase 10)
 *
 * Full-featured geospatial map supporting:
 * - Lost & Found item pins with custom SVG markers
 * - Campus building landmarks
 * - Hotspot density cluster rings
 * - Privacy-safe location shielding indicator
 * - Interactive popups with deep navigation
 */

import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Sparkles,
  ShieldAlert,
  Building2,
  ExternalLink,
  MapPin,
  Compass,
} from "lucide-react";

import { MapItemMarker, CampusLocation, CampusHotspot, ItemType } from "@/types";

// Rishihood University Campus Center default (Sonipat, Haryana)
export const DEFAULT_CAMPUS_CENTER: [number, number] = [28.9832, 77.0908];
export const DEFAULT_CAMPUS_ZOOM = 17;

// Custom HTML/SVG DivIcons to avoid broken asset URL issues in bundlers
const createSvgIcon = (
  bgColor: string,
  borderColor: string,
  svgContent: string,
  badgeText?: string
) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${bgColor};
        border: 2px solid ${borderColor};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <div style="
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        ">
          ${svgContent}
        </div>
        ${
          badgeText
            ? `
          <div style="
            position: absolute;
            top: -6px;
            right: -6px;
            background: #f43f5e;
            color: white;
            font-size: 9px;
            font-weight: 700;
            border-radius: 999px;
            padding: 1px 4px;
            transform: rotate(45deg);
            border: 1px solid #1e293b;
          ">
            ${badgeText}
          </div>`
            : ""
        }
      </div>
    `,
  });
};

const lostIcon = createSvgIcon(
  "#e11d48", // rose-600
  "#fda4af",
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
);

const foundIcon = createSvgIcon(
  "#059669", // emerald-600
  "#6ee7b7",
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
);

const buildingIcon = createSvgIcon(
  "#2563eb", // blue-600
  "#93c5fd",
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>`
);

const inspectionIcon = createSvgIcon(
  "#6366f1", // indigo-500
  "#a5b4fc",
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>`
);

// Map controller component for smooth center transitions
const MapCenterController: React.FC<{
  center?: [number, number];
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [center, zoom, map]);
  return null;
};

// Map click listener component
const MapClickHandler: React.FC<{
  onMapClick?: (lat: number, lon: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e: any) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export interface CampusMapProps {
  items?: MapItemMarker[];
  locations?: CampusLocation[];
  hotspots?: CampusHotspot[];
  selectedCenter?: [number, number];
  selectedZoom?: number;
  showLostItems?: boolean;
  showFoundItems?: boolean;
  showBuildings?: boolean;
  showHotspots?: boolean;
  inspectionPoint?: [number, number] | null;
  inspectionRadius?: number;
  onSelectItem?: (item: MapItemMarker) => void;
  onSelectLocation?: (location: CampusLocation) => void;
  onSelectInspectPoint?: (lat: number, lon: number) => void;
  onMapClick?: (lat: number, lon: number) => void;
  className?: string;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  items = [],
  locations = [],
  hotspots = [],
  selectedCenter,
  selectedZoom = 16,
  showLostItems = true,
  showFoundItems = true,
  showBuildings = true,
  showHotspots = false,
  inspectionPoint,
  inspectionRadius = 200,
  onSelectItem,
  onSelectLocation,
  onSelectInspectPoint,
  onMapClick,
  className = "h-[600px] w-full rounded-2xl",
}) => {
  const visibleItems = useMemo(() => {
    return items.filter((it) => {
      if (it.type === ItemType.LOST && !showLostItems) return false;
      if (it.type === ItemType.FOUND && !showFoundItems) return false;
      return true;
    });
  }, [items, showLostItems, showFoundItems]);

  return (
    <div className={`relative overflow-hidden border border-surface-800 shadow-2xl ${className}`}>
      <MapContainer
        center={selectedCenter || DEFAULT_CAMPUS_CENTER}
        zoom={selectedZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapCenterController center={selectedCenter} zoom={selectedZoom} />
        <MapClickHandler onMapClick={onMapClick} />

        {/* Official OpenStreetMap Tile Layer (Free, no API key required) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Hotspot Cluster Density Rings */}
        {showHotspots &&
          hotspots.map((h) => {
            const radius = 40 + h.density_score * 60; // 40m - 100m radius
            const fillColor =
              h.density_score > 0.6
                ? "#f43f5e" // high density (rose)
                : h.density_score > 0.3
                ? "#f59e0b" // medium density (amber)
                : "#3b82f6"; // low density (blue)

            return (
              <Circle
                key={`hotspot-${h.id}`}
                center={[h.latitude, h.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor,
                  fillOpacity: 0.25,
                  color: fillColor,
                  weight: 2,
                  dashArray: "4 4",
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{h.name} Hotspot</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      {h.total_count} total reports ({h.lost_count} lost, {h.found_count} found)
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Density Score: {Math.round(h.density_score * 100)}%
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}

        {/* Campus Landmark Buildings */}
        {showBuildings &&
          locations.map((loc) => (
            <Marker
              key={`loc-${loc.id}`}
              position={[loc.latitude, loc.longitude]}
              icon={buildingIcon}
              eventHandlers={{
                click: () => onSelectLocation && onSelectLocation(loc),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-2.5 space-y-2 min-w-[200px] text-slate-900">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold text-xs block leading-tight">
                        {loc.name}
                      </span>
                      {loc.building && (
                        <span className="text-[10px] text-slate-500 block">
                          {loc.building} {loc.floor ? `• ${loc.floor}` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {loc.description && (
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {loc.description}
                    </p>
                  )}

                  <div className="text-[10px] font-mono text-slate-400">
                    GPS: {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Lost & Found Item Markers */}
        {visibleItems.map((item) => {
          const isLost = item.type === ItemType.LOST;
          const markerIcon = isLost ? lostIcon : foundIcon;

          return (
            <Marker
              key={`item-${item.id}`}
              position={[item.latitude, item.longitude]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelectItem && onSelectItem(item),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-2.5 space-y-2.5 min-w-[220px] max-w-[260px] text-slate-900">
                  {/* Photo thumbnail if available */}
                  {item.image_url && (
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white ${
                          isLost ? "bg-rose-600" : "bg-emerald-600"
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {item.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Privacy Generalization Banner */}
                  {item.is_generalized_location && (
                    <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-1.5 text-[10px] text-amber-800 leading-tight">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Privacy Protected:</strong> Approximate zone shown for sensitive item.
                      </span>
                    </div>
                  )}

                  {/* Location label */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {item.location_name || item.campus_location_name || "Campus Ground"}
                    </span>
                  </div>

                  {/* Deep link button */}
                  <div className="pt-1 border-t border-slate-200 flex flex-col gap-1.5">
                    <Link to={`/items/${item.id}`} className="block">
                      <button
                        type="button"
                        className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition flex items-center justify-center gap-1"
                      >
                        <span>View Item Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </Link>
                    {onSelectInspectPoint && (
                      <button
                        type="button"
                        onClick={() => onSelectInspectPoint(item.latitude, item.longitude)}
                        className="w-full py-1 px-2 rounded-lg text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition flex items-center justify-center gap-1"
                      >
                        <Compass className="w-3 h-3 text-indigo-600" />
                        <span>Find items near here</span>
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* User Proximity Inspection Point & Scan Radius */}
        {inspectionPoint && (
          <>
            <Marker position={inspectionPoint} icon={inspectionIcon}>
              <Popup className="custom-leaflet-popup">
                <div className="p-2 space-y-1 text-xs text-slate-900">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-600">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    <span>Inspection Target</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Scanning {inspectionRadius}m radius for lost & found reports.
                  </p>
                  <div className="text-[10px] font-mono text-slate-400">
                    {inspectionPoint[0].toFixed(4)}, {inspectionPoint[1].toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={inspectionPoint}
              radius={inspectionRadius}
              pathOptions={{
                fillColor: "#6366f1",
                fillOpacity: 0.15,
                color: "#6366f1",
                weight: 2,
                dashArray: "6 6",
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};
