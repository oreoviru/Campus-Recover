/**
 * Campus Recover — Item Details Page
 *
 * Full item profile displaying high-res photos, physical attributes,
 * campus location details, timestamps, ownership verification requirements,
 * and authorized management actions (edit/delete for report owner).
 */

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Shield,
  User as UserIcon,
  Trash2,
  Share2,
  CheckCircle2,
  HelpCircle,
  PackageCheck,
  Tag,
  AlertTriangle,
  Check,
  Sparkles,
  Compass,
  ShieldAlert,
} from "lucide-react";

import { itemsApi } from "@/api/items";
import { matchesApi } from "@/api/matches";
import { useAuth } from "@/hooks/useAuth";
import { Item, ItemType, ItemStatus, UserRole, Match } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { MatchCard } from "@/components/matches/MatchCard";
import { CampusMap } from "@/components/map/CampusMap";

export const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // AI Matches state
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    async function loadItem() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await itemsApi.getItem(id);
        if (res.success && res.data) {
          setItem(res.data);
        } else {
          setError(res.message || "Item not found in campus database.");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.detail ||
            "Unable to locate this item. It may have been removed or resolved."
        );
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [id]);

  useEffect(() => {
    async function loadItemMatches() {
      if (!id || !user || !item) return;
      if (item.user_id !== user.id && user.role !== UserRole.ADMIN) return;
      try {
        setLoadingMatches(true);
        const res = await matchesApi.getItemMatches(id);
        if (res.success && res.data) {
          setMatches(res.data);
        }
      } catch (err) {
        console.error("Could not fetch matches for item:", err);
      } finally {
        setLoadingMatches(false);
      }
    }
    loadItemMatches();
  }, [id, user, item]);

  const handleConfirmMatch = async (matchId: string) => {
    try {
      await matchesApi.confirmMatch(matchId);
      if (id) {
        const res = await matchesApi.getItemMatches(id);
        if (res.success && res.data) setMatches(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to confirm match candidate.");
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    try {
      await matchesApi.rejectMatch(matchId);
      if (id) {
        const res = await matchesApi.getItemMatches(id);
        if (res.success && res.data) setMatches(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject match candidate.");
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      await itemsApi.deleteItem(item.id);
      navigate("/browse");
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message ||
          "Failed to delete item. Please verify your permissions."
      );
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <Skeleton className="w-32 h-9 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="w-full aspect-video rounded-3xl" />
            <Skeleton className="w-3/4 h-10 rounded-xl" />
            <Skeleton className="w-full h-32 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="w-full h-48 rounded-2xl" />
            <Skeleton className="w-full h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-danger-500/10 border border-danger-500/20 text-danger-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Item Report Not Found</h2>
        <p className="text-sm text-surface-400">
          {error || "The item you requested does not exist or has been removed."}
        </p>
        <div className="pt-2">
          <Link to="/browse">
            <Button variant="primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse Registry
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && item.user_id === user.id;
  const isAdmin = user && user.role === UserRole.ADMIN;
  const canManage = isOwner || isAdmin;
  const isFound = item.type === ItemType.FOUND;

  // Format dates
  let dateFormatted = "Unknown";
  try {
    const d = parseISO(item.date_time);
    if (isValid(d)) {
      dateFormatted = format(d, "EEEE, MMMM d, yyyy 'at' h:mm a");
    }
  } catch (e) {
    dateFormatted = item.date_time;
  }

  let reportedFormatted = "Unknown";
  try {
    const d = parseISO(item.created_at);
    if (isValid(d)) {
      reportedFormatted = format(d, "MMM d, yyyy");
    }
  } catch (e) {
    reportedFormatted = item.created_at;
  }

  const imageUrl = item.image_url
    ? item.image_url.startsWith("http")
      ? item.image_url
      : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api/v1", "") : "http://localhost:8000"}${item.image_url}`
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Navigation & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-sm text-surface-400 hover:text-white transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Registry</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-900 hover:bg-surface-850 text-surface-300 hover:text-white border border-surface-800 text-xs font-medium transition"
            title="Share report"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>

          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column Details & Right Column Sidecards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image, Title, Description, Attributes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Media Preview Card */}
          <div className="rounded-3xl overflow-hidden border border-surface-800 bg-surface-950 shadow-2xl relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.title}
                className="w-full max-h-[460px] object-contain bg-surface-950/90 mx-auto"
              />
            ) : (
              <div className="w-full h-72 flex flex-col items-center justify-center bg-surface-900/60 text-surface-500">
                <Tag className="w-16 h-16 stroke-1 text-surface-600 mb-2" />
                <span className="text-sm font-medium">No photo uploaded</span>
              </div>
            )}

            {/* Float Badges on Image */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Badge
                variant={isFound ? "accent" : "warning"}
                size="md"
                className="backdrop-blur-md shadow-lg font-bold"
              >
                {isFound ? (
                  <span className="flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4" /> FOUND ITEM
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> LOST ITEM
                  </span>
                )}
              </Badge>

              <Badge
                variant={
                  item.status === ItemStatus.ACTIVE
                    ? "primary"
                    : item.status === ItemStatus.RECOVERED
                    ? "accent"
                    : "surface"
                }
                size="md"
                className="backdrop-blur-md shadow-lg"
              >
                {item.status}
              </Badge>
            </div>
          </div>

          {/* Title & Core Narrative */}
          <Card className="p-6 sm:p-8 bg-surface-900/60 border-surface-800 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-primary-400 uppercase tracking-wider mb-1">
                <span>{item.category}</span>
                {item.subcategory && <span>• {item.subcategory}</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                {item.title}
              </h1>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-surface-400 mb-2">
                Detailed Report Narrative
              </h3>
              <p className="text-surface-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          </Card>

          {/* Physical Attributes & Identifiers Grid */}
          <Card className="p-6 sm:p-8 bg-surface-900/60 border-surface-800 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Physical Attributes & Identification
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-850">
                <span className="text-[11px] text-surface-400 font-medium block">
                  Color
                </span>
                <span className="text-sm text-white font-semibold mt-0.5 block truncate">
                  {item.color || "Not specified"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-850">
                <span className="text-[11px] text-surface-400 font-medium block">
                  Brand / Make
                </span>
                <span className="text-sm text-white font-semibold mt-0.5 block truncate">
                  {item.brand || "Not specified"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-850 sm:col-span-2">
                <span className="text-[11px] text-surface-400 font-medium block">
                  Serial / Student ID / IMEI
                </span>
                <span className="text-sm font-mono text-primary-300 font-semibold mt-0.5 block truncate">
                  {item.serial_number || "None provided"}
                </span>
              </div>
            </div>

            {item.distinguishing_marks && (
              <div className="p-4 rounded-xl bg-surface-950/80 border border-surface-850 mt-3">
                <span className="text-xs text-surface-400 font-medium block">
                  Distinguishing Marks or Unique Customizations
                </span>
                <p className="text-sm text-surface-200 mt-1">
                  {item.distinguishing_marks}
                </p>
              </div>
            )}
          </Card>

          {/* Verification Shield Notice (Found Item) */}
          {isFound && item.has_verification_question && (
            <div className="p-5 rounded-2xl bg-accent-950/30 border border-accent-500/30 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-400 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  Protected by Campus Security Verification
                </h4>
                <p className="text-xs text-surface-300 leading-relaxed">
                  The finder has registered a private verification question for this item. Anyone wishing to claim ownership must correctly describe identifying features before custody can be transferred.
                </p>
              </div>
            </div>
          )}

          {/* AI Match Candidates Section (Report Owner or Admin) */}
          {(user?.id === item.user_id || user?.role === UserRole.ADMIN) && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      AI Match Candidates
                    </h3>
                    <p className="text-xs text-surface-400">
                      Multi-modal CLIP vision & semantic comparisons
                    </p>
                  </div>
                </div>
                {matches.length > 0 && (
                  <Badge variant="accent" size="sm">
                    {matches.length} {matches.length === 1 ? "Candidate" : "Candidates"}
                  </Badge>
                )}
              </div>

              {loadingMatches ? (
                <Skeleton className="h-32 rounded-2xl w-full" />
              ) : matches.length === 0 ? (
                <div className="p-5 rounded-2xl bg-surface-900/60 border border-surface-800 text-center space-y-2">
                  <Sparkles className="w-6 h-6 text-primary-400/60 mx-auto" />
                  <p className="text-xs text-surface-300">
                    No matching counterparts detected currently. As matching items are filed across campus, our background engine will evaluate visual and semantic similarity automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      currentUserId={user?.id}
                      onConfirm={handleConfirmMatch}
                      onReject={handleRejectMatch}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Location, Timestamps, Reporter, CTAs */}
        <div className="space-y-6">
          {/* Action Call to Action Card */}
          <Card className="p-6 bg-gradient-to-br from-surface-900 to-surface-950 border-surface-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {isFound ? "Recognize this item?" : "Have you seen this?"}
            </h3>
            <p className="text-xs text-surface-300 leading-relaxed">
              {isFound
                ? "If this belongs to you, initiate a verification claim to contact campus custody and schedule recovery."
                : "If you found this item or have custody of it, let the owner know or hand it to campus security."}
            </p>

            <div className="pt-2 space-y-2">
              {isFound ? (
                user?.id === item.user_id ? (
                  <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 text-center">
                    <span className="text-xs text-primary-400 font-medium">
                      You reported finding this item
                    </span>
                  </div>
                ) : item.status === ItemStatus.RECOVERED ? (
                  <Button variant="secondary" className="w-full text-xs" disabled>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-accent-400" />
                    Item Recovered & Returned
                  </Button>
                ) : item.status === ItemStatus.CLAIMED ? (
                  <Button variant="secondary" className="w-full text-xs" disabled>
                    <PackageCheck className="w-4 h-4 mr-2 text-warning-400" />
                    Claim Under Review
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full shadow-glow"
                    onClick={() => navigate(`/items/${item.id}/claim`)}
                  >
                    <PackageCheck className="w-4 h-4 mr-2" />
                    Claim Ownership
                  </Button>
                )
              ) : (
                <Button
                  variant="primary"
                  className="w-full shadow-glow"
                  onClick={() => navigate(`/report-found?lost_item_id=${item.id}`)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  I Found This Item
                </Button>
              )}

              <Link to="/browse" className="block">
                <Button variant="secondary" className="w-full text-xs">
                  Browse Other Items
                </Button>
              </Link>
            </div>
          </Card>

          {/* Location Information Card */}
          <Card className="p-6 bg-surface-900/60 border-surface-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>Location Details</span>
              </div>
              <Link to="/map" className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" />
                <span>Campus Map</span>
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {item.campus_location && (
                <div className="p-3 rounded-xl bg-surface-950 border border-surface-850">
                  <span className="text-surface-400 block font-medium">
                    Campus Facility
                  </span>
                  <span className="text-sm font-semibold text-white block mt-0.5">
                    {item.campus_location.name}
                  </span>
                  {item.campus_location.building && (
                    <span className="text-[11px] text-primary-400/90 block mt-0.5">
                      Building: {item.campus_location.building} • Floor:{" "}
                      {item.campus_location.floor || "Main"}
                    </span>
                  )}
                </div>
              )}

              {item.location_name && (
                <div>
                  <span className="text-surface-400 block font-medium">
                    Specific Room or Spot
                  </span>
                  <span className="text-surface-200 block mt-0.5 font-medium">
                    {item.location_name}
                  </span>
                </div>
              )}

              {/* Privacy Shield Notice for sensitive item */}
              {["ELECTRONICS", "DOCUMENTS", "KEYS", "ACCESSORIES"].includes(item.category) &&
                (!user || (user.id !== item.user_id && user.role !== UserRole.ADMIN)) && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Protected:</strong> Exact pin coordinates are generalized on public campus maps for personal security.
                    </span>
                  </div>
                )}

              {/* Mini Map preview if coordinates or campus location available */}
              {(item.latitude || item.campus_location?.latitude) && (
                <div className="pt-2 space-y-2">
                  <CampusMap
                    items={[
                      {
                        id: item.id,
                        type: item.type,
                        title: item.title,
                        category: item.category,
                        description: item.description,
                        status: item.status,
                        date_time: item.date_time,
                        created_at: item.created_at,
                        latitude: item.latitude || item.campus_location!.latitude,
                        longitude: item.longitude || item.campus_location!.longitude,
                        location_name: item.location_name || item.campus_location?.name,
                        campus_location_name: item.campus_location?.name,
                        is_generalized_location:
                          ["ELECTRONICS", "DOCUMENTS", "KEYS", "ACCESSORIES"].includes(item.category) &&
                          (!user || (user.id !== item.user_id && user.role !== UserRole.ADMIN)),
                      },
                    ]}
                    selectedCenter={[
                      item.latitude || item.campus_location!.latitude,
                      item.longitude || item.campus_location!.longitude,
                    ]}
                    selectedZoom={17}
                    showBuildings={false}
                    showHotspots={false}
                    className="h-44 w-full rounded-xl"
                  />
                  <Link to="/map" className="block">
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      <Compass className="w-3.5 h-3.5 mr-1.5 text-primary-400" />
                      Explore Full Campus Map
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline & Metadata Card */}
          <Card className="p-6 bg-surface-900/60 border-surface-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Calendar className="w-4 h-4 text-primary-400" />
              <span>Timeline</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-surface-400 block font-medium">
                  Date & Time {isFound ? "Found" : "Lost"}
                </span>
                <span className="text-surface-200 block mt-0.5 font-medium">
                  {dateFormatted}
                </span>
              </div>

              <div className="pt-2 border-t border-surface-850">
                <span className="text-surface-400 block font-medium">
                  Report Registered
                </span>
                <span className="text-surface-300 block mt-0.5">
                  {reportedFormatted}
                </span>
              </div>
            </div>
          </Card>

          {/* Safe Reporter Info Card */}
          <Card className="p-6 bg-surface-900/60 border-surface-800 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <UserIcon className="w-4 h-4 text-primary-400" />
              <span>Report Origin</span>
            </div>

            {item.user ? (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-9 h-9 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-primary-400 font-semibold text-sm">
                  {item.user.name.charAt(0)}
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">
                    {item.user.name}
                  </span>
                  <span className="text-[11px] text-surface-400 block">
                    {item.user.role} Member
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-surface-400">
                Reported via campus security / anonymous registry.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Item Report"
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-300">
            Are you sure you want to delete this report for{" "}
            <span className="text-white font-semibold">"{item.title}"</span>?
            This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-800">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ItemDetailPage;
