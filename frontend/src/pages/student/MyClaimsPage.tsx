/**
 * Campus Recover — My Claims Dashboard (Phase 8)
 *
 * Displays both:
 * 1. Claims submitted by the current student asserting ownership over found items
 * 2. Incoming claims received on items the current student found and reported
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import {
  ShieldCheck,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  Calendar,
  ChevronRight,
  Inbox,
  Send,
  Sparkles,
} from "lucide-react";

import { claimsApi } from "@/api/claims";
import { Claim, ClaimStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

type TabMode = "submitted" | "incoming";

export const MyClaimsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>("submitted");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | undefined>(undefined);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === "submitted") {
        res = await claimsApi.getMyClaims(statusFilter);
      } else {
        res = await claimsApi.getIncomingClaims(statusFilter);
      }

      if (res.success && res.data) {
        setClaims(res.data);
      }
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [activeTab, statusFilter]);

  const pendingCount = claims.filter((c) => c.status === ClaimStatus.PENDING).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-mono mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OWNERSHIP CLAIMS & VERIFICATION • PHASE 8</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Claims Management Hub
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Track claims you filed for your lost belongings and review ownership proof submitted for items you found.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/browse">
            <Button variant="outline" size="sm" className="text-xs">
              Browse Found Items
            </Button>
          </Link>
          <Link to="/matches">
            <Button variant="primary" size="sm" className="text-xs shadow-glow">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              AI Match Radar
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-3">
        <div className="flex items-center space-x-2 bg-surface-900/60 p-1 rounded-2xl border border-surface-800 w-fit">
          <button
            type="button"
            onClick={() => {
              setActiveTab("submitted");
              setStatusFilter(undefined);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "submitted"
                ? "bg-primary-600 text-white shadow-md"
                : "text-surface-400 hover:text-white hover:bg-surface-800"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Claims I Submitted</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("incoming");
              setStatusFilter(undefined);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition relative ${
              activeTab === "incoming"
                ? "bg-primary-600 text-white shadow-md"
                : "text-surface-400 hover:text-white hover:bg-surface-800"
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Claims to Review</span>
            {activeTab === "incoming" && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-accent-400 text-surface-950 font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1.5">
          <Button
            variant={statusFilter === undefined ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(undefined)}
            className="text-xs h-8"
          >
            All
          </Button>
          <Button
            variant={statusFilter === ClaimStatus.PENDING ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(ClaimStatus.PENDING)}
            className="text-xs h-8"
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === ClaimStatus.APPROVED ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(ClaimStatus.APPROVED)}
            className="text-xs h-8"
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === ClaimStatus.REJECTED ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(ClaimStatus.REJECTED)}
            className="text-xs h-8"
          >
            Rejected
          </Button>
        </div>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-2xl w-full" />
          <Skeleton className="h-28 rounded-2xl w-full" />
          <Skeleton className="h-28 rounded-2xl w-full" />
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 text-primary-400" />}
          title={
            activeTab === "submitted"
              ? "No Claims Submitted"
              : "No Incoming Claims to Review"
          }
          description={
            activeTab === "submitted"
              ? "You haven't submitted any ownership claims yet. When you recognize your belongings in browse or AI matches, submit a claim to initiate recovery."
              : "No claims have been submitted by other students on items you found. When someone recognizes an item, their answer will appear here for your review."
          }
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const item = claim.item;
            const isApproved = claim.status === ClaimStatus.APPROVED;
            const isPending = claim.status === ClaimStatus.PENDING;

            const formattedDate = claim.created_at
              ? (() => {
                  try {
                    const parsed = parseISO(claim.created_at);
                    return isValid(parsed) ? format(parsed, "MMM d, yyyy") : "Recent";
                  } catch {
                    return "Recent";
                  }
                })()
              : "Recent";

            return (
              <div
                key={claim.id}
                className="bg-surface-850 border border-surface-700/60 hover:border-surface-600 rounded-2xl p-5 transition-all shadow-md hover:shadow-xl group"
              >
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                  {/* Left: Thumbnail & Item Info */}
                  <div className="flex gap-4 items-start sm:items-center min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-surface-900 border border-surface-700 overflow-hidden flex-shrink-0">
                      {item?.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-surface-500">
                          <Package className="w-6 h-6 opacity-40" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-white group-hover:text-primary-300 transition truncate">
                          {item?.title || "Item Claim"}
                        </h4>
                        <Badge
                          variant={
                            isApproved
                              ? "accent"
                              : isPending
                              ? "warning"
                              : "surface"
                          }
                          size="sm"
                        >
                          {claim.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400">
                        {item?.category && (
                          <span className="inline-flex items-center text-surface-300">
                            <Layers className="w-3.5 h-3.5 mr-1 text-primary-400" />
                            {item.category}
                          </span>
                        )}
                        {item?.location_name && (
                          <span className="inline-flex items-center text-surface-300">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            {item.location_name}
                          </span>
                        )}
                        <span className="inline-flex items-center text-surface-500">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          Submitted {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & Status details */}
                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-end border-t sm:border-t-0 border-surface-800 pt-3 sm:pt-0">
                    {isApproved && (
                      <span className="hidden md:inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Contact Unlocked
                      </span>
                    )}

                    <Link to={`/claims/${claim.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Claim Details <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
