/**
 * Campus Recover — Match Type Definitions
 */

import { MatchStatus } from "./common";
import { Item } from "./item";

export interface MatchSignalDetail {
  score: number | null;
  base_weight: number;
  effective_weight: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  reason?: string;
  details?: Record<string, any>;
}

export interface ScoreBreakdown {
  overall_score: number;
  confidence_level: string;
  normalized_without_image: boolean;
  signals: {
    text: MatchSignalDetail;
    image: MatchSignalDetail;
    location: MatchSignalDetail;
    time: MatchSignalDetail;
    attributes: MatchSignalDetail;
    [key: string]: MatchSignalDetail;
  };
}

export interface Match {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  text_score: number;
  image_score: number | null;
  location_score: number;
  time_score: number;
  attribute_score: number;
  overall_score: number;
  score_breakdown?: ScoreBreakdown;
  status: MatchStatus;
  created_at: string;
  // Populated in detail view
  lost_item?: Item;
  found_item?: Item;
}

export interface MatchCandidateResult {
  candidate_item: Item;
  lost_item_id: string;
  found_item_id: string;
  overall_score: number;
  confidence_level: string;
  text_score: number;
  location_score: number;
  time_score: number;
  attribute_score: number;
  image_score: number | null;
  score_breakdown: ScoreBreakdown;
  is_saved_match: boolean;
  match_id?: string | null;
}

/**
 * Get human-friendly confidence level text from overall score.
 */
export function getConfidenceLevel(score: number): string {
  if (score >= 0.80) return "Highly Likely Match";
  if (score >= 0.65) return "Strong Potential Match";
  if (score >= 0.45) return "Possible Match";
  return "Low Confidence";
}

/**
 * Get confidence color class or style tag.
 */
export function getConfidenceColor(score: number): {
  bg: string;
  text: string;
  border: string;
  badge: "success" | "warning" | "info" | "neutral";
} {
  if (score >= 0.80) {
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      badge: "success",
    };
  }
  if (score >= 0.65) {
    return {
      bg: "bg-primary-500/10",
      text: "text-primary-400",
      border: "border-primary-500/30",
      badge: "info",
    };
  }
  if (score >= 0.45) {
    return {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      badge: "warning",
    };
  }
  return {
    bg: "bg-surface-700/50",
    text: "text-surface-400",
    border: "border-surface-600/30",
    badge: "neutral",
  };
}
