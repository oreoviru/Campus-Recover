/**
 * Campus Recover — Item Search & Filters Bar
 *
 * Provides real-time filtering by search query, item type,
 * category, location, status, and sorting order.
 */

import React from "react";
import {
  Search,
  X,
  RotateCcw,
  PackageCheck,
  HelpCircle,
} from "lucide-react";

import {
  ItemType,
  ItemCategory,
  ItemStatus,
  ItemFilters,
  CampusLocation,
} from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface ItemFiltersBarProps {
  filters: ItemFilters;
  onFilterChange: (newFilters: Partial<ItemFilters>) => void;
  onReset: () => void;
  locations: CampusLocation[];
  totalResults?: number;
}

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: ItemCategory.ELECTRONICS, label: "Electronics" },
  { value: ItemCategory.CLOTHING, label: "Clothing" },
  { value: ItemCategory.ACCESSORIES, label: "Accessories" },
  { value: ItemCategory.DOCUMENTS, label: "Documents & IDs" },
  { value: ItemCategory.KEYS, label: "Keys" },
  { value: ItemCategory.BAGS, label: "Bags & Backpacks" },
  { value: ItemCategory.BOOKS, label: "Books & Study" },
  { value: ItemCategory.SPORTS, label: "Sports & Fitness" },
  { value: ItemCategory.OTHER, label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: ItemStatus.ACTIVE, label: "Active Only" },
  { value: ItemStatus.MATCHED, label: "Matched" },
  { value: ItemStatus.CLAIMED, label: "Claimed" },
  { value: ItemStatus.RECOVERED, label: "Recovered" },
];

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest Reported First" },
  { value: "created_at:asc", label: "Oldest Reported First" },
  { value: "date_time:desc", label: "Most Recently Occurred" },
  { value: "date_time:asc", label: "Earliest Occurred" },
];

export const ItemFiltersBar: React.FC<ItemFiltersBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  locations,
  totalResults,
}) => {
  const currentSortValue = `${filters.sort_by || "created_at"}:${filters.sort_order || "desc"}`;

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.type ||
      filters.category ||
      filters.location ||
      filters.status
  );

  const handleSortChange = (combined: string) => {
    const [sort_by, sort_order] = combined.split(":") as [
      "created_at" | "date_time" | "title",
      "asc" | "desc"
    ];
    onFilterChange({ sort_by, sort_order, page: 1 });
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-surface-900/60 border border-surface-800 shadow-lg backdrop-blur-md">
      {/* Top Row: Search Input + Type Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Input
            placeholder="Search items by keywords, brand, color, model, or description..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            leftIcon={<Search className="w-4 h-4 text-surface-400" />}
            rightIcon={
              filters.search ? (
                <button
                  type="button"
                  onClick={() => onFilterChange({ search: "", page: 1 })}
                  className="p-1 rounded-md text-surface-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Item Type Switcher Pills */}
        <div className="flex items-center p-1 rounded-xl bg-surface-950 border border-surface-800 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => onFilterChange({ type: undefined, page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              !filters.type
                ? "bg-surface-800 text-white shadow-sm"
                : "text-surface-400 hover:text-white"
            }`}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ type: ItemType.LOST, page: 1 })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filters.type === ItemType.LOST
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-surface-400 hover:text-amber-300"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Lost Only
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ type: ItemType.FOUND, page: 1 })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filters.type === ItemType.FOUND
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-surface-400 hover:text-emerald-300"
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            Found Only
          </button>
        </div>
      </div>

      {/* Bottom Filter Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-surface-850/80">
        {/* Category Dropdown */}
        <div>
          <Select
            value={filters.category || ""}
            onChange={(e) =>
              onFilterChange({
                category: (e.target.value as ItemCategory) || undefined,
                page: 1,
              })
            }
            options={CATEGORY_OPTIONS}
          />
        </div>

        {/* Location Dropdown */}
        <div>
          <Select
            value={filters.location || ""}
            onChange={(e) =>
              onFilterChange({
                location: e.target.value || undefined,
                page: 1,
              })
            }
            options={[
              { value: "", label: "All Campus Locations" },
              ...locations.map((loc) => ({
                value: loc.id,
                label: loc.name,
              })),
            ]}
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <Select
            value={filters.status || ""}
            onChange={(e) =>
              onFilterChange({
                status: (e.target.value as ItemStatus) || undefined,
                page: 1,
              })
            }
            options={STATUS_OPTIONS}
          />
        </div>

        {/* Sorting Dropdown */}
        <div>
          <Select
            value={currentSortValue}
            onChange={(e) => handleSortChange(e.target.value)}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {/* Filter Info & Reset Action */}
      <div className="flex items-center justify-between text-xs text-surface-400 pt-1">
        <span>
          {typeof totalResults === "number" ? (
            <>
              Showing <span className="text-white font-medium">{totalResults}</span>{" "}
              {totalResults === 1 ? "item" : "items"}
            </>
          ) : (
            "Filter items"
          )}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemFiltersBar;
