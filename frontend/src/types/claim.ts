/**
 * Campus Recover — Claim Type Definitions
 */

import { ClaimStatus } from "./common";

export interface Claim {
  id: string;
  item_id: string;
  claimant_id: string;
  verification_question: string;
  submitted_answer: string;
  status: ClaimStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClaimRequest {
  item_id: string;
  submitted_answer: string;
}

export interface UpdateClaimRequest {
  status: ClaimStatus;
  admin_notes?: string;
}
