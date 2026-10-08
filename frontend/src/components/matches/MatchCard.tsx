/**
 * Campus Recover — Match Candidate Card Component
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import {
  Sparkles,
  MapPin,
  Calendar,
  ShieldCheck,
  XCircle,
  ExternalLink,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { Match, MatchStatus, getConfidenceLevel, getConfidenceColor } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { MatchScoreBreakdown } from "./MatchScoreBreakdown";

interface MatchCardProps {
  match: Match;
  currentUserId?: string;
  onConfirm?: (matchId: string) => void;
  onReject?: (matchId: string) => void;
  actionLoading?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  currentUserId,
  onConfirm,
  onReject,
  actionLoading = false,
}) => {
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);

  // Identify counterpart item based on lost vs found
  const counterpartItem = match.lost_item?.user_id === currentUserId ? match.found_item : match.lost_item;
  const itemToShow = counterpartItem || match.found_item || match.lost_item;

  const scorePercent = Math.round(match.overall_score * 100);
  const confStyle = getConfidenceColor(match.overall_score);
  const confidence = match.score_breakdown?.confidence_level || getConfidenceLevel(match.overall_score);

  const formattedDate = itemToShow?.date_time
    ? (() => {
        try {
          const parsed = parseISO(itemToShow.date_time);
          return isValid(parsed) ? format(parsed, "MMM d, yyyy") : "Recent";
        } catch {
          return "Recent";
        }
      })()
    : "Recent";

  return (
    <>
      <div className="bg-surface-850 border border-surface-700/60 hover:border-surface-600 rounded-2xl p-5 transition-all shadow-md hover:shadow-xl group">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Item thumbnail or placeholder */}
          <div className="w-full sm:w-28 h-28 rounded-xl bg-surface-900 border border-surface-700 overflow-hidden flex-shrink-0 relative group">
            {itemToShow?.image_url ? (
              <img
                src={itemToShow.image_url}
                alt={itemToShow.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-surface-500 bg-surface-900">
                <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[10px] uppercase font-mono">No Photo</span>
              </div>
            )}
            <div className="absolute top-2 left-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  itemToShow?.type === "LOST"
                    ? "bg-amber-500/90 text-white"
                    : "bg-emerald-600/90 text-white"
                }`}
              >
                {itemToShow?.type || "MATCH"}
              </span>
            </div>
          </div>

          {/* Core content */}
          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-white group-hover:text-primary-300 transition-colors line-clamp-1">
                  {itemToShow?.title || "Item Match Proposal"}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400 mt-1">
                  {itemToShow?.category && (
                    <span className="inline-flex items-center text-surface-300">
                      <Layers className="w-3.5 h-3.5 mr-1 text-primary-400" />
                      {itemToShow.category}
                    </span>
                  )}
                  {itemToShow?.location_name && (
                    <span className="inline-flex items-center text-surface-300">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {itemToShow.location_name}
                    </span>
                  )}
                  <span className="inline-flex items-center text-surface-400">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-surface-500" />
                    {formattedDate}
                  </span>
                </div>
              </div>

              {/* Match Score Badge */}
              <div className="flex items-center space-x-2">
                <div
                  className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 ${confStyle.bg} ${confStyle.border}`}
                >
                  <Sparkles className={`w-4 h-4 ${confStyle.text}`} />
                  <div>
                    <div className="text-sm font-black font-display text-white leading-none">
                      {scorePercent}%
                    </div>
                    <div className={`text-[10px] font-semibold leading-tight ${confStyle.text}`}>
                      {confidence}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dimensional mini-bars preview */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-surface-400 font-mono">
                  <span>Text</span>
                  <span>{Math.round(match.text_score * 100)}%</span>
                </div>
                <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.round(match.text_score * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-surface-400 font-mono">
                  <span>Image</span>
                  <span>{match.image_score !== null ? `${Math.round(match.image_score * 100)}%` : "—"}</span>
                </div>
                <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${match.image_score !== null ? Math.round(match.image_score * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-surface-400 font-mono">
                  <span>Loc</span>
                  <span>{Math.round(match.location_score * 100)}%</span>
                </div>
                <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.round(match.location_score * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-surface-400 font-mono">
                  <span>Time</span>
                  <span>{Math.round(match.time_score * 100)}%</span>
                </div>
                <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.round(match.time_score * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-surface-400 font-mono">
                  <span>Attr</span>
                  <span>{Math.round(match.attribute_score * 100)}%</span>
                </div>
                <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${Math.round(match.attribute_score * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-800/80">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBreakdownModalOpen(true)}
                className="text-xs h-8"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary-400" />
                Score Breakdown
              </Button>

              <div className="flex items-center space-x-2">
                {itemToShow?.id && (
                  <Link to={`/items/${itemToShow.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      View Item <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}

                {match.status === MatchStatus.PENDING && (
                  <>
                    {onReject && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReject(match.id)}
                        disabled={actionLoading}
                        className="text-xs h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    )}
                    {onConfirm && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onConfirm(match.id)}
                        disabled={actionLoading}
                        className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Confirm Match
                      </Button>
                    )}
                  </>
                )}

                {match.status === MatchStatus.CONFIRMED && (
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" size="sm">
                      Confirmed Match
                    </Badge>
                    {match.found_item?.id && match.lost_item?.user_id === currentUserId && (
                      <Link to={`/items/${match.found_item.id}/claim`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-xs h-8 bg-primary-600 hover:bg-primary-500 shadow-sm"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          Claim Item
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
                {match.status === MatchStatus.REJECTED && (
                  <Badge variant="surface" size="sm">
                    Rejected
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown Modal */}
      <Modal
        isOpen={breakdownModalOpen}
        onClose={() => setBreakdownModalOpen(false)}
        title="AI Match Explainability Breakdown"
        maxWidth="xl"
      >
        <div className="p-6">
          <MatchScoreBreakdown
            overallScore={match.overall_score}
            breakdown={match.score_breakdown}
            textScore={match.text_score}
            imageScore={match.image_score}
            locationScore={match.location_score}
            timeScore={match.time_score}
            attributeScore={match.attribute_score}
          />
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={() => setBreakdownModalOpen(false)}>
              Close Breakdown
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
