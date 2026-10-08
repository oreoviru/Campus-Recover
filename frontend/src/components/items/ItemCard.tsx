/**
 * Campus Recover — Item Card Component
 *
 * Rich display card for lost and found items with thumbnail image,
 * type badges, status indicator, location details, and time formatting.
 */

import React from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import {
  MapPin,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  PackageCheck,
  Laptop,
  Shirt,
  Glasses,
  CreditCard,
  Key,
  Briefcase,
  BookOpen,
  Dumbbell,
  Package,
} from "lucide-react";

import { Item, ItemType, ItemStatus, ItemCategory } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface ItemCardProps {
  item: Item;
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

const CATEGORY_ICONS: Record<ItemCategory, React.ElementType> = {
  [ItemCategory.ELECTRONICS]: Laptop,
  [ItemCategory.CLOTHING]: Shirt,
  [ItemCategory.ACCESSORIES]: Glasses,
  [ItemCategory.DOCUMENTS]: CreditCard,
  [ItemCategory.KEYS]: Key,
  [ItemCategory.BAGS]: Briefcase,
  [ItemCategory.BOOKS]: BookOpen,
  [ItemCategory.SPORTS]: Dumbbell,
  [ItemCategory.OTHER]: Package,
};

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const isFound = item.type === ItemType.FOUND;
  const CategoryIcon = CATEGORY_ICONS[item.category] || Package;

  // Format date safely
  let timeAgo = "Recently";
  try {
    const parsedDate = parseISO(item.date_time || item.created_at);
    if (isValid(parsedDate)) {
      timeAgo = formatDistanceToNow(parsedDate, { addSuffix: true });
    }
  } catch (e) {
    timeAgo = "Recently";
  }

  // Build image URL
  const imageUrl = item.image_url
    ? item.image_url.startsWith("http")
      ? item.image_url
      : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api/v1", "") : "http://localhost:8000"}${item.image_url}`
    : null;

  return (
    <Card
      hoverGlow
      className="group relative flex flex-col overflow-hidden bg-surface-900/60 hover:bg-surface-900/90 border-surface-800 hover:border-surface-700 transition-all duration-300"
    >
      {/* Thumbnail or Fallback Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-950/80">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-950 via-surface-900 to-surface-850 p-6 text-surface-500 group-hover:text-surface-400 transition-colors">
            <CategoryIcon className="w-12 h-12 stroke-[1.25] text-surface-600 group-hover:text-primary-400 transition-colors" />
            <span className="text-[11px] font-mono uppercase tracking-wider mt-2 text-surface-500">
              {item.category}
            </span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-surface-950/40 opacity-70" />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge
            variant={isFound ? "accent" : "warning"}
            size="sm"
            className="backdrop-blur-md shadow-md"
          >
            {isFound ? (
              <span className="flex items-center gap-1 font-semibold">
                <PackageCheck className="w-3 h-3" /> FOUND
              </span>
            ) : (
              <span className="flex items-center gap-1 font-semibold">
                <HelpCircle className="w-3 h-3" /> LOST
              </span>
            )}
          </Badge>

          {item.status !== ItemStatus.ACTIVE && (
            <Badge
              variant={
                item.status === ItemStatus.RECOVERED
                  ? "accent"
                  : item.status === ItemStatus.CLAIMED
                  ? "primary"
                  : "surface"
              }
              size="sm"
              className="backdrop-blur-md"
            >
              {item.status}
            </Badge>
          )}
        </div>

        {item.has_verification_question && (
          <div
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-surface-950/80 backdrop-blur-md text-accent-400 border border-accent-500/20 shadow-md"
            title="Ownership verification required to claim"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Category & Attributes */}
          <div className="flex items-center gap-2 text-xs text-surface-400">
            <span className="capitalize">{item.category.toLowerCase()}</span>
            {item.color && (
              <>
                <span>•</span>
                <span>{item.color}</span>
              </>
            )}
            {item.brand && (
              <>
                <span>•</span>
                <span className="font-medium text-surface-300">{item.brand}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-white line-clamp-1 group-hover:text-primary-300 transition-colors">
            {item.title}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-surface-300 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Footer Meta: Location & Time */}
        <div className="pt-3 border-t border-surface-850/80 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-surface-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0" />
            <span className="truncate">
              {item.campus_location?.name || item.location_name || "Campus Location"}
              {item.location_name && item.campus_location?.name && (
                <span className="text-surface-500"> • {item.location_name}</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-surface-500 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-surface-500" />
              {timeAgo}
            </span>

            <Link
              to={`/items/${item.id}`}
              className="inline-flex items-center gap-1 text-primary-400 group-hover:text-primary-300 font-medium hover:underline"
            >
              Details
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ItemCard;
