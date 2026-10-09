/**
 * Campus Recover — Admin Dashboard & Moderation Types (Phase 11)
 */

import { UserRole, ItemType, ItemStatus, ItemCategory, ClaimStatus } from "./index";

export interface AdminOverviewStats {
  total_users: number;
  total_lost_reports: number;
  total_found_reports: number;
  total_recovered_items: number;
  recovery_rate: number;
  pending_claims: number;
  suspicious_reports: number;
}

export interface ChartDataReportOverTime {
  date: string;
  lost: number;
  found: number;
  total: number;
}

export interface ChartDataCategory {
  category: string;
  lost: number;
  found: number;
  total: number;
}

export interface ChartDataLocation {
  location_name: string;
  lost: number;
  found: number;
  total: number;
}

export interface ChartDataRecoveryBreakdown {
  status: string;
  count: number;
  color?: string;
}

export interface AdminChartsData {
  lost_vs_found: {
    lost: number;
    found: number;
    total: number;
    recovered: number;
    recovery_rate: number;
  };
  reports_over_time: ChartDataReportOverTime[];
  categories: ChartDataCategory[];
  campus_locations: ChartDataLocation[];
  recovery_breakdown: ChartDataRecoveryBreakdown[];
  overall_recovery_rate: number;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  student_id: string | null;
  is_active: boolean;
  created_at: string;
  items_count: number;
  claims_count: number;
}

export interface AdminReportSummary {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  status: ItemStatus;
  location_name: string | null;
  campus_location_name: string | null;
  campus_location_id: string | null;
  image_url: string | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  date_time: string;
  created_at: string;
  claims_count: number;
  matches_count: number;
  is_suspicious: boolean;
  suspicious_reason: string | null;
}

export interface AdminClaimSummary {
  id: string;
  item_id: string;
  item_title: string;
  item_type: ItemType;
  item_category: ItemCategory;
  claimant_id: string;
  claimant_name: string;
  claimant_email: string;
  finder_id: string | null;
  finder_name: string | null;
  finder_email: string | null;
  verification_question: string | null;
  submitted_answer: string;
  status: ClaimStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminLocationSummary {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  building: string | null;
  floor: string | null;
  is_active: boolean;
  created_at: string;
  items_count: number;
}

export interface AdminLocationCreate {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  building?: string;
  floor?: string;
  is_active?: boolean;
}

export interface AdminLocationUpdate {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  building?: string;
  floor?: string;
  is_active?: boolean;
}

export interface AdminSuspiciousItem {
  id: string;
  item_id?: string;
  item_title?: string;
  item_type?: ItemType;
  item_category?: ItemCategory;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  reason: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  created_at: string;
  details: Record<string, any>;
}
