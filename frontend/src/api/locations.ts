/**
 * Campus Recover — Locations & Map API Client (Phase 10)
 */

import apiClient from "./client";
import {
  ApiResponse,
  CampusLocation,
  MapItemMarker,
  CampusHotspot,
  NearbyItem,
  ItemType,
  ItemCategory,
  ItemStatus,
} from "@/types";

export interface MapItemsFilterParams {
  type?: ItemType;
  category?: ItemCategory;
  status?: ItemStatus;
  campus_location_id?: string;
  min_lat?: number;
  max_lat?: number;
  min_lon?: number;
  max_lon?: number;
}

export interface NearbyItemsParams {
  latitude: number;
  longitude: number;
  radius_meters?: number;
  type?: ItemType;
  category?: ItemCategory;
  limit?: number;
}

export const locationsApi = {
  /**
   * Get all active campus landmark buildings/locations.
   */
  async getLocations(search?: string): Promise<ApiResponse<CampusLocation[]>> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    const res = await apiClient.get<ApiResponse<CampusLocation[]>>(
      `/locations${params.toString() ? `?${params.toString()}` : ""}`
    );
    return res.data;
  },

  /**
   * Get single campus location details.
   */
  async getLocation(id: string): Promise<ApiResponse<CampusLocation>> {
    const res = await apiClient.get<ApiResponse<CampusLocation>>(`/locations/${id}`);
    return res.data;
  },

  /**
   * Get privacy-shielded item markers for map canvas.
   */
  async getMapItems(filters?: MapItemsFilterParams): Promise<ApiResponse<MapItemMarker[]>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.campus_location_id) params.append("campus_location_id", filters.campus_location_id);
    if (filters?.min_lat !== undefined) params.append("min_lat", filters.min_lat.toString());
    if (filters?.max_lat !== undefined) params.append("max_lat", filters.max_lat.toString());
    if (filters?.min_lon !== undefined) params.append("min_lon", filters.min_lon.toString());
    if (filters?.max_lon !== undefined) params.append("max_lon", filters.max_lon.toString());

    const res = await apiClient.get<ApiResponse<MapItemMarker[]>>(
      `/locations/map/items?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Get lost & found cluster density hotspots across campus.
   */
  async getHotspots(): Promise<ApiResponse<CampusHotspot[]>> {
    const res = await apiClient.get<ApiResponse<CampusHotspot[]>>("/locations/hotspots");
    return res.data;
  },

  /**
   * Find items near a target coordinate within a radius in meters.
   */
  async getNearbyItems(params: NearbyItemsParams): Promise<ApiResponse<NearbyItem[]>> {
    const query = new URLSearchParams();
    query.append("latitude", params.latitude.toString());
    query.append("longitude", params.longitude.toString());
    if (params.radius_meters) query.append("radius_meters", params.radius_meters.toString());
    if (params.type) query.append("type", params.type);
    if (params.category) query.append("category", params.category);
    if (params.limit) query.append("limit", params.limit.toString());

    const res = await apiClient.get<ApiResponse<NearbyItem[]>>(
      `/locations/nearby?${query.toString()}`
    );
    return res.data;
  },
};
