/**
 * Campus Recover — Items & Locations API Client
 */

import apiClient from "./client";
import {
  Item,
  CreateItemRequest,
  ItemFilters,
  CampusLocation,
} from "@/types/item";
import { ApiResponse, ItemType, ItemStatus } from "@/types/common";

export interface UploadImageResponse {
  url: string;
  filename: string;
  size: number;
}

export const itemsApi = {
  /**
   * Fetch paginated list of items with optional search & filters
   */
  async getItems(filters: ItemFilters = {}): Promise<ApiResponse<Item[]>> {
    const params: Record<string, any> = {};
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.location) params.campus_location_id = filters.location;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_order) params.sort_order = filters.sort_order;
    if (filters.page) params.page = filters.page;
    if (filters.per_page) params.per_page = filters.per_page;

    const response = await apiClient.get<ApiResponse<Item[]>>("/items", {
      params,
    });
    return response.data;
  },

  /**
   * Fetch a single item by UUID
   */
  async getItem(id: string): Promise<ApiResponse<Item>> {
    const response = await apiClient.get<ApiResponse<Item>>(`/items/${id}`);
    return response.data;
  },

  /**
   * Create a new lost or found item report (requires auth)
   */
  async createItem(itemData: CreateItemRequest): Promise<ApiResponse<Item>> {
    const response = await apiClient.post<ApiResponse<Item>>("/items", itemData);
    return response.data;
  },

  /**
   * Update an existing item (requires ownership or admin)
   */
  async updateItem(
    id: string,
    itemData: Partial<CreateItemRequest> & { status?: ItemStatus }
  ): Promise<ApiResponse<Item>> {
    const response = await apiClient.put<ApiResponse<Item>>(
      `/items/${id}`,
      itemData
    );
    return response.data;
  },

  /**
   * Delete an item report (requires ownership or admin)
   */
  async deleteItem(id: string): Promise<ApiResponse<{ id: string }>> {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(
      `/items/${id}`
    );
    return response.data;
  },

  /**
   * Fetch current user's submitted reports
   */
  async getMyReports(params?: {
    type?: ItemType;
    status?: ItemStatus;
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<Item[]>> {
    const response = await apiClient.get<ApiResponse<Item[]>>("/items/my-reports", {
      params,
    });
    return response.data;
  },

  /**
   * Upload an item image file
   */
  async uploadImage(file: File): Promise<ApiResponse<UploadImageResponse>> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiResponse<UploadImageResponse>>(
      "/upload/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Fetch active campus locations for selection dropdowns
   */
  async getCampusLocations(
    search?: string
  ): Promise<ApiResponse<CampusLocation[]>> {
    const response = await apiClient.get<ApiResponse<CampusLocation[]>>(
      "/locations",
      {
        params: search ? { search } : undefined,
      }
    );
    return response.data;
  },
};

export default itemsApi;
