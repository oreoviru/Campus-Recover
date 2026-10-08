/**
 * Campus Recover — Matches API Client
 */

import apiClient from "./client";
import { ApiResponse, Match, MatchStatus } from "@/types";

export const matchesApi = {
  /**
   * Retrieve list of matches involving items reported by the current user.
   */
  async getUserMatches(
    status?: MatchStatus,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiResponse<Match[]>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    const res = await apiClient.get<ApiResponse<Match[]>>(`/matches?${params.toString()}`);
    return res.data;
  },

  /**
   * Get single match details with complete dimensional breakdown.
   */
  async getMatchById(matchId: string): Promise<ApiResponse<Match>> {
    const res = await apiClient.get<ApiResponse<Match>>(`/matches/${matchId}`);
    return res.data;
  },

  /**
   * Get candidate matches for a specific item report.
   */
  async getItemMatches(
    itemId: string,
    status?: MatchStatus
  ): Promise<ApiResponse<Match[]>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);

    const res = await apiClient.get<ApiResponse<Match[]>>(`/matches/item/${itemId}?${params.toString()}`);
    return res.data;
  },

  /**
   * Confirm a match candidate as the genuine recovered item.
   */
  async confirmMatch(matchId: string): Promise<ApiResponse<Match>> {
    const res = await apiClient.post<ApiResponse<Match>>(`/matches/${matchId}/confirm`);
    return res.data;
  },

  /**
   * Reject a candidate match.
   */
  async rejectMatch(matchId: string): Promise<ApiResponse<Match>> {
    const res = await apiClient.post<ApiResponse<Match>>(`/matches/${matchId}/reject`);
    return res.data;
  },
};
