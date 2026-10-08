/**
 * Campus Recover — Browse Items Registry Page
 *
 * Public repository for browsing, searching, and filtering all active
 * lost and found items reported across campus.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  HelpCircle,
  PackagePlus,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Compass,
} from "lucide-react";

import { itemsApi } from "@/api/items";
import {
  Item,
  ItemFilters,
  ItemType,
  ItemCategory,
  ItemStatus,
  CampusLocation,
  PaginationMeta,
} from "@/types";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemFiltersBar } from "@/components/items/ItemFiltersBar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export const BrowseItemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse initial filters from URL params
  const [filters, setFilters] = useState<ItemFilters>({
    type: (searchParams.get("type") as ItemType) || undefined,
    category: (searchParams.get("category") as ItemCategory) || undefined,
    status: (searchParams.get("status") as ItemStatus) || undefined,
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    per_page: 12,
    sort_by: (searchParams.get("sort_by") as any) || "created_at",
    sort_order: (searchParams.get("sort_order") as any) || "desc",
  });

  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    per_page: 12,
    total: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load campus locations once
  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await itemsApi.getCampusLocations();
        if (res.success && res.data) {
          setLocations(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch campus locations", err);
      }
    }
    loadLocations();
  }, []);

  // Fetch items whenever filters change
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await itemsApi.getItems(filters);
      if (res.success && res.data) {
        setItems(res.data);
        if (res.meta) {
          setMeta(res.meta);
        }
      } else {
        setError(res.message || "Failed to load items registry.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Could not connect to the campus registry. Please check your network connection."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFilterChange = (newFilters: Partial<ItemFilters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      // Update URL search query
      const params = new URLSearchParams();
      if (updated.type) params.set("type", updated.type);
      if (updated.category) params.set("category", updated.category);
      if (updated.status) params.set("status", updated.status);
      if (updated.search) params.set("search", updated.search);
      if (updated.location) params.set("location", updated.location);
      if (updated.page && updated.page > 1)
        params.set("page", updated.page.toString());
      setSearchParams(params, { replace: true });
      return updated;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      type: undefined,
      category: undefined,
      status: undefined,
      search: "",
      location: undefined,
      page: 1,
      per_page: 12,
      sort_by: "created_at",
      sort_order: "desc",
    });
    setSearchParams({}, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > meta.total_pages) return;
    handleFilterChange({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-surface-850">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono uppercase bg-primary-950 text-primary-400 border border-primary-800">
              Live Database
            </span>
            <span className="text-xs text-surface-400">
              Updated in real-time
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Campus Lost & Found Registry
          </h1>
          <p className="text-sm sm:text-base text-surface-300 max-w-2xl">
            Browse through active reports from libraries, student centres,
            labs, and athletic complexes.
          </p>
        </div>

        {/* Quick Report & Map CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/map">
            <Button variant="secondary" className="border-primary-500/30 text-primary-300 hover:text-white">
              <Compass className="w-4 h-4 mr-2 text-primary-400" />
              Campus Map
            </Button>
          </Link>
          <Link to="/report-lost">
            <Button variant="secondary" className="border-surface-700">
              <HelpCircle className="w-4 h-4 mr-2 text-amber-400" />
              Report Lost
            </Button>
          </Link>
          <Link to="/report-found">
            <Button variant="primary" className="shadow-glow">
              <PackagePlus className="w-4 h-4 mr-2" />
              Report Found
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <ItemFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        locations={locations}
        totalResults={meta.total}
      />

      {/* Results Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-surface-900/40 border border-surface-800 space-y-3"
            >
              <Skeleton className="w-full aspect-[16/10] rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
              <Skeleton className="w-3/4 h-5 rounded-md" />
              <Skeleton className="w-full h-10 rounded-md" />
              <Skeleton className="w-1/2 h-4 rounded-md" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load items"
          message={error}
          onRetry={fetchItems}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-12 h-12 text-surface-500" />}
          title="No items found"
          description={
            filters.search || filters.category || filters.type || filters.location
              ? "We couldn't find any items matching your active search filters. Try broadening your criteria."
              : "There are currently no items logged in the registry."
          }
          actionLabel={
            filters.search || filters.category || filters.type || filters.location
              ? "Reset All Filters"
              : "Report an Item"
          }
          onAction={
            filters.search || filters.category || filters.type || filters.location
              ? handleResetFilters
              : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination Controls */}
          {meta.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-surface-850">
              <span className="text-xs text-surface-400">
                Page <span className="text-white font-medium">{meta.page}</span>{" "}
                of{" "}
                <span className="text-white font-medium">
                  {meta.total_pages}
                </span>{" "}
                ({meta.total} total items)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: meta.total_pages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === meta.total_pages ||
                        Math.abs(p - meta.page) <= 1
                    )
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <React.Fragment key={p}>
                          {prev && p - prev > 1 && (
                            <span className="px-2 text-surface-500 text-xs">
                              ...
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePageChange(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                              p === meta.page
                                ? "bg-primary-600 text-white shadow-sm"
                                : "text-surface-400 hover:text-white hover:bg-surface-800"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.total_pages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrowseItemsPage;
