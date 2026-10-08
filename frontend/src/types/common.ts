/**
 * Campus Recover — Common Type Definitions
 *
 * Shared types, enums, and interfaces used across the application.
 */

// ---- Enums ----

export enum UserRole {
  STUDENT = "STUDENT",
  STAFF = "STAFF",
  ADMIN = "ADMIN",
}

export enum ItemType {
  LOST = "LOST",
  FOUND = "FOUND",
}

export enum ItemStatus {
  ACTIVE = "ACTIVE",
  MATCHED = "MATCHED",
  CLAIMED = "CLAIMED",
  RECOVERED = "RECOVERED",
  CLOSED = "CLOSED",
}

export enum ItemCategory {
  ELECTRONICS = "ELECTRONICS",
  CLOTHING = "CLOTHING",
  ACCESSORIES = "ACCESSORIES",
  DOCUMENTS = "DOCUMENTS",
  KEYS = "KEYS",
  BAGS = "BAGS",
  BOOKS = "BOOKS",
  SPORTS = "SPORTS",
  OTHER = "OTHER",
}

export enum MatchStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum ClaimStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum NotificationType {
  MATCH_FOUND = "MATCH_FOUND",
  CLAIM_SUBMITTED = "CLAIM_SUBMITTED",
  CLAIM_APPROVED = "CLAIM_APPROVED",
  CLAIM_REJECTED = "CLAIM_REJECTED",
  ITEM_RECOVERED = "ITEM_RECOVERED",
  ADMIN_MESSAGE = "ADMIN_MESSAGE",
}

export enum ConfidenceLevel {
  HIGHLY_LIKELY = "Highly Likely Match",
  STRONG = "Strong Potential Match",
  POSSIBLE = "Possible Match",
  LOW = "Low Confidence",
}

// ---- API Response Types ----

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// ---- Utility Types ----

export interface SelectOption {
  value: string;
  label: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
