/**
 * Campus Recover — Notifications API Client (Phase 9)
 */

import apiClient from "./client";
import {
  ApiResponse,
  Notification,
  NotificationType,
} from "@/types";

export interface NotificationListResponseData {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  per_page: number;
}

export interface UnreadCountResponseData {
  unread_count: number;
}

export interface AdminBroadcastRequest {
  title: string;
  message: string;
  target_user_id?: string;
}

export const notificationsApi = {
  /**
   * Get paginated notifications for current user with optional unread filter.
   */
  async getNotifications(
    unreadOnly: boolean = false,
    type?: NotificationType,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiResponse<NotificationListResponseData>> {
    const params = new URLSearchParams();
    if (unreadOnly) params.append("unread_only", "true");
    if (type) params.append("type", type);
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    const res = await apiClient.get<ApiResponse<NotificationListResponseData>>(
      `/notifications?${params.toString()}`
    );
    return res.data;
  },

  /**
   * Fetch current unread badge count for quick navbar badge display.
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponseData>> {
    const res = await apiClient.get<ApiResponse<UnreadCountResponseData>>(
      "/notifications/unread-count"
    );
    return res.data;
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    const res = await apiClient.post<ApiResponse<Notification>>(
      `/notifications/${notificationId}/read`
    );
    return res.data;
  },

  /**
   * Mark all notifications for the current user as read.
   */
  async markAllAsRead(): Promise<ApiResponse<{ marked_read: number }>> {
    const res = await apiClient.post<ApiResponse<{ marked_read: number }>>(
      "/notifications/read-all"
    );
    return res.data;
  },

  /**
   * Dismiss and delete a notification.
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const res = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(
      `/notifications/${notificationId}`
    );
    return res.data;
  },

  /**
   * Administrative campus-wide announcement broadcast.
   */
  async adminBroadcast(data: AdminBroadcastRequest): Promise<ApiResponse<{ recipients_notified: number }>> {
    const res = await apiClient.post<ApiResponse<{ recipients_notified: number }>>(
      "/notifications/admin-broadcast",
      data
    );
    return res.data;
  },
};
