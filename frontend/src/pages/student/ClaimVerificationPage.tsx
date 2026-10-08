/**
 * Campus Recover — Claim Verification Page (Phase 8)
 *
 * Dedicated security gate where a claimant answers the finder's private challenge question
 * or provides physical ownership proof before contact information can be released.
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  HelpCircle,
  Lock,
  AlertTriangle,
  Info,
  Layers,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";

import { claimsApi } from "@/api/claims";
import { itemsApi } from "@/api/items";
import { useAuth } from "@/hooks/useAuth";
import { Item, ClaimVerificationPrompt } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export const ClaimVerificationPage: React.FC = () => {
  const { id: itemId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState<Item | null>(null);
  const [prompt, setPrompt] = useState<ClaimVerificationPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!itemId) return;
      setLoading(true);
      setError(null);
      try {
        const [itemRes, promptRes] = await Promise.all([
          itemsApi.getItem(itemId),
          claimsApi.getVerificationPrompt(itemId),
        ]);

        if (itemRes.success && itemRes.data) {
          setItem(itemRes.data);
        } else {
          setError(itemRes.message || "Item not found.");
        }

        if (promptRes.success && promptRes.data) {
          setPrompt(promptRes.data);
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ||
            err.response?.data?.detail ||
            "Unable to load verification details for this item."
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;

    if (!submittedAnswer.trim()) {
      setSubmitError("Please provide an answer or proof of ownership description.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await claimsApi.createClaim({
        item_id: itemId,
        submitted_answer: submittedAnswer.trim(),
      });

      if (res.success && res.data) {
        navigate(`/claims/${res.data.id}`);
      } else {
        setSubmitError(res.message || "Failed to submit ownership claim.");
      }
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.error?.message ||
          err.response?.data?.detail ||
          "Failed to submit claim. You may already have a pending claim for this item."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Item Unavailable for Claim</h2>
        <p className="text-sm text-surface-400">{error || "Could not find item."}</p>
        <Link to="/browse">
          <Button variant="outline" size="sm">
            Return to Browse
          </Button>
        </Link>
      </div>
    );
  }

  const isReporter = user?.id === item.user_id;

  if (isReporter) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Cannot Claim Own Report</h2>
        <p className="text-sm text-surface-400">
          You are the reporter of this item. You cannot submit an ownership claim against your own report.
        </p>
        <Link to={`/items/${item.id}`}>
          <Button variant="outline" size="sm">
            View Item Details
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          to={`/items/${item.id}`}
          className="inline-flex items-center text-xs font-medium text-surface-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Item Details
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs font-mono mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>SECURE CLAIM PROTOCOL • PHASE 8</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            Claim Item Ownership
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Complete the verification challenge to prove your ownership. Finder contact details are released upon approval.
          </p>
        </div>
      </div>

      {/* Item Summary Card */}
      <Card className="p-5 bg-surface-900/60 border-surface-800">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-20 h-20 rounded-xl bg-surface-950 border border-surface-700 overflow-hidden flex-shrink-0 relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-surface-500">
                <ImageIcon className="w-6 h-6 opacity-40 mb-1" />
                <span className="text-[9px] font-mono uppercase">No Photo</span>
              </div>
            )}
            <div className="absolute top-1 left-1">
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase bg-emerald-600/90 text-white">
                {item.type}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-base font-bold text-white truncate">{item.title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400">
              <span className="inline-flex items-center text-surface-300">
                <Layers className="w-3.5 h-3.5 mr-1 text-primary-400" />
                {item.category}
              </span>
              {item.location_name && (
                <span className="inline-flex items-center text-surface-300">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  {item.location_name}
                </span>
              )}
            </div>
            <p className="text-xs text-surface-300 line-clamp-2 pt-0.5">
              {item.description}
            </p>
          </div>
        </div>
      </Card>

      {/* Security Privacy Notice */}
      <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/20 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-surface-300 leading-relaxed">
          <span className="font-semibold text-white block">Fraud Prevention & Contact Privacy</span>
          <span>
            To protect students from identity harvesting and false claims, finder contact information is withheld until your claim is formally approved by the finder or campus administrator.
          </span>
        </div>
      </div>

      {/* Verification Challenge Form */}
      <Card className="p-6 sm:p-8 bg-surface-900/80 border-surface-800 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {prompt?.has_verification_question ? (
            <div className="p-5 rounded-2xl bg-accent-950/20 border border-accent-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-accent-400 font-semibold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Finder's Private Challenge Question</span>
              </div>
              <p className="text-base font-semibold text-white tracking-wide">
                "{prompt.verification_question}"
              </p>
              <p className="text-xs text-surface-400 leading-relaxed pt-1">
                Answer accurately. The finder configured this secret to confirm you are the true owner without publicly revealing distinguishing marks.
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-surface-950/60 border border-surface-800 space-y-2">
              <div className="flex items-center space-x-2 text-primary-400 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Proof of Ownership Description</span>
              </div>
              <p className="text-xs text-surface-400 leading-relaxed">
                The finder did not configure a challenge question. Describe specific identifying details (e.g. serial numbers, stickers, scratches, lock screen image, or contents) to prove this belongs to you.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-surface-300">
              Your Verification Answer / Proof Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={submittedAnswer}
              onChange={(e) => setSubmittedAnswer(e.target.value)}
              placeholder={
                prompt?.has_verification_question
                  ? "Enter the specific answer to the question above..."
                  : "Detail unique identifying marks, serial numbers, purchase date, or distinguishing characteristics..."
              }
              className="w-full px-4 py-3 bg-surface-950 border border-surface-700 rounded-xl text-white text-sm placeholder:text-surface-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition resize-y"
              required
            />
            <p className="text-[11px] text-surface-400">
              This response will be reviewed by the finder and campus security.
            </p>
          </div>

          {submitError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-surface-800 flex-wrap gap-4">
            <Link to={`/items/${item.id}`}>
              <Button type="button" variant="ghost" size="sm" className="text-xs">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting || !submittedAnswer.trim()}
              className="shadow-glow"
            >
              {submitting ? (
                "Submitting Claim..."
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Submit Ownership Claim
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
