/**
 * Campus Recover — My Reports Management Page
 *
 * View and manage items reported by the currently authenticated user.
 * Allows quick filtering between Lost & Found reports, updating status,
 * or deleting resolved listings.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  PackagePlus,
  Inbox,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import { itemsApi } from "@/api/items";
import { Item, ItemType, ItemStatus } from "@/types";
import { ItemCard } from "@/components/items/ItemCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";

export const MyReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ALL" | ItemType>("ALL");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMyReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = activeTab === "ALL" ? undefined : activeTab;
      const res = await itemsApi.getMyReports({ type: typeParam });
      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setError(res.message || "Failed to load your reports.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Could not retrieve your reports. Please ensure you are logged in."
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await itemsApi.deleteItem(itemToDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkRecovered = async (item: Item) => {
    try {
      const res = await itemsApi.updateItem(item.id, {
        status: ItemStatus.RECOVERED,
      });
      if (res.success && res.data) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: ItemStatus.RECOVERED } : i
          )
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to update item status.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-850">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              My Submissions
            </Badge>
            <span className="text-xs text-surface-400">
              {items.length} {items.length === 1 ? "report" : "reports"} active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            My Reported Items
          </h1>
          <p className="text-sm text-surface-300">
            Keep track of items you lost or found. Update resolution status as items are recovered.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/report-lost">
            <Button variant="secondary" size="sm">
              <HelpCircle className="w-4 h-4 mr-1.5 text-amber-400" />
              Report Lost
            </Button>
          </Link>
          <Link to="/report-found">
            <Button variant="primary" size="sm" className="shadow-glow">
              <PackagePlus className="w-4 h-4 mr-1.5" />
              Report Found
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 rounded-2xl bg-surface-900 border border-surface-800 w-fit">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "ALL"
              ? "bg-surface-800 text-white shadow-sm"
              : "text-surface-400 hover:text-white"
          }`}
        >
          All Reports
        </button>
        <button
          onClick={() => setActiveTab(ItemType.LOST)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === ItemType.LOST
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-surface-400 hover:text-amber-300"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Lost Items
        </button>
        <button
          onClick={() => setActiveTab(ItemType.FOUND)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === ItemType.FOUND
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-surface-400 hover:text-emerald-300"
          }`}
        >
          <PackagePlus className="w-3.5 h-3.5" />
          Found Items
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-surface-900/40 border border-surface-800 space-y-3"
            >
              <Skeleton className="w-full aspect-[16/10] rounded-xl" />
              <Skeleton className="w-2/3 h-5 rounded-md" />
              <Skeleton className="w-full h-12 rounded-md" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load your reports"
          message={error}
          onRetry={fetchMyReports}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-12 h-12 text-surface-500" />}
          title="No reports logged yet"
          description={
            activeTab === "ALL"
              ? "You haven't reported any lost or found items yet."
              : `You don't have any active ${activeTab.toLowerCase()} item reports.`
          }
          actionLabel="Report an Item"
          onAction={() => (window.location.href = "/report-lost")}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl bg-surface-900/60 border border-surface-800 overflow-hidden shadow-lg group hover:border-surface-700 transition"
            >
              <ItemCard item={item} />

              {/* Owner Quick Action Bar */}
              <div className="px-4 py-3 bg-surface-950 border-t border-surface-850 flex items-center justify-between gap-2">
                {item.status !== ItemStatus.RECOVERED ? (
                  <button
                    type="button"
                    onClick={() => handleMarkRecovered(item)}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Recovered
                  </button>
                ) : (
                  <span className="text-xs text-surface-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Item Recovered
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setItemToDelete(item)}
                  className="p-1.5 text-surface-400 hover:text-danger-400 rounded-lg hover:bg-danger-500/10 transition"
                  title="Delete report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Delete Item Report"
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-300">
            Are you sure you want to delete your report for{" "}
            <span className="text-white font-semibold">
              "{itemToDelete?.title}"
            </span>
            ? This action cannot be reversed.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-800">
            <Button
              variant="secondary"
              onClick={() => setItemToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyReportsPage;
