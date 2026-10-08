/**
 * Campus Recover — Claims API Client (Phase 8)
 */

import apiClient from "./client";
import {
  ApiResponse,
  Claim,
  ClaimStatus,
  CreateClaimRequest,
  ClaimReviewRequest,
  ClaimVerificationPrompt,
} from "@/types";

export const claimsApi = {
  /**
   * Get the private verification challenge question for an item before claiming.
   */
  async getVerificationPrompt(itemId: string): Promise<ApiResponse<ClaimVerificationPrompt>> {
    const res = await apiClient.get<ApiResponse<ClaimVerificationPrompt>>(`/claims/prompt/${itemId}`);
    return res.data;
  },

  /**
   * Submit an ownership claim on a found item report.
   */
  async createClaim(data: CreateClaimRequest): Promise<ApiResponse<Claim>> {
    const res = await apiClient.post<ApiResponse<Claim>>("/claims", data);
    return res.data;
  },

  /**
   * List claims submitted by the current user.
   */
  async getMyClaims(
    status?: ClaimStatus,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiResponse<Claim[]>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    const res = await apiClient.get<ApiResponse<Claim[]>>(`/claims/my-claims?${params.toString()}`);
    return res.data;
  },

  /**
   * List claims received on items found by the current user.
   */
  async getIncomingClaims(
    status?: ClaimStatus,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiResponse<Claim[]>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    const res = await apiClient.get<ApiResponse<Claim[]>>(`/claims/incoming?${params.toString()}`);
    return res.data;
  },

  /**
   * Admin campus-wide claim review queue.
   */
  async getAdminClaims(
    status?: ClaimStatus,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiResponse<Claim[]>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    const res = await apiClient.get<ApiResponse<Claim[]>>(`/claims/admin?${params.toString()}`);
    return res.data;
  },

  /**
   * Get claims for a specific item report (finder or admin).
   */
  async getItemClaims(itemId: string): Promise<ApiResponse<Claim[]>> {
    const res = await apiClient.get<ApiResponse<Claim[]>>(`/claims/item/${itemId}`);
    return res.data;
  },

  /**
   * Get single claim details.
   */
  async getClaim(claimId: string): Promise<ApiResponse<Claim>> {
    const res = await apiClient.get<ApiResponse<Claim>>(`/claims/${claimId}`);
    return res.data;
  },

  /**
   * Review claim (Approve or Reject with review notes).
   */
  async reviewClaim(claimId: string, data: ClaimReviewRequest): Promise<ApiResponse<Claim>> {
    const res = await apiClient.post<ApiResponse<Claim>>(`/claims/${claimId}/review`, data);
    return res.data;
  },

  /**
   * Quick approve claim.
   */
  async approveClaim(claimId: string): Promise<ApiResponse<Claim>> {
    const res = await apiClient.post<ApiResponse<Claim>>(`/claims/${claimId}/approve`);
    return res.data;
  },

  /**
   * Quick reject claim with optional note.
   */
  async rejectClaim(claimId: string, notes?: string): Promise<ApiResponse<Claim>> {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : "";
    const res = await apiClient.post<ApiResponse<Claim>>(`/claims/${claimId}/reject${params}`);
    return res.data;
  },

  /**
   * Confirm handover and mark item as recovered.
   */
  async markRecovered(claimId: string): Promise<ApiResponse<Claim>> {
    const res = await apiClient.post<ApiResponse<Claim>>(`/claims/${claimId}/recovered`);
    return res.data;
  },
};
