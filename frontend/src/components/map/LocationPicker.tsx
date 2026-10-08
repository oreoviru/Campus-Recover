/**
 * Campus Recover — Interactive Location Picker Map (Phase 10)
 *
 * Clickable map widget for report forms allowing students to visually
 * select coordinates, with automatic nearest-building proximity detection.
 */

import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Building2, Check } from "lucide-react";

import { CampusLocation } from "@/types";
import { DEFAULT_CAMPUS_CENTER } from "./CampusMap";

// Custom Target Pin for Location Picker
const pickerIcon = L.divIcon({
  className: "picker-target-pin",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  html: `
    <div style="
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #4f46e5;
      border: 3px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.5);
    ">
      <div style="
        width: 12px;
        height: 12px;
        background: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
});

// Haversine distance calculator for client proximity detection
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Map Click Listener
const MapClickHandler: React.FC<{
  onLocationSelect: (lat: number, lon: number) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Map Recenter Helper
const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export interface LocationPickerProps {
  initialLat?: number | null;
  initialLon?: number | null;
  campusLocations?: CampusLocation[];
  onSelectCoordinates: (lat: number, lon: number, nearestLoc?: CampusLocation) => void;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLat,
  initialLon,
  campusLocations = [],
  onSelectCoordinates,
  className = "h-[340px] w-full rounded-2xl",
}) => {
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>(
    initialLat && initialLon ? [initialLat, initialLon] : DEFAULT_CAMPUS_CENTER
  );

  const [nearestBuilding, setNearestBuilding] = useState<CampusLocation | null>(null);

  // Detect nearest building when coordinates change
  const handleLocationPicked = (lat: number, lon: number) => {
    setSelectedCoords([lat, lon]);

    let closest: CampusLocation | null = null;
    let minDistance = Infinity;

    for (const loc of campusLocations) {
      const dist = calculateDistanceMeters(lat, lon, loc.latitude, loc.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closest = loc;
      }
    }

    setNearestBuilding(closest);
    onSelectCoordinates(lat, lon, closest || undefined);
  };

  const handleSelectPredefinedBuilding = (loc: CampusLocation) => {
    handleLocationPicked(loc.latitude, loc.longitude);
  };

  return (
    <div className="space-y-3">
      {/* Interactive Map Canvas */}
      <div className={`relative overflow-hidden border border-surface-800 shadow-xl ${className}`}>
        <MapContainer
          center={selectedCoords}
          zoom={16}
          scrollWheelZoom={true}
          className="w-full h-full z-0 cursor-crosshair"
        >
          <MapRecenter center={selectedCoords} />
          <MapClickHandler onLocationSelect={handleLocationPicked} />

          {/* Official OpenStreetMap Tile Layer (Free, no API key required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <Marker position={selectedCoords} icon={pickerIcon} />
        </MapContainer>

        {/* Floating Instruction Banner */}
        <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none">
          <div className="bg-surface-950/90 backdrop-blur-md border border-surface-800 px-3.5 py-2 rounded-xl text-xs text-surface-200 flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-1.5 font-medium">
              <Navigation className="w-3.5 h-3.5 text-primary-400" />
              Click anywhere on campus to drop pin
            </span>
            <span className="font-mono text-[11px] text-surface-400">
              {selectedCoords[0].toFixed(4)}, {selectedCoords[1].toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Select Campus Landmarks Chips */}
      {campusLocations.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-surface-400 block">
            Quick Select Campus Landmark:
          </span>
          <div className="flex flex-wrap gap-2">
            {campusLocations
              .filter((l) => !l.name.toLowerCase().includes("other"))
              .slice(0, 7)
              .map((loc) => {
                const isSelected =
                  Math.abs(selectedCoords[0] - loc.latitude) < 0.0005 &&
                  Math.abs(selectedCoords[1] - loc.longitude) < 0.0005;

                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectPredefinedBuilding(loc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary-600/20 text-primary-300 border border-primary-500/40 shadow-sm"
                        : "bg-surface-900/60 text-surface-400 hover:text-white border border-surface-800"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-primary-400" />
                    <span>{loc.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-primary-400 ml-0.5" />}
                  </button>
                );
              })}

            {/* Other / Custom Pin button */}
            {(() => {
              const otherLoc = campusLocations.find((l) => l.name.toLowerCase().includes("other"));
              const isOtherSelected = nearestBuilding?.name.toLowerCase().includes("other") || !nearestBuilding;
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (otherLoc) {
                      handleSelectPredefinedBuilding(otherLoc);
                    } else {
                      setNearestBuilding(null);
                      onSelectCoordinates(selectedCoords[0], selectedCoords[1], undefined);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                    isOtherSelected
                      ? "bg-accent-600/20 text-accent-300 border border-accent-500/40 shadow-sm"
                      : "bg-surface-900/60 text-surface-400 hover:text-white border border-surface-800"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-accent-400" />
                  <span>Other / Open Grounds</span>
                  {isOtherSelected && <Check className="w-3 h-3 text-accent-400 ml-0.5" />}
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* Proximity Feedback */}
      {nearestBuilding && (
        <div className="p-3 rounded-xl bg-surface-900/40 border border-surface-850 flex items-center justify-between text-xs">
          <span className="text-surface-400">Nearest Campus Facility:</span>
          <span className="font-semibold text-white flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary-400" />
            {nearestBuilding.name}
            {nearestBuilding.building ? ` (${nearestBuilding.building})` : ""}
          </span>
        </div>
      )}
    </div>
  );
};
