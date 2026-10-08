"""
Campus Recover — Claim Pydantic Schemas

Enforces strict data encapsulation:
- Never exposes verification_answer_hash
- Never exposes finder contact information before approval
- Provides structured reviewer notes and status tracking
"""

import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ClaimStatus
from app.schemas.item import ItemResponse


class ClaimCreate(BaseModel):
    """Schema for submitting a new ownership claim on a found item."""
    item_id: uuid.UUID
    submitted_answer: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Claimant's answer to the verification question or proof of ownership description.",
    )


class ClaimReviewRequest(BaseModel):
    """Schema for reviewing, approving, or rejecting a claim."""
    status: ClaimStatus = Field(
        ...,
        description="Review decision: APPROVED or REJECTED.",
    )
    admin_notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Review feedback, handover directions, or rejection rationale.",
    )
    review_notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Alias for admin_notes.",
    )


class ClaimantInfo(BaseModel):
    """Claimant contact and profile summary."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    student_id: Optional[str] = None


class FinderContactInfo(BaseModel):
    """
    Contact details for the item finder.
    STRICT SECURITY RULE: Only exposed after claim is APPROVED.
    """
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str


class ClaimResponse(BaseModel):
    """
    Full claim details response.
    Never exposes verification_answer_hash or unapproved finder contact info.
    """
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    item_id: uuid.UUID
    claimant_id: uuid.UUID
    status: ClaimStatus
    verification_question: Optional[str] = None
    submitted_answer: str
    admin_notes: Optional[str] = None
    review_notes: Optional[str] = None
    auto_verification_passed: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    # Associated models
    item: Optional[ItemResponse] = None
    claimant: Optional[ClaimantInfo] = None
    finder_contact: Optional[FinderContactInfo] = None

    # Contextual permission helper flags
    can_review: bool = False
    can_mark_recovered: bool = False


class ClaimVerificationPrompt(BaseModel):
    """
    Public prompt returned when starting a claim on an item.
    Provides the verification question (if set) without exposing any answer hashes.
    """
    item_id: uuid.UUID
    item_title: str
    item_category: str
    has_verification_question: bool
    verification_question: Optional[str] = None
