/**
 * Campus Recover — Claim Type Definitions (Phase 8)
 */

import { ClaimStatus } from "./common";
import { Item } from "./item";

export interface ClaimantInfo {
  id: string;
  name: string;
  email: string;
  student_id?: string;
  role?: string;
}

export interface FinderContactInfo {
  id: string;
  name: string;
  email: string;
}

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  status: ClaimStatus;
  verification_question?: string | null;
  submitted_answer: string;
  admin_notes?: string | null;
  review_notes?: string | null;
  auto_verification_passed?: boolean | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  item?: Item;
  claimant?: ClaimantInfo;
  finder_contact?: FinderContactInfo;

  // Action capabilities
  can_review?: boolean;
  can_mark_recovered?: boolean;
}

export interface CreateClaimRequest {
  item_id: string;
  submitted_answer: string;
}

export interface ClaimReviewRequest {
  status: ClaimStatus;
  admin_notes?: string;
  review_notes?: string;
}

export interface ClaimVerificationPrompt {
  item_id: string;
  item_title: string;
  item_category: string;
  has_verification_question: boolean;
  verification_question?: string | null;
}
