/**
 * Campus Recover — Notifications Center Page (Phase 9)
 *
 * Full notifications inbox featuring category filtering, bulk actions,
 * interactive claim/match deep links, and admin announcement broadcasting.
 */

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import {
  Bell,
  CheckCheck,
  Check,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  PackageCheck,
  Megaphone,
  Trash2,
  ExternalLink,
  RefreshCw,
  Send,
  Inbox,
} from "lucide-react";

import { useNotifications } from "@/store/NotificationContext";
import { useAuth } from "@/hooks/useAuth";
import { Notification, NotificationType, UserRole } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { notificationsApi } from "@/api/notifications";

type FilterTab = "ALL" | "UNREAD" | "MATCHES" | "CLAIMS" | "NOTICES";

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  // Admin Broadcast Modal
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeTab === "UNREAD") return !notif.read;
      if (activeTab === "MATCHES") return notif.type === NotificationType.MATCH_FOUND;
      if (activeTab === "CLAIMS")
        return (
          notif.type === NotificationType.CLAIM_SUBMITTED ||
          notif.type === NotificationType.CLAIM_APPROVED ||
          notif.type === NotificationType.CLAIM_REJECTED ||
          notif.type === NotificationType.ITEM_RECOVERED
        );
      if (activeTab === "NOTICES") return notif.type === NotificationType.ADMIN_MESSAGE;
      return true;
    });
  }, [notifications, activeTab]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.MATCH_FOUND:
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case NotificationType.CLAIM_SUBMITTED:
        return <ShieldAlert className="w-5 h-5 text-primary-400" />;
      case NotificationType.CLAIM_APPROVED:
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case NotificationType.CLAIM_REJECTED:
        return <XCircle className="w-5 h-5 text-rose-400" />;
      case NotificationType.ITEM_RECOVERED:
        return <PackageCheck className="w-5 h-5 text-accent-400" />;
      case NotificationType.ADMIN_MESSAGE:
        return <Megaphone className="w-5 h-5 text-danger-400" />;
      default:
        return <Bell className="w-5 h-5 text-surface-400" />;
    }
  };

  const getDestinationUrl = (notif: Notification): string | null => {
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
    return null;
  };

  const getActionLabel = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.MATCH_FOUND:
        return "View Match Counterpart";
      case NotificationType.CLAIM_SUBMITTED:
      case NotificationType.CLAIM_APPROVED:
      case NotificationType.CLAIM_REJECTED:
        return "View Claim Details";
      case NotificationType.ITEM_RECOVERED:
        return "View Recovered Item";
      default:
        return "View Details";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const parsed = parseISO(dateStr);
      return isValid(parsed) ? format(parsed, "MMM d, yyyy • h:mm a") : "Recent";
    } catch {
      return "Recent";
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setSubmittingBroadcast(true);
    setBroadcastSuccess(null);
    try {
      const res = await notificationsApi.adminBroadcast({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
      });
      if (res.success) {
        setBroadcastSuccess(
          `Announcement successfully broadcast to ${res.data?.recipients_notified ?? 0} campus members!`
        );
        setBroadcastTitle("");
        setBroadcastMessage("");
        setTimeout(() => setBroadcastModalOpen(false), 2000);
        refreshNotifications();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to deliver broadcast.");
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
                <Bell className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                Notifications & Activity Center
              </h1>
            </div>
            <p className="text-sm text-surface-400">
              Stay updated on automated AI matches, verification claims, custody handovers, and security notices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {user?.role === UserRole.ADMIN && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setBroadcastModalOpen(true)}
                className="gap-2 bg-gradient-to-r from-danger-600 to-primary-600 hover:from-danger-500 hover:to-primary-500"
              >
                <Megaphone className="w-4 h-4" />
                Staff Broadcast
              </Button>
            )}

            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="w-4 h-4 text-primary-400" />
                Mark all read
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              disabled={loading}
              className="gap-2 text-surface-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === "ALL"
              ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
              : "bg-surface-900/60 text-surface-400 hover:text-white border border-surface-800"
          }`}
        >
          All Notifications ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab("UNREAD")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "UNREAD"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : "bg-surface-900/60 text-surface-400 hover:text-white border border-surface-800"
          }`}
        >
          <span>Unread Only</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-300">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("MATCHES")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "MATCHES"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-surface-900/60 text-surface-400 hover:text-white border border-surface-800"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Matches</span>
        </button>

        <button
          onClick={() => setActiveTab("CLAIMS")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "CLAIMS"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-surface-900/60 text-surface-400 hover:text-white border border-surface-800"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Claims & Recovery</span>
        </button>

        <button
          onClick={() => setActiveTab("NOTICES")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "NOTICES"
              ? "bg-danger-500/20 text-danger-300 border border-danger-500/30"
              : "bg-surface-900/60 text-surface-400 hover:text-white border border-surface-800"
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-danger-400" />
          <span>Campus Notices</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-surface-900/40 border border-surface-800 rounded-3xl space-y-3">
            <Inbox className="w-10 h-10 text-surface-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No notifications in this view</h3>
            <p className="text-xs text-surface-400 max-w-sm mx-auto">
              {activeTab === "UNREAD"
                ? "You have read all your notifications! Great job staying up to date."
                : "No activity records found matching this category."}
            </p>
            {activeTab !== "ALL" && (
              <Button variant="secondary" size="sm" onClick={() => setActiveTab("ALL")}>
                View All Notifications
              </Button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const destUrl = getDestinationUrl(notif);

            return (
              <Card
                key={notif.id}
                className={`p-4 sm:p-5 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  notif.read
                    ? "bg-surface-900/40 border-surface-800/80 opacity-85 hover:opacity-100"
                    : "bg-surface-900/80 border-surface-700 shadow-md ring-1 ring-primary-500/20"
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Icon badge */}
                  <div className="p-3 rounded-2xl bg-surface-950 border border-surface-800 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                          NEW
                        </span>
                      )}
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-800 text-surface-400">
                        {notif.type.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-surface-300 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    <div className="text-[11px] text-surface-500 font-mono pt-1">
                      {formatDate(notif.created_at)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {destUrl && (
                    <Link
                      to={destUrl}
                      onClick={() => {
                        if (!notif.read) markAsRead(notif.id);
                      }}
                    >
                      <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                        <span>{getActionLabel(notif.type)}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-surface-400" />
                      </Button>
                    </Link>
                  )}

                  {!notif.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notif.id)}
                      className="text-xs text-surface-400 hover:text-white"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notif.id)}
                    className="text-xs text-surface-400 hover:text-danger-400"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Admin Broadcast Modal */}
      <Modal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        title="Campus Security Official Announcement"
      >
        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <p className="text-xs text-surface-400">
            Send a high-priority notification to all active registered campus users. Real-time alerts will appear across all student sessions immediately.
          </p>

          {broadcastSuccess && (
            <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-300 text-xs">
              {broadcastSuccess}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-300 uppercase tracking-wider block">
              Announcement Title
            </label>
            <input
              type="text"
              required
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. Lost Items Desk Relocation Notice"
              className="w-full bg-surface-950 border border-surface-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-surface-300 uppercase tracking-wider block">
              Announcement Details
            </label>
            <textarea
              rows={4}
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Provide clear details and student recovery instructions..."
              className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3.5 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-800">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setBroadcastModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={submittingBroadcast}
              className="gap-2 bg-gradient-to-r from-danger-600 to-primary-600"
            >
              <Send className="w-3.5 h-3.5" />
              Send Campus Broadcast
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
