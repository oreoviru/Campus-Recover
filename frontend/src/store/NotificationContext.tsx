/**
 * Campus Recover — Notification Context & Real-Time Sync (Phase 9)
 *
 * Provides reactive unread badge counts, notification state management,
 * WebSocket real-time subscription, and fallback polling synchronization.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Notification } from "@/types";
import { notificationsApi } from "@/api/notifications";
import { useAuth } from "@/hooks/useAuth";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Fetch notifications from REST API
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        notificationsApi.getNotifications(false, undefined, 1, 25),
        notificationsApi.getUnreadCount(),
      ]);

      if (listRes.success && listRes.data) {
        setNotifications(listRes.data.notifications);
      }
      if (countRes.success && countRes.data) {
        setUnreadCount(countRes.data.unread_count);
      }
    } catch (err) {
      console.warn("Failed to synchronize notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
      // Re-fetch on error to revert to server truth
      refreshNotifications();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await notificationsApi.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
      refreshNotifications();
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await notificationsApi.deleteNotification(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      refreshNotifications();
    }
  };

  // WebSocket Connection Management
  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    // Initial fetch
    refreshNotifications();

    const token = localStorage.getItem("token");
    if (!token) return;

    function connectWs() {
      // Determine protocol and host
      const isHttps = window.location.protocol === "https:";
      const wsProtocol = isHttps ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = "8000"; // Backend API port
      const wsUrl = `${wsProtocol}//${host}:${port}/api/v1/notifications/ws?token=${token}`;

      try {
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          // Connected
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === "new_notification" && data.notification) {
              const newNotif = data.notification as Notification;
              setNotifications((prev) => [newNotif, ...prev]);
              if (typeof data.unread_count === "number") {
                setUnreadCount(data.unread_count);
              } else {
                setUnreadCount((prev) => prev + 1);
              }
            } else if (data.event === "unread_count_update") {
              if (typeof data.unread_count === "number") {
                setUnreadCount(data.unread_count);
              }
              if (data.notification_id) {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === data.notification_id ? { ...n, read: true } : n
                  )
                );
              }
            }
          } catch {
            // Non-JSON message (e.g. pong)
          }
        };

        socket.onerror = () => {
          // Socket error, fallback to polling
        };

        socket.onclose = () => {
          wsRef.current = null;
          // Reconnect with backoff if user is still logged in
          if (isAuthenticated) {
            reconnectTimeoutRef.current = window.setTimeout(connectWs, 5000);
          }
        };

        wsRef.current = socket;
      } catch {
        // Fallback polling will handle updates
      }
    }

    connectWs();

    // Polling fallback every 20 seconds to guarantee consistency
    const pollInterval = window.setInterval(() => {
      notificationsApi.getUnreadCount().then((res) => {
        if (res.success && res.data) {
          setUnreadCount(res.data.unread_count);
        }
      }).catch(() => {});
    }, 20000);

    // Refresh when user returns to window tab
    const handleFocus = () => {
      refreshNotifications();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
