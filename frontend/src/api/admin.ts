/**
 * Campus Recover — Admin Dashboard API Client (Phase 11)
 */

import apiClient from "./client";
import {
  AdminOverviewStats,
  AdminChartsData,
  AdminUserSummary,
  AdminReportSummary,
  AdminClaimSummary,
  AdminLocationSummary,
  AdminLocationCreate,
  AdminLocationUpdate,
  AdminSuspiciousItem,
  ApiResponse,
  UserRole,
  ItemType,
  ItemCategory,
  ItemStatus,
  ClaimStatus,
} from "@/types";

export interface AdminUserFilters {
  search?: string;
  role?: UserRole;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface AdminReportFilters {
  search?: string;
  type?: ItemType;
  category?: ItemCategory;
  status?: ItemStatus;
  is_suspicious?: boolean;
  page?: number;
  per_page?: number;
}

export interface AdminClaimFilters {
  status?: ClaimStatus;
  page?: number;
  per_page?: number;
}

export const adminApi = {
  /**
   * Get high-level KPI metrics
   */
  async getStats(): Promise<ApiResponse<AdminOverviewStats>> {
    const res = await apiClient.get<ApiResponse<AdminOverviewStats>>("/admin/stats");
    return res.data;
  },

  /**
   * Get consolidated charts telemetry
   */
  async getCharts(days = 14): Promise<ApiResponse<AdminChartsData>> {
    const res = await apiClient.get<ApiResponse<AdminChartsData>>(`/admin/charts?days=${days}`);
    return res.data;
  },

  /**
   * List registered users with pagination & search
   */
  async getUsers(filters: AdminUserFilters = {}): Promise<ApiResponse<AdminUserSummary[]>> {
    const res = await apiClient.get<ApiResponse<AdminUserSummary[]>>("/admin/users", {
      params: filters,
    });
    return res.data;
  },

  /**
   * Suspend or reactivate user
   */
  async toggleUserStatus(
    userId: string,
    isActive: boolean,
    reason?: string
  ): Promise<ApiResponse<AdminUserSummary>> {
    const res = await apiClient.post<ApiResponse<AdminUserSummary>>(
      `/admin/users/${userId}/toggle-status`,
      { is_active: isActive, reason }
    );
    return res.data;
  },

  /**
   * List reports for moderation
   */
  async getReports(filters: AdminReportFilters = {}): Promise<ApiResponse<AdminReportSummary[]>> {
    const res = await apiClient.get<ApiResponse<AdminReportSummary[]>>("/admin/reports", {
      params: filters,
    });
    return res.data;
  },

  /**
   * Delete an item report permanently
   */
  async deleteReport(itemId: string, reason?: string): Promise<ApiResponse<{ item_id: string }>> {
    const res = await apiClient.delete<ApiResponse<{ item_id: string }>>(
      `/admin/reports/${itemId}`,
      {
        params: reason ? { reason } : undefined,
      }
    );
    return res.data;
  },

  /**
   * List claims across all items
   */
  async getClaims(filters: AdminClaimFilters = {}): Promise<ApiResponse<AdminClaimSummary[]>> {
    const res = await apiClient.get<ApiResponse<AdminClaimSummary[]>>("/admin/claims", {
      params: filters,
    });
    return res.data;
  },

  /**
   * Direct admin claim approval
   */
  async approveClaim(
    claimId: string,
    notes?: string
  ): Promise<ApiResponse<{ claim_id: string; status: string }>> {
    const res = await apiClient.post<ApiResponse<{ claim_id: string; status: string }>>(
      `/admin/claims/${claimId}/approve`,
      null,
      { params: notes ? { notes } : undefined }
    );
    return res.data;
  },

  /**
   * Direct admin claim rejection
   */
  async rejectClaim(
    claimId: string,
    notes?: string
  ): Promise<ApiResponse<{ claim_id: string; status: string }>> {
    const res = await apiClient.post<ApiResponse<{ claim_id: string; status: string }>>(
      `/admin/claims/${claimId}/reject`,
      null,
      { params: notes ? { notes } : undefined }
    );
    return res.data;
  },

  /**
   * List campus landmarks with item density
   */
  async getLocations(): Promise<ApiResponse<AdminLocationSummary[]>> {
    const res = await apiClient.get<ApiResponse<AdminLocationSummary[]>>("/admin/locations");
    return res.data;
  },

  /**
   * Create new campus location
   */
  async createLocation(data: AdminLocationCreate): Promise<ApiResponse<AdminLocationSummary>> {
    const res = await apiClient.post<ApiResponse<AdminLocationSummary>>(
      "/admin/locations",
      data
    );
    return res.data;
  },

  /**
   * Update existing campus location
   */
  async updateLocation(
    locationId: string,
    data: AdminLocationUpdate
  ): Promise<ApiResponse<AdminLocationSummary>> {
    const res = await apiClient.put<ApiResponse<AdminLocationSummary>>(
      `/admin/locations/${locationId}`,
      data
    );
    return res.data;
  },

  /**
   * Delete / deactivate campus location
   */
  async deleteLocation(locationId: string): Promise<ApiResponse<{ location_id: string }>> {
    const res = await apiClient.delete<ApiResponse<{ location_id: string }>>(
      `/admin/locations/${locationId}`
    );
    return res.data;
  },

  /**
   * Retrieve algorithmically flagged suspicious activities
   */
  async getSuspiciousActivity(): Promise<ApiResponse<AdminSuspiciousItem[]>> {
    const res = await apiClient.get<ApiResponse<AdminSuspiciousItem[]>>("/admin/suspicious");
    return res.data;
  },

  /**
   * Dismiss suspicious flag
   */
  async dismissSuspicious(itemId: string): Promise<ApiResponse<{ item_id: string }>> {
    const res = await apiClient.post<ApiResponse<{ item_id: string }>>(
      `/admin/suspicious/${itemId}/dismiss`
    );
    return res.data;
  },

  /**
   * Manually flag report as suspicious
   */
  async flagSuspicious(
    itemId: string,
    reason?: string
  ): Promise<ApiResponse<{ item_id: string; reason?: string }>> {
    const res = await apiClient.post<ApiResponse<{ item_id: string; reason?: string }>>(
      `/admin/suspicious/${itemId}/flag`,
      null,
      { params: reason ? { reason } : undefined }
    );
    return res.data;
  },
};
