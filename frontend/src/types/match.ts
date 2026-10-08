/**
 * Campus Recover — Match Type Definitions
 */

import { ConfidenceLevel, MatchStatus } from "./common";
import { Item } from "./item";

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

export interface ScoreBreakdown {
  text: { score: number; reasons: string[] };
  image: { score: number | null; reasons: string[] };
  location: { score: number; distance_meters: number; reasons: string[] };
  time: { score: number; hours_difference: number; reasons: string[] };
  attributes: { score: number; reasons: string[] };
}

/**
 * Get confidence level from overall score.
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.9) return ConfidenceLevel.HIGHLY_LIKELY;
  if (score >= 0.75) return ConfidenceLevel.STRONG;
  if (score >= 0.6) return ConfidenceLevel.POSSIBLE;
  return ConfidenceLevel.LOW;
}

/**
 * Get confidence color class.
 */
export function getConfidenceColor(score: number): string {
  if (score >= 0.75) return "score-high";
  if (score >= 0.6) return "score-medium";
  return "score-low";
}
