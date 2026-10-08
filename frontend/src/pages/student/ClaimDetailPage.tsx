/**
 * Campus Recover — Claim Details & Handover Coordination Page (Phase 8)
 *
 * Full lifecycle view for an ownership claim:
 * - Verification question & claimant answer review
 * - Automated challenge check (Finder & Admin only)
 * - Safe contact release (strictly locked until APPROVED)
 * - Handover coordination and marking item RECOVERED
 * - Administrative override controls
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Mail,
  User as UserIcon,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Shield,
} from "lucide-react";

import { claimsApi } from "@/api/claims";
import { useAuth } from "@/hooks/useAuth";
import { Claim, ClaimStatus, UserRole, ItemStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";

export const ClaimDetailPage: React.FC = () => {
  const { id: claimId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<ClaimStatus>(ClaimStatus.APPROVED);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Recovery confirmation modal
  const [recoveredModalOpen, setRecoveredModalOpen] = useState(false);
  const [submittingRecovered, setSubmittingRecovered] = useState(false);

  const fetchClaim = async () => {
    if (!claimId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await claimsApi.getClaim(claimId);
      if (res.success && res.data) {
        setClaim(res.data);
      } else {
        setError(res.message || "Claim not found.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.detail ||
          "Unable to load claim details. Please verify your access permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [claimId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim) return;
    setSubmittingReview(true);
    try {
      await claimsApi.reviewClaim(claim.id, {
        status: reviewDecision,
        admin_notes: reviewNotes.trim() || undefined,
      });
      setReviewModalOpen(false);
      setReviewNotes("");
      await fetchClaim();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkRecovered = async () => {
    if (!claim) return;
    setSubmittingRecovered(true);
    try {
      await claimsApi.markRecovered(claim.id);
      setRecoveredModalOpen(false);
      await fetchClaim();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to confirm recovery.");
    } finally {
      setSubmittingRecovered(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Denied or Not Found</h2>
        <p className="text-sm text-surface-400">{error || "Unable to view claim."}</p>
        <Link to="/my-claims">
          <Button variant="outline" size="sm">
            Return to My Claims
          </Button>
        </Link>
      </div>
    );
  }

  const isClaimant = user?.id === claim.claimant_id;
  const isFinder = Boolean(user && claim.item && user.id === claim.item.user_id);
  const isAdmin = user?.role === UserRole.ADMIN;

  const isApproved = claim.status === ClaimStatus.APPROVED;
  const isPending = claim.status === ClaimStatus.PENDING;
  const isRejected = claim.status === ClaimStatus.REJECTED;
  const isRecovered = claim.item?.status === ItemStatus.RECOVERED;

  const formattedDate = claim.created_at
    ? (() => {
        try {
          const parsed = parseISO(claim.created_at);
          return isValid(parsed) ? format(parsed, "MMMM d, yyyy 'at' h:mm a") : "Recent";
        } catch {
          return "Recent";
        }
      })()
    : "Recent";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link
          to="/my-claims"
          className="inline-flex items-center text-xs font-medium text-surface-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Claims
        </Link>

        {claim.item && (
          <Link
            to={`/items/${claim.item.id}`}
            className="inline-flex items-center text-xs font-medium text-primary-400 hover:text-primary-300 transition"
          >
            View Original Item Report <ExternalLink className="w-3 h-3 ml-1" />
          </Link>
        )}
      </div>

      {/* Main Status & Header Banner */}
      <Card className="p-6 bg-surface-900/80 border-surface-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider text-surface-400">
                Claim Case #{claim.id.slice(0, 8)}
              </span>
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
              {isRecovered && (
                <Badge variant="accent" size="sm">
                  Item Recovered
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold font-display text-white tracking-tight">
              {claim.item?.title || "Property Claim"}
            </h1>
            <p className="text-xs text-surface-400">
              Submitted on {formattedDate} by {claim.claimant?.name || "Claimant"}
            </p>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center space-x-2">
            {(isFinder || isAdmin) && isPending && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setReviewDecision(ClaimStatus.APPROVED);
                  setReviewModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs shadow-glow"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Review & Decide
              </Button>
            )}

            {isApproved && !isRecovered && (isClaimant || isFinder || isAdmin) && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setRecoveredModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-500 text-white text-xs shadow-glow"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Confirm Item Recovered
              </Button>
            )}
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="grid grid-cols-4 gap-2 pt-6 mt-6 border-t border-surface-800 text-center">
          <div className="space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-xs font-bold">
              ✓
            </div>
            <span className="text-[11px] font-semibold text-white block">Submitted</span>
          </div>

          <div className="space-y-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                isApproved || isRejected
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
              }`}
            >
              {isApproved || isRejected ? "✓" : "2"}
            </div>
            <span className="text-[11px] font-semibold text-white block">
              {isRejected ? "Rejected" : "Under Review"}
            </span>
          </div>

          <div className="space-y-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                isApproved
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-surface-800 text-surface-500 border border-surface-700"
              }`}
            >
              {isApproved ? "✓" : "3"}
            </div>
            <span
              className={`text-[11px] font-semibold block ${
                isApproved ? "text-white" : "text-surface-500"
              }`}
            >
              Contact Unlocked
            </span>
          </div>

          <div className="space-y-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                isRecovered
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-surface-800 text-surface-500 border border-surface-700"
              }`}
            >
              {isRecovered ? "✓" : "4"}
            </div>
            <span
              className={`text-[11px] font-semibold block ${
                isRecovered ? "text-white" : "text-surface-500"
              }`}
            >
              Handover Complete
            </span>
          </div>
        </div>
      </Card>

      {/* Verification Challenge & Answer Section */}
      <Card className="p-6 bg-surface-900/60 border-surface-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-primary-400" />
            <h3 className="text-base font-bold text-white">
              Verification Proof & Challenge
            </h3>
          </div>

          {/* Automated match indicator for Finder/Admin */}
          {(isFinder || isAdmin) && claim.auto_verification_passed !== undefined && claim.auto_verification_passed !== null && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                claim.auto_verification_passed
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {claim.auto_verification_passed ? "✓ Secret Answer Matched" : "Manual Discretion Needed"}
            </span>
          )}
        </div>

        {claim.verification_question && (
          <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
            <span className="text-xs font-mono uppercase text-surface-400 block">
              Finder's Challenge Question
            </span>
            <p className="text-sm font-semibold text-white">
              "{claim.verification_question}"
            </p>
          </div>
        )}

        <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
          <span className="text-xs font-mono uppercase text-surface-400 block">
            Claimant's Submitted Answer / Proof
          </span>
          <p className="text-sm text-surface-200 whitespace-pre-wrap leading-relaxed">
            {claim.submitted_answer}
          </p>
        </div>

        {claim.admin_notes && (
          <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/20 space-y-1">
            <div className="flex items-center space-x-1.5 text-primary-400 text-xs font-semibold">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reviewer & Handover Notes</span>
            </div>
            <p className="text-xs text-surface-200 leading-relaxed">
              {claim.admin_notes}
            </p>
          </div>
        )}
      </Card>

      {/* Contact & Handover Coordination Card (SECURITY ENFORCEMENT) */}
      <Card
        className={`p-6 border transition-all ${
          isApproved
            ? "bg-emerald-950/20 border-emerald-500/30 shadow-lg"
            : "bg-surface-900/60 border-surface-800"
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isApproved ? (
                <Unlock className="w-5 h-5 text-emerald-400" />
              ) : (
                <Lock className="w-5 h-5 text-surface-500" />
              )}
              <h3 className="text-base font-bold text-white">
                Contact & Custody Coordination
              </h3>
            </div>

            <Badge variant={isApproved ? "accent" : "surface"} size="sm">
              {isApproved ? "Contact Released" : "Protected & Masked"}
            </Badge>
          </div>

          {!isApproved ? (
            <div className="p-4 rounded-xl bg-surface-950 border border-surface-850 flex items-start gap-3.5">
              <Shield className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
              <div className="text-xs text-surface-400 space-y-1 leading-relaxed">
                <span className="font-semibold text-white block">
                  Finder Identity Protected
                </span>
                <p>
                  In accordance with university privacy guidelines, finder contact details (email, phone, coordinates) remain strictly locked while the claim is pending review. Once approved, secure contact information will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Finder Contact Info */}
                <div className="p-4 rounded-xl bg-surface-950 border border-emerald-500/20 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block font-semibold">
                    Finder Contact (Item in Custody)
                  </span>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-emerald-400" />
                      {claim.finder_contact?.name || "Campus Community Member"}
                    </div>
                    <div className="text-xs text-surface-300 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-surface-400" />
                      <a
                        href={`mailto:${claim.finder_contact?.email}`}
                        className="text-primary-300 hover:underline font-mono"
                      >
                        {claim.finder_contact?.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Claimant Contact Info */}
                <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-primary-400 block font-semibold">
                    Claimant Contact (Owner)
                  </span>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-primary-400" />
                      {claim.claimant?.name || "Claimant"}
                    </div>
                    <div className="text-xs text-surface-300 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-surface-400" />
                      <a
                        href={`mailto:${claim.claimant?.email}`}
                        className="text-primary-300 hover:underline font-mono"
                      >
                        {claim.claimant?.email}
                      </a>
                    </div>
                    {claim.claimant?.student_id && (
                      <div className="text-[11px] font-mono text-surface-400 pt-0.5">
                        Student ID: {claim.claimant.student_id}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Handover Safety Tip */}
              <div className="p-3.5 rounded-xl bg-surface-900 border border-surface-800 text-xs text-surface-300 space-y-1">
                <span className="font-semibold text-white block">📍 Recommended Campus Handover Locations</span>
                <p className="text-[11px] text-surface-400">
                  We recommend coordinating physical transfers at secure university locations: Main Campus Security Desk, Student Union Information Center, or University Library Main Entrance during daytime hours.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal Dialog (Finder / Admin) */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Ownership Claim"
        maxWidth="lg"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-5 p-2">
          <p className="text-xs text-surface-400">
            Compare the claimant's answer against distinguishing marks or features to confirm rightful ownership.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-surface-300">
              Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewDecision(ClaimStatus.APPROVED)}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  reviewDecision === ClaimStatus.APPROVED
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                    : "bg-surface-950 border-surface-800 text-surface-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Approve Claim
              </button>
              <button
                type="button"
                onClick={() => setReviewDecision(ClaimStatus.REJECTED)}
                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  reviewDecision === ClaimStatus.REJECTED
                    ? "bg-rose-600/20 border-rose-500 text-rose-400"
                    : "bg-surface-950 border-surface-800 text-surface-400 hover:text-white"
                }`}
              >
                <XCircle className="w-4 h-4" />
                Reject Claim
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-surface-300">
              {reviewDecision === ClaimStatus.APPROVED
                ? "Handover Instructions / Meeting Notes"
                : "Rejection Reason (Optional)"}
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={
                reviewDecision === ClaimStatus.APPROVED
                  ? "E.g., Available weekdays between 2-4 PM at Student Union 2nd floor info desk..."
                  : "E.g., The color and serial prefix described did not match the item in custody..."
              }
              className="w-full px-3.5 py-2.5 bg-surface-950 border border-surface-700 rounded-xl text-white text-xs placeholder:text-surface-600 focus:outline-none focus:border-primary-500 resize-y"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-surface-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submittingReview}
              className={
                reviewDecision === ClaimStatus.APPROVED
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-rose-600 hover:bg-rose-500 text-white"
              }
            >
              {submittingReview ? "Submitting..." : `Confirm ${reviewDecision}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Recovered Confirmation Modal */}
      <Modal
        isOpen={recoveredModalOpen}
        onClose={() => setRecoveredModalOpen(false)}
        title="Confirm Item Recovery Handover"
        maxWidth="md"
      >
        <div className="space-y-4 p-2 text-xs">
          <p className="text-surface-300 leading-relaxed">
            Confirming that physical custody of this item has been successfully transferred back to the verified owner. This will update the item lifecycle to <strong className="text-white">RECOVERED</strong>.
          </p>

          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-emerald-400 block font-semibold">
              Item Details
            </span>
            <div className="text-sm font-bold text-white">{claim.item?.title}</div>
            <div className="text-surface-400">{claim.item?.category}</div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-surface-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRecoveredModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={submittingRecovered}
              onClick={handleMarkRecovered}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {submittingRecovered ? "Confirming..." : "Confirm Item Recovered"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
