"""
Campus Recover — Matches API Routes

Exposes endpoints for viewing AI match results, reviewing score breakdowns,
and confirming or rejecting candidate matches.
"""

import math
import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.enums import MatchStatus, UserRole
from app.schemas.match import MatchResponse, MatchCandidateResult
from app.schemas.common import ApiResponse, PaginationMeta
from app.services.match_service import match_service
from app.services.item_service import item_service
from app.ai.engine import matching_engine_service

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.get(
    "",
    response_model=ApiResponse[List[MatchResponse]],
    summary="List matches for current user's items",
)
def list_user_matches(
    status_filter: Optional[MatchStatus] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all AI-computed matches involving reports submitted by the current user.
    """
    matches, total = match_service.list_matches_for_user(
        db=db,
        user_id=current_user.id,
        status=status_filter,
        page=page,
        per_page=per_page,
    )

    total_pages = math.ceil(total / per_page) if per_page > 0 else 0

    return ApiResponse(
        success=True,
        data=[MatchResponse.model_validate(m) for m in matches],
        meta=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=total_pages,
        ),
    )


@router.get(
    "/{match_id}",
    response_model=ApiResponse[MatchResponse],
    summary="Get detailed match by ID",
)
def get_match(
    match_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch full match details, including dimensional scores and explainability breakdown.
    Only authorized participants or admins can view.
    """
    match = match_service.get_match_by_id(db=db, match_id=match_id)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match with ID '{match_id}' not found.",
        )

    # Authorization check
    is_lost_owner = match.lost_item and match.lost_item.user_id == current_user.id
    is_found_owner = match.found_item and match.found_item.user_id == current_user.id
    is_admin = current_user.role == UserRole.ADMIN

    if not (is_lost_owner or is_found_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this match report.",
        )

    return ApiResponse(
        success=True,
        data=MatchResponse.model_validate(match),
    )


@router.post(
    "/{match_id}/confirm",
    response_model=ApiResponse[MatchResponse],
    summary="Confirm a match candidate",
)
def confirm_match(
    match_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Confirm that the candidate match represents the correct recovered item.
    """
    match = match_service.get_match_by_id(db=db, match_id=match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    updated = match_service.update_match_status(db=db, match_id=match_id, status=MatchStatus.CONFIRMED)
    return ApiResponse(
        success=True,
        data=MatchResponse.model_validate(updated),
        message="Match confirmed successfully.",
    )


@router.post(
    "/{match_id}/reject",
    response_model=ApiResponse[MatchResponse],
    summary="Reject an inaccurate match candidate",
)
def reject_match(
    match_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reject an inaccurate match proposal.
    """
    match = match_service.get_match_by_id(db=db, match_id=match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found.")

    updated = match_service.update_match_status(db=db, match_id=match_id, status=MatchStatus.REJECTED)
    return ApiResponse(
        success=True,
        data=MatchResponse.model_validate(updated),
        message="Match rejected.",
    )


@router.get(
    "/item/{item_id}",
    response_model=ApiResponse[List[MatchResponse]],
    summary="List matches for a specific item",
)
def list_item_matches(
    item_id: uuid.UUID,
    status_filter: Optional[MatchStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all candidate matches calculated for a specific item.
    """
    item = item_service.get_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")

    if item.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    matches = match_service.list_matches_for_item(db=db, item_id=item_id, status=status_filter)
    return ApiResponse(
        success=True,
        data=[MatchResponse.model_validate(m) for m in matches],
    )
