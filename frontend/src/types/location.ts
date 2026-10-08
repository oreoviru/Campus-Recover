/**
 * Campus Recover — Map & Location Type Definitions (Phase 10)
 */

import { ItemType, ItemCategory, ItemStatus } from "./common";

export interface MapItemMarker {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  category: ItemCategory;
  status: ItemStatus;
  image_url?: string | null;
  latitude: number;
  longitude: number;
  is_generalized_location: boolean;
  campus_location_id?: string | null;
  campus_location_name?: string | null;
  location_name?: string | null;
  date_time: string;
  created_at: string;
}

export interface CampusHotspot {
  id: string;
  name: string;
  building?: string | null;
  latitude: number;
  longitude: number;
  lost_count: number;
  found_count: number;
  total_count: number;
  density_score: number;
  top_categories: string[];
}

export interface NearbyItem {
  item: MapItemMarker;
  distance_meters: number;
  distance_display: string;
  proximity_score: number;
}
