/**
 * Campus Recover — Notification Dropdown Component (Phase 9)
 *
 * Real-time notification bell dropdown in the navigation header,
 * featuring unread badge pulse, quick mark-as-read, and deep links.
 */

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import {
  Bell,
  Check,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  PackageCheck,
  Megaphone,
  Trash2,
  Inbox,
  ChevronRight,
} from "lucide-react";

import { useNotifications } from "@/store/NotificationContext";
import { Notification, NotificationType } from "@/types";

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.MATCH_FOUND:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case NotificationType.CLAIM_SUBMITTED:
        return <ShieldAlert className="w-4 h-4 text-primary-400" />;
      case NotificationType.CLAIM_APPROVED:
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case NotificationType.CLAIM_REJECTED:
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case NotificationType.ITEM_RECOVERED:
        return <PackageCheck className="w-4 h-4 text-accent-400" />;
      case NotificationType.ADMIN_MESSAGE:
        return <Megaphone className="w-4 h-4 text-danger-400" />;
      default:
        return <Bell className="w-4 h-4 text-surface-400" />;
    }
  };

  const getDestinationUrl = (notif: Notification): string => {
    if (notif.type === NotificationType.MATCH_FOUND) {
      return notif.related_item_id ? `/items/${notif.related_item_id}` : "/matches";
    }
    if (
      notif.type === NotificationType.CLAIM_SUBMITTED ||
      notif.type === NotificationType.CLAIM_APPROVED ||
      notif.type === NotificationType.CLAIM_REJECTED
    ) {
      return "/my-claims";
    }
    if (notif.type === NotificationType.ITEM_RECOVERED) {
      return notif.related_item_id ? `/items/${notif.related_item_id}` : "/my-claims";
    }
    return "/notifications";
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    navigate(getDestinationUrl(notif));
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const parsed = parseISO(dateStr);
      return isValid(parsed)
        ? formatDistanceToNow(parsed, { addSuffix: true }).replace("about ", "")
        : "just now";
    } catch {
      return "just now";
    }
  };

  const recentNotifications = notifications.slice(0, 6);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className={`relative p-2 rounded-xl transition flex items-center justify-center ${
          isOpen
            ? "bg-surface-800 text-white"
            : "text-surface-400 hover:text-white hover:bg-surface-850"
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold font-mono text-white shadow-lg ring-2 ring-surface-950 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-surface-900/95 backdrop-blur-xl border border-surface-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800/80 bg-surface-950/40">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary-500/10 text-primary-400 border border-primary-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-surface-400 hover:text-primary-400 transition flex items-center gap-1 font-medium"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-surface-850/60 scrollbar-hide">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Inbox className="w-8 h-8 text-surface-600 mx-auto" />
                <p className="text-xs font-medium text-surface-400">
                  All caught up! No notifications.
                </p>
                <p className="text-[11px] text-surface-500">
                  You'll be alerted when matches, claims, or campus updates arrive.
                </p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition group ${
                    notif.read
                      ? "hover:bg-surface-850/50 opacity-80 hover:opacity-100"
                      : "bg-surface-850/70 hover:bg-surface-800/80"
                  }`}
                >
                  {/* Icon badge */}
                  <div className="p-2 rounded-xl bg-surface-950 border border-surface-800 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-white truncate block group-hover:text-primary-300 transition">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-surface-300 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-surface-500 font-mono">
                        {formatRelativeTime(notif.created_at)}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="p-1 text-surface-400 hover:text-white"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="p-1 text-surface-400 hover:text-danger-400"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View All Link */}
          <div className="p-2.5 border-t border-surface-800/80 bg-surface-950/60 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-primary-400 hover:text-primary-300 transition flex items-center justify-center gap-1 py-1"
            >
              <span>View all notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
