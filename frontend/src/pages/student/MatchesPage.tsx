/**
 * Campus Recover — AI Matches Page (Phase 7)
 *
 * Dedicated dashboard for reviewing candidate lost & found matches detected
 * by the multi-modal neural matching engine (CLIP Vision + Sentence-Transformers + Geo/Time).
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Info,
} from "lucide-react";

import { matchesApi } from "@/api/matches";
import { useAuth } from "@/hooks/useAuth";
import { Match, MatchStatus } from "@/types";
import { MatchCard } from "@/components/matches/MatchCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export const MatchesPage: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<MatchStatus | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await matchesApi.getUserMatches(statusFilter);
      if (res.success && res.data) {
        setMatches(res.data);
      }
    } catch (err) {
      console.error("Failed to load match reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [statusFilter]);

  const handleConfirm = async (matchId: string) => {
    setActionLoading(true);
    try {
      await matchesApi.confirmMatch(matchId);
      await fetchMatches();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to confirm match candidate.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (matchId: string) => {
    setActionLoading(true);
    try {
      await matchesApi.rejectMatch(matchId);
      await fetchMatches();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject match proposal.");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = matches.filter((m) => m.status === MatchStatus.PENDING).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI MATCH RADAR • PHASE 7 MULTI-MODAL ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            AI Match Candidates
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Review automatic pairings between your reports and campus community items evaluated via CLIP vision and neural embeddings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/report-lost">
            <Button variant="outline" size="sm" className="text-xs">
              Report Lost Item
            </Button>
          </Link>
          <Link to="/report-found">
            <Button variant="primary" size="sm" className="text-xs shadow-glow">
              Report Found Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Recovery Score Dimensions Legend Card */}
      <Card className="p-5 bg-gradient-to-br from-surface-900 to-surface-950 border-surface-800 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <Info className="w-4 h-4 text-primary-400" />
              <span>Phase 7 Recovery Score Composition</span>
            </div>
            <p className="text-xs text-surface-400">
              Each candidate pairing evaluates 5 independent signals with dynamic normalization for items lacking photos:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-surface-850/80 border border-surface-700/60">
              <span className="text-[10px] uppercase font-mono text-blue-400 block">Text Sim</span>
              <span className="font-bold text-white font-display text-base">30%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-850/80 border border-surface-700/60">
              <span className="text-[10px] uppercase font-mono text-purple-400 block">Image Sim</span>
              <span className="font-bold text-white font-display text-base">30%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-850/80 border border-surface-700/60">
              <span className="text-[10px] uppercase font-mono text-emerald-400 block">Location</span>
              <span className="font-bold text-white font-display text-base">20%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-850/80 border border-surface-700/60">
              <span className="text-[10px] uppercase font-mono text-amber-400 block">Time</span>
              <span className="font-bold text-white font-display text-base">10%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-850/80 border border-surface-700/60">
              <span className="text-[10px] uppercase font-mono text-cyan-400 block">Attributes</span>
              <span className="font-bold text-white font-display text-base">10%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-surface-800 pb-3">
        <div className="flex items-center space-x-2">
          <Button
            variant={statusFilter === undefined ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(undefined)}
            className="text-xs"
          >
            All Matches
          </Button>
          <Button
            variant={statusFilter === MatchStatus.PENDING ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(MatchStatus.PENDING)}
            className="text-xs relative"
          >
            Pending Review
            {pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-accent-500 text-surface-950 font-bold">
                {pendingCount}
              </span>
            )}
          </Button>
          <Button
            variant={statusFilter === MatchStatus.CONFIRMED ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(MatchStatus.CONFIRMED)}
            className="text-xs"
          >
            Confirmed
          </Button>
          <Button
            variant={statusFilter === MatchStatus.REJECTED ? "primary" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(MatchStatus.REJECTED)}
            className="text-xs"
          >
            Rejected
          </Button>
        </div>

        <span className="text-xs text-surface-400 hidden sm:inline">
          Showing {matches.length} {matches.length === 1 ? "candidate" : "candidates"}
        </span>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl w-full" />
          <Skeleton className="h-32 rounded-2xl w-full" />
          <Skeleton className="h-32 rounded-2xl w-full" />
        </div>
      ) : matches.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={<Sparkles className="w-8 h-8 text-primary-400" />}
            title="No Match Candidates Found"
            description={
              statusFilter
                ? `No items currently matching the selected '${statusFilter}' filter.`
                : "No potential matches detected yet. As new reports are filed, our background scanner will compare visual photos, descriptions, locations, and attributes automatically."
            }
          />
          <div className="flex items-center justify-center space-x-3 pt-2">
            <Link to="/browse">
              <Button variant="outline" size="sm">
                Browse Active Reports
              </Button>
            </Link>
            <Link to="/report-lost">
              <Button variant="primary" size="sm">
                Report a Lost Item
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={user?.id}
              onConfirm={handleConfirm}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};
