"""
Campus Recover — Claims API Routes (Phase 8)

Handles:
- Starting ownership claims with verification questions
- Reviewing claimant proof of ownership (Finder / Admin)
- Releasing finder contact details only upon approval
- Handover confirmation and marking items recovered
- Administrative review queue and overrides
"""

import math
import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_admin
from app.models.user import User
from app.models.enums import ClaimStatus, UserRole
from app.schemas.claim import (
    ClaimCreate,
    ClaimReviewRequest,
    ClaimResponse,
    ClaimVerificationPrompt,
)
from app.schemas.common import ApiResponse, PaginationMeta
from app.services.claim_service import claim_service
from app.services.item_service import item_service

router = APIRouter(prefix="/claims", tags=["Claims"])


@router.get(
    "/prompt/{item_id}",
    response_model=ApiResponse[ClaimVerificationPrompt],
    summary="Get verification challenge question for an item",
)
def get_verification_prompt(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the challenge question configured by the finder.
    Never exposes private answer hashes or finder contact info.
    """
    prompt = claim_service.get_verification_prompt(db=db, item_id=item_id)
    return ApiResponse(success=True, data=prompt)


@router.post(
    "",
    response_model=ApiResponse[ClaimResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit an ownership claim on a found item",
)
def create_claim(
    claim_in: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Claim an item by answering the finder's verification question
    or providing unique physical descriptors proving ownership.
    """
    created_claim = claim_service.create_claim(
        db=db, claimant=current_user, claim_in=claim_in
    )
    return ApiResponse(
        success=True,
        data=claim_service.build_claim_response(created_claim, viewer=current_user),
        message="Ownership claim submitted successfully. The finder will review your answer.",
    )


@router.get(
    "/my-claims",
    response_model=ApiResponse[List[ClaimResponse]],
    summary="List claims submitted by the current user",
)
def list_my_claims(
    status_filter: Optional[ClaimStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all claims filed by the currently logged-in student.
    """
    claims, total = claim_service.list_my_claims(
        db=db,
        claimant_id=current_user.id,
        status_filter=status_filter,
        page=page,
        per_page=per_page,
    )
    total_pages = math.ceil(total / per_page) if per_page > 0 else 0

    return ApiResponse(
        success=True,
        data=[claim_service.build_claim_response(c, viewer=current_user) for c in claims],
        meta=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
        ),
    )


@router.get(
    "/incoming",
    response_model=ApiResponse[List[ClaimResponse]],
    summary="List claims received on items found by current user",
)
def list_incoming_claims(
    status_filter: Optional[ClaimStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve claims awaiting review on items reported as found by the current user.
    """
    claims, total = claim_service.list_incoming_claims(
        db=db,
        finder_id=current_user.id,
        status_filter=status_filter,
        page=page,
        per_page=per_page,
    )
    total_pages = math.ceil(total / per_page) if per_page > 0 else 0

    return ApiResponse(
        success=True,
        data=[claim_service.build_claim_response(c, viewer=current_user) for c in claims],
        meta=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
        ),
    )


@router.get(
    "/admin",
    response_model=ApiResponse[List[ClaimResponse]],
    summary="Admin review queue of all campus claims",
)
def list_admin_claims(
    status_filter: Optional[ClaimStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """
    Campus-wide review queue for administrators to oversee, audit, and resolve claims.
    """
    claims, total = claim_service.list_admin_claims(
        db=db,
        status_filter=status_filter,
        page=page,
        per_page=per_page,
    )
    total_pages = math.ceil(total / per_page) if per_page > 0 else 0

    return ApiResponse(
        success=True,
        data=[claim_service.build_claim_response(c, viewer=admin_user) for c in claims],
        meta=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
        ),
    )


@router.get(
    "/item/{item_id}",
    response_model=ApiResponse[List[ClaimResponse]],
    summary="List all claims on a specific item (Finder / Admin only)",
)
def list_item_claims(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all claims submitted on a specific found item.
    Only the report owner (finder) or an administrator can access.
    """
    item = item_service.get_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )

    if item.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view claims for this item.",
        )

    claims = claim_service.list_item_claims(db=db, item_id=item_id)
    return ApiResponse(
        success=True,
        data=[claim_service.build_claim_response(c, viewer=current_user) for c in claims],
    )


@router.get(
    "/{claim_id}",
    response_model=ApiResponse[ClaimResponse],
    summary="Get claim details by ID",
)
def get_claim(
    claim_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch full claim details.
    Authorized for: Claimant, Finder, or Admin.
    Finder contact details are masked unless status is APPROVED.
    """
    claim = claim_service.get_claim(db=db, claim_id=claim_id)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with ID '{claim_id}' not found.",
        )

    is_claimant = claim.claimant_id == current_user.id
    is_finder = claim.item and claim.item.user_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_claimant or is_finder or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this claim.",
        )

    return ApiResponse(
        success=True,
        data=claim_service.build_claim_response(claim, viewer=current_user),
    )


@router.post(
    "/{claim_id}/review",
    response_model=ApiResponse[ClaimResponse],
    summary="Review claim: Approve or Reject (Finder / Admin)",
)
def review_claim(
    claim_id: uuid.UUID,
    review_in: ClaimReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve or reject a submitted claim.
    Upon approval, contact details become unlocked for pickup coordination.
    """
    updated_claim = claim_service.review_claim(
        db=db,
        claim_id=claim_id,
        reviewer=current_user,
        review_in=review_in,
    )
    return ApiResponse(
        success=True,
        data=claim_service.build_claim_response(updated_claim, viewer=current_user),
        message=f"Claim has been {updated_claim.status.value.lower()}.",
    )


@router.post(
    "/{claim_id}/approve",
    response_model=ApiResponse[ClaimResponse],
    summary="Quick approve claim",
)
def approve_claim(
    claim_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Shortcut to approve a claim."""
    review_req = ClaimReviewRequest(
        status=ClaimStatus.APPROVED,
        admin_notes="Verification answer approved by reviewer.",
    )
    updated_claim = claim_service.review_claim(
        db=db,
        claim_id=claim_id,
        reviewer=current_user,
        review_in=review_req,
    )
    return ApiResponse(
        success=True,
        data=claim_service.build_claim_response(updated_claim, viewer=current_user),
        message="Claim approved. Contact details are now available for recovery coordination.",
    )


@router.post(
    "/{claim_id}/reject",
    response_model=ApiResponse[ClaimResponse],
    summary="Quick reject claim",
)
def reject_claim(
    claim_id: uuid.UUID,
    notes: Optional[str] = Query(None, description="Rejection reason"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Shortcut to reject an inaccurate claim."""
    review_req = ClaimReviewRequest(
        status=ClaimStatus.REJECTED,
        admin_notes=notes or "Submitted verification answers did not match identifying features.",
    )
    updated_claim = claim_service.review_claim(
        db=db,
        claim_id=claim_id,
        reviewer=current_user,
        review_in=review_req,
    )
    return ApiResponse(
        success=True,
        data=claim_service.build_claim_response(updated_claim, viewer=current_user),
        message="Claim rejected.",
    )


@router.post(
    "/{claim_id}/recovered",
    response_model=ApiResponse[ClaimResponse],
    summary="Confirm item physical recovery handover",
)
def mark_recovered(
    claim_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark the item as RECOVERED once physical custody is returned.
    Authorized for: Claimant, Finder, or Admin.
    """
    updated_claim = claim_service.mark_recovered(
        db=db, claim_id=claim_id, user=current_user
    )
    return ApiResponse(
        success=True,
        data=claim_service.build_claim_response(updated_claim, viewer=current_user),
        message="Item marked as RECOVERED. Thank you for using Campus Recover!",
    )
