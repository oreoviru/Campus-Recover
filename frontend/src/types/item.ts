/**
 * Campus Recover — Item Type Definitions
 */

import { ItemType, ItemStatus, ItemCategory } from "./common";

export interface Item {
  id: string;
  user_id: string;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  subcategory?: string;
  color?: string;
  brand?: string;
  serial_number?: string;
  distinguishing_marks?: string;
  location_name?: string;
  campus_location_id?: string;
  latitude?: number;
  longitude?: number;
  date_time: string;
  image_url?: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  // Populated in detail view
  reported_by?: {
    id: string;
    name: string;
  };
}

export interface CreateItemRequest {
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  subcategory?: string;
  color?: string;
  brand?: string;
  serial_number?: string;
  distinguishing_marks?: string;
  location_name?: string;
  campus_location_id?: string;
  latitude?: number;
  longitude?: number;
  date_time: string;
  image_url?: string;
  // Found items only
  verification_question?: string;
  verification_answer?: string;
}

export interface ItemFilters {
  type?: ItemType;
  category?: ItemCategory;
  status?: ItemStatus;
  search?: string;
  location?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: "created_at" | "date_time" | "relevance";
  sort_order?: "asc" | "desc";
}

export interface CampusLocation {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  building?: string;
  floor?: string;
  is_active: boolean;
}
