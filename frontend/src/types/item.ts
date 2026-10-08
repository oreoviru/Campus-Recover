/**
 * Campus Recover — Item Type Definitions
 */

import { ItemType, ItemStatus, ItemCategory } from "./common";

export interface CampusLocation {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  building?: string;
  floor?: string;
  is_active: boolean;
  created_at?: string;
}

export interface ItemReporterSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_image?: string | null;
}

export interface Item {
  id: string;
  user_id?: string | null;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  subcategory?: string | null;
  color?: string | null;
  brand?: string | null;
  serial_number?: string | null;
  distinguishing_marks?: string | null;
  location_name?: string | null;
  campus_location_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  date_time: string;
  image_url?: string | null;
  status: ItemStatus;
  has_verification_question?: boolean;
  created_at: string;
  updated_at: string;
  user?: ItemReporterSummary | null;
  campus_location?: CampusLocation | null;
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
  sort_by?: "created_at" | "date_time" | "title";
  sort_order?: "asc" | "desc";
}
