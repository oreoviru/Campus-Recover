/**
 * Campus Recover — Admin Claim Review & Security Console (Phase 8)
 *
 * Provides campus administrators and security officers with centralized control over
 * all student ownership claims, fraud prevention, auto-verification outcomes,
 * and handover authorizations.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  PackageCheck,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Eye,
  FileText,
} from "lucide-react";

import { claimsApi } from "@/api/claims";
import { Claim, ClaimStatus, ItemStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";

export const AdminClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoVerifyFilter, setAutoVerifyFilter] = useState<string>("ALL");

  // Review Modal State
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<ClaimStatus>(ClaimStatus.APPROVED);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await claimsApi.getAdminClaims();
      if (res.success && res.data) {
        setClaims(res.data);
      } else {
        setError(res.message || "Failed to load claims registry.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.detail ||
          "Could not retrieve campus claims. Verify administrative privileges."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Compute summary metrics
  const stats = useMemo(() => {
    const total = claims.length;
    const pending = claims.filter((c) => c.status === ClaimStatus.PENDING).length;
    const approved = claims.filter((c) => c.status === ClaimStatus.APPROVED).length;
    const rejected = claims.filter((c) => c.status === ClaimStatus.REJECTED).length;
    const autoMatched = claims.filter((c) => c.auto_verification_passed === true).length;
    return { total, pending, approved, rejected, autoMatched };
  }, [claims]);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Status filter
      if (selectedStatus !== "ALL" && claim.status !== selectedStatus) {
        return false;
      }
      // Auto-verification filter
      if (autoVerifyFilter === "MATCHED" && claim.auto_verification_passed !== true) {
        return false;
      }
      if (autoVerifyFilter === "DISCREPANCY" && claim.auto_verification_passed !== false) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const itemTitle = claim.item?.title?.toLowerCase() || "";
        const claimantName = claim.claimant?.name?.toLowerCase() || "";
        const claimantEmail = claim.claimant?.email?.toLowerCase() || "";
        const answer = claim.submitted_answer?.toLowerCase() || "";
        if (
          !itemTitle.includes(query) &&
          !claimantName.includes(query) &&
          !claimantEmail.includes(query) &&
          !answer.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [claims, selectedStatus, autoVerifyFilter, searchQuery]);

  const openReviewModal = (claim: Claim, decision: ClaimStatus) => {
    setSelectedClaim(claim);
    setReviewDecision(decision);
    setReviewNotes("");
    setReviewModalOpen(true);
  };

  const handleExecuteReview = async () => {
    if (!selectedClaim) return;
    setSubmittingReview(true);
    setActionSuccessMessage(null);
    try {
      const res = await claimsApi.reviewClaim(selectedClaim.id, {
        status: reviewDecision,
        review_notes: reviewNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        // Update local list
        setClaims((prev) =>
          prev.map((c) => (c.id === selectedClaim.id ? res.data! : c))
        );
        setReviewModalOpen(false);
        setActionSuccessMessage(
          `Claim #${selectedClaim.id.slice(0, 8)} successfully ${
            reviewDecision === ClaimStatus.APPROVED ? "APPROVED" : "REJECTED"
          }.`
        );
        setTimeout(() => setActionSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message ||
          err.response?.data?.detail ||
          "Failed to process claim review."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkRecovered = async (claimId: string) => {
    if (
      !window.confirm(
        "Confirm that this item has been physically verified and transferred to the owner? This marks the item as RECOVERED."
      )
    ) {
      return;
    }

    try {
      const res = await claimsApi.markRecovered(claimId);
      if (res.success && res.data) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? res.data! : c))
        );
        setActionSuccessMessage("Item marked RECOVERED and claim completed.");
        setTimeout(() => setActionSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message ||
          err.response?.data?.detail ||
          "Failed to mark item recovered."
      );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const parsed = parseISO(dateStr);
      return isValid(parsed) ? format(parsed, "MMM d, yyyy h:mm a") : "N/A";
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-danger-500/10 text-danger-400 border border-danger-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                Admin Claim Review & Verification
              </h1>
            </div>
            <p className="text-sm text-surface-400">
              Campus security registry for evaluating ownership claims, preventing fraud, and authorizing custody handovers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchClaims}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                Admin Console
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-accent-500/10 border border-accent-500/30 text-accent-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-xs text-accent-400 hover:text-accent-300 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-surface-900/60 border-surface-800">
          <span className="text-xs text-surface-400 font-medium block">Total Claims</span>
          <span className="text-2xl font-bold font-display text-white mt-1 block">
            {stats.total}
          </span>
          <span className="text-[11px] text-surface-500 block mt-0.5">Across campus registry</span>
        </Card>

        <Card className="p-4 bg-warning-950/20 border-warning-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-warning-400 font-medium block">Pending Review</span>
            <Clock className="w-4 h-4 text-warning-400" />
          </div>
          <span className="text-2xl font-bold font-display text-warning-200 mt-1 block">
            {stats.pending}
          </span>
          <span className="text-[11px] text-warning-400/80 block mt-0.5">Awaiting staff/finder action</span>
        </Card>

        <Card className="p-4 bg-accent-950/20 border-accent-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-accent-400 font-medium block">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-accent-400" />
          </div>
          <span className="text-2xl font-bold font-display text-accent-200 mt-1 block">
            {stats.approved}
          </span>
          <span className="text-[11px] text-accent-400/80 block mt-0.5">Contact coordinates released</span>
        </Card>

        <Card className="p-4 bg-danger-950/20 border-danger-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-danger-400 font-medium block">Rejected</span>
            <XCircle className="w-4 h-4 text-danger-400" />
          </div>
          <span className="text-2xl font-bold font-display text-danger-200 mt-1 block">
            {stats.rejected}
          </span>
          <span className="text-[11px] text-danger-400/80 block mt-0.5">Fraud prevention triggered</span>
        </Card>

        <Card className="p-4 bg-primary-950/20 border-primary-500/30 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-400 font-medium block">Auto-Verified</span>
            <Sparkles className="w-4 h-4 text-primary-400" />
          </div>
          <span className="text-2xl font-bold font-display text-primary-200 mt-1 block">
            {stats.autoMatched}
          </span>
          <span className="text-[11px] text-primary-400/80 block mt-0.5">Challenge hash validated</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by item title, claimant name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-950 border border-surface-800 rounded-xl text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-surface-950 border border-surface-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
            >
              <option value="ALL">All Statuses</option>
              <option value={ClaimStatus.PENDING}>Pending</option>
              <option value={ClaimStatus.APPROVED}>Approved</option>
              <option value={ClaimStatus.REJECTED}>Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-400 font-medium">AI Verification:</span>
            <select
              value={autoVerifyFilter}
              onChange={(e) => setAutoVerifyFilter(e.target.value)}
              className="bg-surface-950 border border-surface-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="MATCHED">Auto-Verified Match</option>
              <option value="DISCREPANCY">Verification Discrepancy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims Content List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl w-full" />
          <Skeleton className="h-32 rounded-2xl w-full" />
          <Skeleton className="h-32 rounded-2xl w-full" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-danger-500/10 border border-danger-500/30 text-danger-400 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto" />
          <p className="text-sm font-semibold">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchClaims}>
            Try Again
          </Button>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="p-12 text-center bg-surface-900/40 border border-surface-800 rounded-3xl space-y-3">
          <PackageCheck className="w-10 h-10 text-surface-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No claims match the filter criteria</h3>
          <p className="text-xs text-surface-400 max-w-md mx-auto">
            {searchQuery || selectedStatus !== "ALL" || autoVerifyFilter !== "ALL"
              ? "Try adjusting your search filters to find relevant claims."
              : "No ownership claims have been registered in the system yet."}
          </p>
          {(searchQuery || selectedStatus !== "ALL" || autoVerifyFilter !== "ALL") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("ALL");
                setAutoVerifyFilter("ALL");
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => {
            const isPending = claim.status === ClaimStatus.PENDING;
            const isApproved = claim.status === ClaimStatus.APPROVED;
            const isRejected = claim.status === ClaimStatus.REJECTED;
            const isItemRecovered = claim.item?.status === ItemStatus.RECOVERED;

            return (
              <Card
                key={claim.id}
                className="p-5 sm:p-6 bg-surface-900/60 border-surface-800 hover:border-surface-700 transition space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-850 pb-4">
                  {/* Left: Item overview */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-surface-950 border border-surface-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {claim.item?.image_url ? (
                        <img
                          src={claim.item.image_url}
                          alt={claim.item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PackageCheck className="w-6 h-6 text-surface-500" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/items/${claim.item_id}`}
                          className="text-base font-bold text-white hover:text-primary-400 transition"
                        >
                          {claim.item?.title || "Item #" + claim.item_id.slice(0, 8)}
                        </Link>
                        <Badge variant="outline" size="sm">
                          {claim.item?.category || "Uncategorized"}
                        </Badge>
                        {claim.item?.status && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-800 text-surface-300">
                            {claim.item.status}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-surface-400 flex-wrap">
                        <span>Claim ID: <span className="font-mono text-surface-300">#{claim.id.slice(0, 8)}</span></span>
                        <span>•</span>
                        <span>Filed: {formatDate(claim.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badges */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Auto-verification indicator (staff view) */}
                    {claim.auto_verification_passed === true && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-300 border border-primary-500/30 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Auto-Verified Match
                      </span>
                    )}
                    {claim.auto_verification_passed === false && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-500/10 text-danger-300 border border-danger-500/30 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Discrepancy Detected
                      </span>
                    )}

                    {/* Claim Status Badge */}
                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-warning-500/10 text-warning-300 border border-warning-500/30 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        PENDING REVIEW
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-500/10 text-accent-300 border border-accent-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        APPROVED
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-danger-500/10 text-danger-300 border border-danger-500/30 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        REJECTED
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Claimant & Finder profile */}
                  <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-850 space-y-2">
                    <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block">
                      Claimant Identity
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-800 text-primary-400 font-bold flex items-center justify-center shrink-0">
                        {claim.claimant?.name?.charAt(0) || "U"}
                      </div>
                      <div className="truncate">
                        <span className="text-white font-medium block truncate">
                          {claim.claimant?.name || "Student"}
                        </span>
                        <span className="text-surface-400 block truncate">
                          {claim.claimant?.email || "No email available"} • {claim.claimant?.role || "STUDENT"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Answer Submitted */}
                  <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-850 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
                        Submitted Verification Proof
                      </span>
                      {claim.verification_question && (
                        <span className="text-[10px] text-surface-500 font-mono">
                          Challenge: "{claim.verification_question.slice(0, 30)}..."
                        </span>
                      )}
                    </div>
                    <p className="text-surface-200 text-xs italic bg-surface-900/60 p-2 rounded-lg border border-surface-800">
                      "{claim.submitted_answer || "No response provided."}"
                    </p>
                  </div>
                </div>

                {/* Review Notes (if already decided) */}
                {claim.review_notes && (
                  <div className="p-3 rounded-xl bg-surface-950/60 border border-surface-850 text-xs text-surface-300 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-surface-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Reviewer Notes: </span>
                      <span>{claim.review_notes}</span>
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/claims/${claim.id}`}>
                      <Button variant="secondary" size="sm" className="gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        View Full Claim
                      </Button>
                    </Link>
                    <Link to={`/items/${claim.item_id}`}>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-surface-400 hover:text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                        Item Page
                      </Button>
                    </Link>
                  </div>

                  {/* Admin Direct Actions */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-accent-600 hover:bg-accent-500 text-white gap-1.5"
                          onClick={() => openReviewModal(claim, ClaimStatus.APPROVED)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Admin Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="border-danger-500/30 text-danger-400 hover:bg-danger-500/10 gap-1.5"
                          onClick={() => openReviewModal(claim, ClaimStatus.REJECTED)}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Admin Reject
                        </Button>
                      </>
                    )}

                    {isApproved && !isItemRecovered && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-accent-600 hover:bg-accent-500 text-white gap-1.5"
                        onClick={() => handleMarkRecovered(claim.id)}
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        Mark Recovered
                      </Button>
                    )}

                    {isItemRecovered && (
                      <span className="text-xs text-accent-400 font-medium flex items-center gap-1.5 px-3 py-1 rounded-xl bg-accent-500/10 border border-accent-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Item Handover Completed
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedClaim && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Administrative Claim Decision — #${selectedClaim.id.slice(0, 8)}`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-surface-950 border border-surface-850 text-xs space-y-1">
              <span className="text-surface-400 block font-medium">Item Under Claim:</span>
              <span className="text-sm font-bold text-white block">{selectedClaim.item?.title}</span>
              <span className="text-surface-400 block pt-1">
                Claimant: <span className="text-primary-300 font-medium">{selectedClaim.claimant?.name}</span> ({selectedClaim.claimant?.email})
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-300 uppercase tracking-wider block">
                Verification Proof Submitted
              </label>
              <div className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 text-xs text-surface-200">
                "{selectedClaim.submitted_answer}"
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-surface-300 uppercase tracking-wider block">
                Administrative Decision
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewDecision(ClaimStatus.APPROVED)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    reviewDecision === ClaimStatus.APPROVED
                      ? "bg-accent-500/20 border-accent-500 text-accent-300"
                      : "bg-surface-950 border-surface-850 text-surface-400 hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-accent-400" />
                  Approve Claim
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision(ClaimStatus.REJECTED)}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    reviewDecision === ClaimStatus.REJECTED
                      ? "bg-danger-500/20 border-danger-500 text-danger-300"
                      : "bg-surface-950 border-surface-850 text-surface-400 hover:text-white"
                  }`}
                >
                  <XCircle className="w-4 h-4 text-danger-400" />
                  Reject Claim
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-300 block">
                Staff / Security Notes (Recorded in audit trail):
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Verified photo serial number matches campus equipment database..."
                className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReviewModalOpen(false)}
                disabled={submittingReview}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteReview}
                isLoading={submittingReview}
                className={
                  reviewDecision === ClaimStatus.APPROVED
                    ? "bg-accent-600 hover:bg-accent-500"
                    : "bg-danger-600 hover:bg-danger-500"
                }
              >
                Confirm {reviewDecision === ClaimStatus.APPROVED ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
