"""
Campus Recover — Shared Database & Domain Enums
"""

import enum


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    STAFF = "STAFF"
    ADMIN = "ADMIN"


class ItemType(str, enum.Enum):
    LOST = "LOST"
    FOUND = "FOUND"


class ItemStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    MATCHED = "MATCHED"
    CLAIMED = "CLAIMED"
    RECOVERED = "RECOVERED"
    CLOSED = "CLOSED"


class ItemCategory(str, enum.Enum):
    ELECTRONICS = "ELECTRONICS"
    CLOTHING = "CLOTHING"
    ACCESSORIES = "ACCESSORIES"
    DOCUMENTS = "DOCUMENTS"
    KEYS = "KEYS"
    BAGS = "BAGS"
    BOOKS = "BOOKS"
    SPORTS = "SPORTS"
    OTHER = "OTHER"


class MatchStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class ClaimStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class NotificationType(str, enum.Enum):
    MATCH_FOUND = "MATCH_FOUND"
    CLAIM_SUBMITTED = "CLAIM_SUBMITTED"
    CLAIM_APPROVED = "CLAIM_APPROVED"
    CLAIM_REJECTED = "CLAIM_REJECTED"
    ITEM_RECOVERED = "ITEM_RECOVERED"
    ADMIN_MESSAGE = "ADMIN_MESSAGE"
